"""
Unit Tests for AgentCore Orchestration and Autonomous Reasoning Loop.

Owner: Person 1 (Agent Core)

Responsibilities:
- Verify AgentCore initializes dependencies correctly.
- Verify basic single-turn execution to final answer.
- Verify multi-turn execution (Plan -> Act -> Observe -> Reflect -> Repeat).
- Verify dynamic ToolRegistry dispatch and observation recording.
- Verify failure recovery when tools or LLMs encounter errors.
- Verify iteration limits terminate safely without crashing.
- Verify EventBus emits lifecycle events.
"""

import asyncio
import json
import unittest
from typing import Any, Dict, List, Optional

from backend.agent.agent import AgentCore
from backend.agent.events import EventBus, EventType
from backend.agent.llm import BaseLLM, MockLLMInterface
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry
from backend.tools.base import ToolResult


# ==============================================================================
# Test Fixtures & Mock Tools
# ==============================================================================

class MockTool:
    """Mock tool supporting ToolResult contracts and configurable failures."""

    name = "mock_tool"
    description = "Mock tool for testing agent core loop."
    input_schema = {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": [],
    }

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        self.call_count = 0
        self.last_arguments = None

    def execute(self, arguments=None, **kwargs):
        self.call_count += 1
        self.last_arguments = arguments if arguments is not None else kwargs
        if self.should_fail:
            return ToolResult({"status": "error", "error": "Mock tool failed as requested."})
        return ToolResult({
            "status": "success",
            "data": "Mock execution completed successfully.",
            "tool": self.name,
        })


class FakeTool:
    """Fake tool that succeeds and captures invocation arguments."""

    name = "fake_tool"
    description = "A fake tool for testing the agent loop."

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


class FailingTool:
    """Fake tool that intentionally fails to test recovery."""

    name = "first_tool"
    description = "A tool that intentionally fails to test recovery."

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


class FakeLLM(BaseLLM):
    """
    Fake LLM simulating a 2-step execution:
    1. Returns a tool_call for fake_tool
    2. Receives observation and returns final answer
    """

    def __init__(self):
        self.call_count = 0
        self.received_histories = []

    async def generate(self, task: str = "", history=None, tools=None, **kwargs) -> str:
        self.call_count += 1
        self.received_histories.append(list(history) if history else [])

        if self.call_count == 1:
            return json.dumps({
                "type": "tool_call",
                "tool": "fake_tool",
                "arguments": {"query": "sample"},
            })
        else:
            return json.dumps({
                "type": "final",
                "answer": "Task completed successfully.",
            })


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
            return json.dumps({
                "type": "tool_call",
                "tool": "first_tool",
                "arguments": {"step": 1},
                "thought": "Attempting action using first_tool.",
            })
        elif self.call_count == 2:
            error_found = any(
                "Simulated tool failure" in str(msg.get("content", ""))
                for msg in current_history
            )
            self.observed_error_in_history = error_found

            return json.dumps({
                "type": "tool_call",
                "tool": "second_tool",
                "arguments": {"step": 2},
                "thought": "first_tool failed; switching to second_tool to recover.",
            })
        else:
            return json.dumps({
                "type": "final",
                "answer": "Task recovered and completed successfully.",
            })


# ==============================================================================
# AgentCore Test Suite
# ==============================================================================

class TestAgentCore(unittest.TestCase):
    """Test suite for AgentCore loop, tool execution, memory, and failure handling."""

    def setUp(self):
        self.registry = ToolRegistry()
        self.mock_tool = MockTool(should_fail=False)
        self.registry.register(self.mock_tool)
        self.planner = Planner()
        self.memory = AgentMemory()
        self.event_bus = EventBus()
        self.agent = AgentCore(
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            event_bus=self.event_bus,
        )

    def test_agent_initialization(self):
        """Verify AgentCore initializes with dependencies and default tools if needed."""
        self.assertIsNotNone(self.agent.memory)
        self.assertIsNotNone(self.agent.planner)
        self.assertIsNotNone(self.agent.registry)
        self.assertIsNotNone(self.agent.event_bus)

    def test_agent_default_tools_integration(self):
        """
        Verify that default AgentCore initializes and registers all 4 Person 2 tools:
        - file_tool (FileTool)
        - shell_tool (ShellTool)
        - search_tool (SearchTool)
        - calculator_tool (CalculatorTool)
        And that AgentCore can retrieve each tool by name.
        """
        agent = AgentCore()
        tool_names = [tool.name for tool in agent.registry.get_all()]
        self.assertEqual(len(agent.registry), 4)
        self.assertIn("file_tool", tool_names)
        self.assertIn("shell_tool", tool_names)
        self.assertIn("search_tool", tool_names)
        self.assertIn("calculator_tool", tool_names)

        # Verify retrieval by name via registry.get() and registry.get_tool()
        for expected_name in ["file_tool", "shell_tool", "search_tool", "calculator_tool"]:
            tool = agent.registry.get(expected_name)
            self.assertIsNotNone(tool, f"Tool '{expected_name}' should be retrievable via get()")
            self.assertEqual(tool.name, expected_name)
            retrieved_tool = agent.registry.get_tool(expected_name)
            self.assertIsNotNone(retrieved_tool, f"Tool '{expected_name}' should be retrievable via get_tool()")
            self.assertEqual(retrieved_tool.name, expected_name)

    def test_basic_loop_task_to_final_answer(self):
        """Test single-turn loop where LLM directly provides final answer."""
        mock_llm = MockLLMInterface(responses=[
            {
                "thought": "This task is straightforward and requires no tool calls.",
                "final_answer": "42 is the answer."
            }
        ])

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            event_bus=self.event_bus,
        )

        result = asyncio.run(agent.execute_task("What is the meaning of life?"))

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["final_answer"], "42 is the answer.")
        self.assertEqual(result["iterations"], 1)

        # Verify planner created initial plan in trajectory
        context = agent.memory.get_context()
        self.assertEqual(context[0]["type"], "PLAN")

    def test_action_execution_observation_then_final(self):
        """Test loop with one tool action execution, followed by final answer."""
        mock_llm = MockLLMInterface(responses=[
            {
                "thought": "I need to call mock_tool to get information.",
                "tool_name": "mock_tool",
                "tool_args": {"query": "test_query"}
            },
            {
                "thought": "I have received the mock tool observation and can answer.",
                "final_answer": "Tool executed successfully."
            }
        ])

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            event_bus=self.event_bus,
        )

        result = asyncio.run(agent.execute_task("Run mock query"))

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["final_answer"], "Tool executed successfully.")
        self.assertEqual(result["iterations"], 2)
        self.assertEqual(self.mock_tool.call_count, 1)

        # Verify trajectory has PLAN, ACTION, OBSERVATION, REFLECTION
        step_types = [s["type"] for s in agent.memory.get_context()]
        self.assertIn("PLAN", step_types)
        self.assertIn("ACTION", step_types)
        self.assertIn("OBSERVATION", step_types)
        self.assertIn("REFLECTION", step_types)

    def test_iteration_limit_terminates_safely(self):
        """Test that infinite action loop stops safely at max_iterations without crashing."""
        def infinite_action(prompt, system_prompt=""):
            return {
                "thought": "Repeating action endlessly.",
                "tool_name": "mock_tool",
                "tool_args": {"step": "repeat"}
            }

        mock_llm = MockLLMInterface(response_fn=infinite_action)

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            max_iterations=4,
        )

        result = asyncio.run(agent.execute_task("Loop forever"))

        self.assertEqual(result["status"], "max_iterations_reached")
        self.assertEqual(result["iterations"], 4)
        self.assertIn("maximum execution limit", result["final_answer"])
        self.assertEqual(self.mock_tool.call_count, 4)

    def test_invalid_action_unknown_tool_handled_gracefully(self):
        """Test that requesting an unknown tool records an error observation and lets LLM recover."""
        mock_llm = MockLLMInterface(responses=[
            {
                "thought": "Calling a nonexistent tool.",
                "tool_name": "ghost_tool",
                "tool_args": {}
            },
            {
                "thought": "Ghost tool failed; now calling valid mock_tool.",
                "tool_name": "mock_tool",
                "tool_args": {}
            },
            {
                "thought": "Now I have the answer.",
                "final_answer": "Recovered from unknown tool error."
            }
        ])

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
        )

        result = asyncio.run(agent.execute_task("Recover from ghost tool"))

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["final_answer"], "Recovered from unknown tool error.")
        observations = [s["content"] for s in agent.memory.get_context() if s["type"] == "OBSERVATION"]
        self.assertTrue(any("Unknown tool 'ghost_tool'" in str(obs) for obs in observations))
        self.assertEqual(self.mock_tool.call_count, 1)

    def test_malformed_llm_response_handled_gracefully(self):
        """Test that completely broken/malformed LLM output is caught as error and does not crash."""
        mock_llm = MockLLMInterface(responses=[
            "",  # Empty response
            "{ invalid json without closing brace",  # Malformed JSON
            {
                "thought": "Now returning final answer properly.",
                "final_answer": "Recovered from malformed LLM responses."
            }
        ])

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
        )

        result = asyncio.run(agent.execute_task("Test bad syntax"))

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["final_answer"], "Recovered from malformed LLM responses.")

    def test_events_published_during_lifecycle(self):
        """Verify that event bus receives trace events at all stages."""
        emitted_event_types = []

        def listener(evt):
            emitted_event_types.append(evt.event_type)

        self.event_bus.subscribe(listener)

        mock_llm = MockLLMInterface(responses=[
            {
                "thought": "Calling mock_tool.",
                "tool_name": "mock_tool",
                "tool_args": {"test": 1}
            },
            {
                "thought": "Done.",
                "final_answer": "Completed with trace events."
            }
        ])

        agent = AgentCore(
            llm=mock_llm,
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            event_bus=self.event_bus,
        )

        result = asyncio.run(agent.execute_task("Verify trace events"))

        self.assertEqual(result["status"], "success")
        self.assertIn(EventType.TASK_STARTED, emitted_event_types)
        self.assertIn(EventType.PLAN_CREATED, emitted_event_types)
        self.assertIn(EventType.ACTION_SELECTED, emitted_event_types)
        self.assertIn(EventType.TOOL_STARTED, emitted_event_types)
        self.assertIn(EventType.TOOL_FINISHED, emitted_event_types)
        self.assertIn(EventType.OBSERVATION_RECEIVED, emitted_event_types)
        self.assertIn(EventType.TASK_COMPLETED, emitted_event_types)

    def test_agent_execution_flow(self):
        """
        Validate the complete autonomous flow:
        1. Agent receives a task.
        2. Fake LLM returns a tool_call for fake_tool.
        3. Agent retrieves tool from ToolRegistry and executes it.
        4. Fake tool returns {"status": "success", "data": "test result"}.
        5. Agent stores observation in memory.
        6. Fake LLM receives updated history and returns final answer.
        7. Agent returns final answer.
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
        first_tool = FailingTool()
        second_tool = RecoveryTool()
        registry = ToolRegistry()
        registry.register(first_tool)
        registry.register(second_tool)

        fake_llm = FailureRecoveryLLM()

        agent = AgentCore(
            llm=fake_llm,
            registry=registry,
        )

        task = "Execute resilient task"
        final_answer = asyncio.run(agent.run(task))

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
