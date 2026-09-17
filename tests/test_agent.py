"""
Unit Tests for Agent Core.

Validates the end-to-end cognitive loop:
PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT
"""

import asyncio
import json
import sys
from pathlib import Path
import unittest

# Ensure project root is in sys.path so 'backend' is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.agent.agent import AgentCore
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry
from backend.agent.llm import BaseLLM


class FakeTool:
    """Minimal fake tool for testing the agent tool-execution loop."""

    name = "fake_tool"
    description = "A minimal fake tool that returns a test result."

    def __init__(self):
        self.called = False
        self.call_count = 0
        self.last_arguments = None

    def execute(self, arguments: dict):
        self.called = True
        self.call_count += 1
        self.last_arguments = arguments
        return {
            "status": "success",
            "data": "test result",
        }


class FakeLLM(BaseLLM):
    """Minimal fake LLM that simulates a two-step reasoning trajectory."""

    def __init__(self):
        self.call_count = 0
        self.received_histories = []

    async def generate(self, task: str = "", history=None, tools=None, **kwargs) -> str:
        self.call_count += 1
        self.received_histories.append(list(history) if history else [])

        if self.call_count == 1:
            # Turn 1: Request tool execution
            return json.dumps({
                "type": "tool_call",
                "tool": "fake_tool",
                "arguments": {"query": "sample"},
                "thought": "Calling fake_tool to perform work.",
            })
        else:
            # Turn 2: Deliver final answer after observing tool result
            return json.dumps({
                "type": "final",
                "answer": "Task completed successfully.",
            })


class TestAgentCore(unittest.TestCase):
    """Test suite for AgentCore initialization and autonomous execution flow."""

    def setUp(self):
        self.agent = AgentCore(
            memory=AgentMemory(),
            planner=Planner(),
            registry=ToolRegistry(),
        )

    def test_agent_initialization(self):
        """Verify AgentCore initializes with dependencies."""
        self.assertIsNotNone(self.agent.memory)
        self.assertIsNotNone(self.agent.planner)
        self.assertIsNotNone(self.agent.registry)

    def test_agent_execution_flow(self):
        """
        Validate the complete autonomous flow:
        1. Agent receives a simple task.
        2. Fake LLM first returns a tool_call for the fake tool.
        3. Agent retrieves the tool through ToolRegistry.
        4. Agent executes the fake tool.
        5. Fake tool returns {"status": "success", "data": "test result"}.
        6. Agent stores the observation in Memory.
        7. Fake LLM receives the updated history.
        8. Fake LLM returns {"type": "final", "answer": "Task completed successfully."}.
        9. Agent returns the final answer.
        """
        # Step 3 & 4 setup: Register the minimal fake tool in ToolRegistry
        fake_tool = FakeTool()
        registry = ToolRegistry()
        registry.register(fake_tool)

        # Step 2 & 7 setup: Minimal fake LLM
        fake_llm = FakeLLM()

        # Step 1 setup: Initialize AgentCore with fake LLM and registry
        agent = AgentCore(
            llm=fake_llm,
            registry=registry,
        )

        # Step 1: Agent receives a simple task and executes the loop
        task = "Execute test task"
        final_answer = asyncio.run(agent.run(task))

        # --- Assertions ---

        # 1. Verify that the tool was actually called
        self.assertTrue(fake_tool.called, "Fake tool must be called")
        self.assertEqual(fake_tool.call_count, 1, "Fake tool must be called exactly once")
        self.assertEqual(fake_tool.last_arguments, {"query": "sample"})

        # 2. Verify that the tool result reached Memory
        history = agent.memory.get_history()
        tool_results = [msg for msg in history if msg.get("role") == "tool_result"]
        self.assertEqual(len(tool_results), 1, "Memory should contain 1 tool_result entry")
        self.assertEqual(tool_results[0]["content"], "test result")

        # 3. Verify that the LLM was called more than once
        self.assertGreater(fake_llm.call_count, 1, "LLM must be called more than once")
        self.assertEqual(fake_llm.call_count, 2, "LLM should be called exactly twice")

        # 3b. Verify that Fake LLM received the updated history containing the observation
        second_call_history = fake_llm.received_histories[1]
        history_contents = [msg.get("content") for msg in second_call_history]
        self.assertIn(
            "test result",
            history_contents,
            "Fake LLM must receive updated history containing the tool observation",
        )

        # 4. Verify that the final answer is returned
        self.assertEqual(final_answer, "Task completed successfully.")
        self.assertEqual(agent.final_answer, "Task completed successfully.")

        # 5. Verify that the Agent completes successfully
        self.assertEqual(agent.status, "completed")


if __name__ == "__main__":
    unittest.main()
