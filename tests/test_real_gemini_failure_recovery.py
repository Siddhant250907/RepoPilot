"""
Integration Test: Real Gemini Failure Recovery.

Goal:
Demonstrate that the REAL Gemini model can encounter a tool failure,
receive that failure as an observation, and autonomously choose another tool/action to continue.

Requirements:
- Uses existing AgentCore, LLMInterface, create_default_registry(), Planner, Parser, tools.
- Does NOT hardcode the recovery tool.
- Provides a deterministic diagnostic failure via a safe script in a temp workspace.
- Verifies failure occurred, was fed back into memory/loop, recovery action occurred, and final answer produced.
- Prints clear execution trace:
    [PLAN]
    [TOOL CALL]
    [TOOL RESULT: ERROR]
    [REFLECTION]
    [NEXT TOOL CALL]
    [TOOL RESULT: SUCCESS]
    [FINAL]
"""

import asyncio
import json
import os
from pathlib import Path
from dotenv import load_dotenv
import pytest

# Load environment configuration from .env
load_dotenv()

from backend.agent.agent import AgentCore, create_default_registry
from backend.agent.events import EventBus, EventType
from backend.agent.llm import LLMInterface
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner


def test_real_gemini_failure_recovery(tmp_path, monkeypatch):
    """
    Execute AgentCore with real Gemini LLM in a temporary workspace.
    A diagnostic command fails deterministically, and the agent must
    autonomously recover, inspect files, and determine the root cause.
    """
    # 1. Setup temporary workspace
    monkeypatch.chdir(tmp_path)

    # Known piece of information in workspace
    bug_file = tmp_path / "bug.txt"
    bug_file.write_text(
        "ROOT_CAUSE=database_connection_timeout\n"
        "Details: PostgreSQL primary instance in cluster pool unreachable on port 5432. "
        "Connection attempts timed out after 30 seconds.\n"
    )

    # Deterministic diagnostic script that fails safely with exit code 1
    diag_script = tmp_path / "check_health.py"
    diag_script.write_text(
        "import sys\n"
        "sys.stderr.write('Diagnostic check failed: database connection refused on port 5432\\n')\n"
        "sys.exit(1)\n"
    )

    # 2. Instantiate real components
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

    # 3. Formulate investigation task
    task = (
        "Investigate the reported problem. Start by running the diagnostic command 'python check_health.py'. "
        "If a command fails, treat the failure as an observation and inspect the available project files "
        "to determine the root cause. Report the root cause."
    )

    # 4. Execute autonomous agent loop
    result = asyncio.run(agent.execute_task(task))

    # 5. Print clearly formatted execution trace
    print("\n" + "=" * 70)
    print("=================== AGENT EXECUTION TRACE ===================")
    print("=" * 70)

    trajectory = agent.memory.get_context() or result.get("trajectory", [])
    seen_first_tool_call = False
    has_encountered_error = False

    for item in trajectory:
        role_type = str(item.get("type") or item.get("role") or "UNKNOWN").upper()
        content = item.get("content", "")

        if "PLAN" in role_type and "REPLAN" not in role_type:
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
            if not seen_first_tool_call:
                print("\n[TOOL CALL]")
                seen_first_tool_call = True
            elif has_encountered_error:
                print("\n[NEXT TOOL CALL]")
            else:
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
            is_err = False
            if isinstance(content, dict):
                is_err = content.get("status") == "error" or content.get("exit_code", 0) != 0 or "error" in content
            elif role_type == "TOOL_ERROR":
                is_err = True

            if is_err:
                has_encountered_error = True
                print("\n[TOOL RESULT: ERROR]")
            else:
                print("\n[TOOL RESULT: SUCCESS]")

            if isinstance(content, dict):
                data = content.get("data") or content.get("error") or content.get("stderr") or content.get("result") or content
                data_str = str(data)
                if len(data_str) > 400:
                    data_str = data_str[:400] + "... [truncated]"
                status = content.get("status", "error" if is_err else "success")
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

    # 6. Verification and Assertions

    # 6a. Verify a real Gemini-generated tool call occurred
    action_events = [
        e for e in events
        if e.event_type in (EventType.ACTION_SELECTED, EventType.TOOL_CALL, EventType.TOOL_STARTED)
    ]
    assert len(action_events) >= 2, (
        f"Expected at least two tool call events (initial + recovery), got {len(action_events)}"
    )

    # 6b. Verify at least one tool result has status 'error'
    error_events = [
        e for e in events
        if e.event_type == EventType.ERROR_ENCOUNTERED
        or (e.event_type == EventType.TOOL_FINISHED and isinstance(e.payload, dict) and (
            e.payload.get("result", {}).get("status") == "error"
            or e.payload.get("result", {}).get("exit_code", 0) != 0
        ))
    ]
    assert len(error_events) > 0, "Expected at least one tool failure/error event in trace."

    # 6c. Verify the error was fed back into the Agent loop / memory
    error_in_trajectory = any(
        (
            item.get("role") == "tool_error"
            or (isinstance(item.get("content"), dict) and item["content"].get("status") == "error")
            or "error" in str(item.get("type", "")).lower()
        )
        for item in trajectory
    )
    assert error_in_trajectory, "Expected the tool error to be recorded in agent trajectory memory."

    # 6d. Verify another tool/action occurred after the failure
    first_error_index = -1
    for idx, item in enumerate(trajectory):
        if (
            item.get("role") == "tool_error"
            or (isinstance(item.get("content"), dict) and item["content"].get("status") == "error")
        ):
            first_error_index = idx
            break

    actions_after_error = [
        item for idx, item in enumerate(trajectory)
        if idx > first_error_index and item.get("type") == "ACTION"
    ]
    assert len(actions_after_error) >= 1, (
        f"Expected at least one autonomous action after the error, found {len(actions_after_error)}"
    )

    # Verify recovery tool was from registered tools without hardcoding which one
    recovery_tool = actions_after_error[0].get("content", {}).get("tool_name") or actions_after_error[0].get("content", {}).get("tool")
    assert recovery_tool in registered_tool_names, (
        f"Recovery tool '{recovery_tool}' is not in registered tools: {registered_tool_names}"
    )

    # 6e. Verify the Agent eventually produced a final response
    assert result.get("status") == "success", (
        f"Agent did not complete with success status. Status: {result.get('status')}"
    )
    final_answer = result.get("final_answer", "")
    assert final_answer and len(final_answer.strip()) > 0, "Agent returned an empty final answer."

    # Verify that the final answer accurately identifies the root cause
    assert "database_connection_timeout" in final_answer or "database" in final_answer.lower(), (
        f"Expected root cause in final answer, got: {final_answer}"
    )
