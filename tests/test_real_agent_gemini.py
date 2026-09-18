"""
Integration Test: Run AgentCore with REAL Gemini LLM and default tool registry.
Task: 'Read README.md and tell me what this project is about.'
"""

import asyncio
import json
import os
from dotenv import load_dotenv
import pytest

# Load environment configuration from .env
load_dotenv()

from backend.agent.agent import AgentCore, create_default_registry
from backend.agent.events import EventBus, EventType
from backend.agent.llm import LLMInterface
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner


def test_real_agent_gemini_end_to_end():
    """
    Execute AgentCore with real Gemini LLM.
    Verify:
    1. Agent execution completes without exception.
    2. A tool_call event occurred.
    3. The selected tool was one of the registered tools.
    4. A final event/answer was produced.
    """
    # 1. Initialize real components
    llm = LLMInterface()
    assert bool(llm.api_key), "Gemini API key must be configured in environment or .env"

    registry = create_default_registry()
    registered_tool_names = set(tool.name for tool in registry.get_all())

    event_bus = EventBus()
    events = []
    event_bus.subscribe(lambda evt: events.append(evt))

    memory = AgentMemory()
    planner = Planner()

    agent = AgentCore(
        llm=llm,
        memory=memory,
        planner=planner,
        registry=registry,
        event_bus=event_bus,
        max_iterations=8,
    )

    # 2. Execute task
    task = "Read README.md and tell me what this project is about."
    result = asyncio.run(agent.execute_task(task))

    # 3. Print human-readable execution trace
    print("\n" + "=" * 70)
    print("=================== AGENT EXECUTION TRACE ===================")
    print("=" * 70)

    trajectory = agent.memory.get_context() or result.get("trajectory", [])
    for item in trajectory:
        role_type = str(item.get("type") or item.get("role") or "UNKNOWN").upper()
        content = item.get("content", "")

        if "PLAN" in role_type:
            print("\n[PLAN]")
            if isinstance(content, dict):
                plan_list = content.get("plan", [])
                for p in plan_list:
                    print(f"  - {p}")
            elif isinstance(content, list):
                for p in content:
                    print(f"  - {p}")
            else:
                print(f"  {content}")

        elif role_type in ("ACTION", "TOOL_CALL"):
            print("\n[TOOL CALL]")
            if isinstance(content, dict):
                tool = content.get("tool") or content.get("tool_name")
                args = content.get("arguments") if "arguments" in content else content.get("tool_args", {})
                thought = content.get("thought", "")
                if thought:
                    print(f"  Thought: {thought}")
                print(f"  Tool: {tool}")
                print(f"  Arguments: {json.dumps(args, default=str)}")
            else:
                print(f"  {content}")

        elif role_type in ("OBSERVATION", "TOOL_RESULT", "TOOL_ERROR"):
            print("\n[TOOL RESULT]")
            if isinstance(content, dict):
                data = content.get("data") or content.get("result") or content.get("error") or content
                data_str = str(data)
                if len(data_str) > 400:
                    data_str = data_str[:400] + "... [truncated]"
                status = content.get("status", "success" if "error" not in content else "error")
                print(f"  Status: {status}")
                print(f"  Data: {data_str}")
            else:
                obs_str = str(content)
                if len(obs_str) > 400:
                    obs_str = obs_str[:400] + "... [truncated]"
                print(f"  {obs_str}")

        elif "REFLECT" in role_type:
            print("\n[REFLECTION]")
            if isinstance(content, dict):
                thought = content.get("thought", "")
                print(f"  {thought or 'Evaluated step outcome; continuing.'}")
            else:
                print(f"  {content}")

        elif role_type in ("FINAL", "ASSISTANT"):
            print("\n[FINAL]")
            if isinstance(content, dict):
                print(f"  Answer: {content.get('answer', content.get('final_answer', ''))}")
            else:
                print(f"  {content}")

    print("\n" + "=" * 70)
    print(f"FINAL ANSWER:\n{result.get('final_answer')}")
    print("=" * 70 + "\n")

    # 4. Assertions

    # 4a. Verify Agent execution completes successfully without exception
    assert result.get("status") == "success", (
        f"Agent did not complete successfully. Status: {result.get('status')}, Answer: {result.get('final_answer')}"
    )
    final_answer = result.get("final_answer", "")
    assert final_answer and len(final_answer.strip()) > 0, "Agent returned an empty final answer."

    # 4b. Verify a tool_call event occurred
    action_events = [
        e for e in events
        if e.event_type in (EventType.ACTION_SELECTED, EventType.TOOL_CALL, EventType.TOOL_STARTED)
    ]
    assert len(action_events) > 0, "Expected at least one tool call event in trace."

    # 4c. Verify the selected tool was one of the registered tools
    selected_tools = []
    for e in events:
        if e.event_type == EventType.ACTION_SELECTED and isinstance(e.payload, dict):
            tool = e.payload.get("tool") or e.payload.get("tool_name")
            if tool:
                selected_tools.append(tool)
        elif e.event_type == EventType.TOOL_STARTED and isinstance(e.payload, dict):
            tool = e.payload.get("tool")
            if tool:
                selected_tools.append(tool)

    for item in trajectory:
        if item.get("type") == "ACTION" and isinstance(item.get("content"), dict):
            t = item["content"].get("tool") or item["content"].get("tool_name")
            if t:
                selected_tools.append(t)

    assert len(selected_tools) > 0, "At least one tool must have been selected by Gemini."
    for tool_name in selected_tools:
        assert tool_name in registered_tool_names, (
            f"Selected tool '{tool_name}' is not in registered tools: {registered_tool_names}"
        )

    # 4d. Verify a final event/answer was produced
    completion_events = [
        e for e in events
        if e.event_type in (EventType.TASK_COMPLETED, EventType.FINAL)
    ]
    assert len(completion_events) > 0, "Expected a task completion event in trace."
