"""
Unit Tests for Agent Core.

Validates the end-to-end cognitive loop:
PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT
Including autonomous failure recovery.
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


class FailingTool:
    """Fake first tool that fails with a structured error."""

    name = "first_tool"
    description = "A tool that simulates an execution failure."

    def __init__(self):
        self.called = False
        self.call_count = 0

    def execute(self, arguments: dict):
        self.called = True
        self.call_count += 1
        return {
            "status": "error",
            "error": "Simulated tool failure",
        }


class RecoveryTool:
    """Fake second tool that executes successfully."""

    name = "second_tool"
    description = "A tool that executes successfully for recovery."

    def __init__(self):
        self.called = False
        self.call_count = 0

    def execute(self, arguments: dict):
        self.called = True
        self.call_count += 1
        return {
            "status": "success",
            "data": "Recovered successfully",
        }


class FailureRecoveryLLM(BaseLLM):
    """
    Fake LLM that demonstrates autonomous recovery from a tool failure:
    - Call 1: selects first_tool
    - Call 2: inspects tool failure from history, then selects second_tool
    - Call 3: returns final answer
    """

    def __init__(self):
        self.call_count = 0
        self.received_histories = []
        self.observed_error_in_history = False

    async def generate(self, task: str = "", history=None, tools=None, **kwargs) -> str:
        self.call_count += 1
        current_history = list(history) if history else []
        self.received_histories.append(current_history)

        if self.call_count == 1:
            # First call: return a tool_call for the first tool
            return json.dumps({
                "type": "tool_call",
                "tool": "first_tool",
                "arguments": {"step": 1},
                "thought": "Attempting action using first_tool.",
            })
        elif self.call_count == 2:
            # Second call: inspect previous failure from conversation history
            error_found = any(
                "Simulated tool failure" in str(msg.get("content", ""))
                for msg in current_history
            )
            self.observed_error_in_history = error_found

            # Return a tool_call for the second tool to recover
            return json.dumps({
                "type": "tool_call",
                "tool": "second_tool",
                "arguments": {"step": 2},
                "thought": "first_tool failed; switching to second_tool to recover.",
            })
        else:
            # Third call: return a final answer
            return json.dumps({
                "type": "final",
                "answer": "Task recovered and completed successfully.",
            })


class TestAgentCore(unittest.TestCase):
    """Test suite for AgentCore initialization and autonomous execution flows."""

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
        fake_tool = FakeTool()
        registry = ToolRegistry()
        registry.register(fake_tool)

        fake_llm = FakeLLM()

        agent = AgentCore(
            llm=fake_llm,
            registry=registry,
        )

        task = "Execute test task"
        final_answer = asyncio.run(agent.run(task))

        # --- Assertions ---
        self.assertTrue(fake_tool.called, "Fake tool must be called")
        self.assertEqual(fake_tool.call_count, 1, "Fake tool must be called exactly once")
        self.assertEqual(fake_tool.last_arguments, {"query": "sample"})

        history = agent.memory.get_history()
        tool_results = [msg for msg in history if msg.get("role") == "tool_result"]
        self.assertEqual(len(tool_results), 1, "Memory should contain 1 tool_result entry")
        self.assertEqual(tool_results[0]["content"], "test result")

        self.assertGreater(fake_llm.call_count, 1, "LLM must be called more than once")
        self.assertEqual(fake_llm.call_count, 2, "LLM should be called exactly twice")

        second_call_history = fake_llm.received_histories[1]
        history_contents = [msg.get("content") for msg in second_call_history]
        self.assertIn(
            "test result",
            history_contents,
            "Fake LLM must receive updated history containing the tool observation",
        )

        self.assertEqual(final_answer, "Task completed successfully.")
        self.assertEqual(agent.final_answer, "Task completed successfully.")
        self.assertEqual(agent.status, "completed")

    def test_agent_failure_recovery_flow(self):
        """
        Validate autonomous failure recovery:
        1. Agent calls first_tool, which returns status="error".
        2. Agent records error observation in Memory without terminating.
        3. Fake LLM inspects the error in history and invokes second_tool.
        4. Agent executes second_tool, which succeeds.
        5. Fake LLM returns final answer.
        6. Agent returns final answer and completes.
        """
        # Register both tools in registry
        first_tool = FailingTool()
        second_tool = RecoveryTool()
        registry = ToolRegistry()
        registry.register(first_tool)
        registry.register(second_tool)

        # Setup failure recovery LLM
        fake_llm = FailureRecoveryLLM()

        # Initialize Agent
        agent = AgentCore(
            llm=fake_llm,
            registry=registry,
        )

        # Run task
        task = "Execute resilient task"
        final_answer = asyncio.run(agent.run(task))

        # --- Verification Assertions ---

        # 1. The first tool was called
        self.assertTrue(first_tool.called, "First tool must be called")
        self.assertEqual(first_tool.call_count, 1, "First tool should be called once")

        # 2. Its error was stored in the Agent history
        history = agent.memory.get_history()
        error_entries = [msg for msg in history if msg.get("role") == "tool_error"]
        self.assertGreaterEqual(len(error_entries), 1, "Agent history must contain tool_error")
        self.assertTrue(
            any("Simulated tool failure" in str(msg.get("content")) for msg in error_entries),
            "Error message must be stored in Agent history",
        )

        # 3. The LLM received the error
        self.assertTrue(
            fake_llm.observed_error_in_history,
            "LLM must receive and inspect the failure in history on the second call",
        )

        # 4. The second tool was called
        self.assertTrue(second_tool.called, "Second tool must be called after first tool failure")
        self.assertEqual(second_tool.call_count, 1, "Second tool should be called once")

        # 5. The second tool succeeded
        tool_results = [msg for msg in history if msg.get("role") == "tool_result"]
        self.assertGreaterEqual(len(tool_results), 1, "Agent history must contain tool_result")
        self.assertTrue(
            any("Recovered successfully" in str(msg.get("content")) for msg in tool_results),
            "Second tool's successful output must reach memory",
        )

        # 6. The Agent eventually returned the final answer
        self.assertEqual(final_answer, "Task recovered and completed successfully.")
        self.assertEqual(agent.final_answer, "Task recovered and completed successfully.")

        # 7. The Agent did not terminate after the first tool failure
        self.assertEqual(agent.status, "completed")
        self.assertEqual(fake_llm.call_count, 3, "Agent must progress through 3 iterations to recover")


if __name__ == "__main__":
    unittest.main()
