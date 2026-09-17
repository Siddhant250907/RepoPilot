"""
Unit Tests for Agent Core.

Owner: Person 1 (Agent Core)
"""

import unittest
import asyncio
from typing import Dict, Any

from backend.agent.agent import AgentCore
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry
from backend.agent.events import EventBus, EventType
from backend.agent.llm import MockLLMInterface
from backend.tools.base import BaseTool, ToolResult


class MockTool(BaseTool):
    name = "mock_tool"
    description = "A mock tool for testing."

    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        self.call_count = 0

    async def execute(self, arguments=None, **kwargs):
        self.call_count += 1
        if self.should_fail:
            return ToolResult({
                "status": "error",
                "error": "Simulated mock failure",
                "tool": self.name
            })
        return ToolResult({
            "status": "success",
            "output": f"Mock tool executed with args {kwargs or arguments}",
            "tool": self.name
        })


class TestAgentCore(unittest.TestCase):
    """Test suite for AgentCore loop, tool execution, memory, and failure handling."""

    def setUp(self):
        self.registry = ToolRegistry()
        self.mock_tool = MockTool(should_fail=False)
        self.registry.register(self.mock_tool)
        self.planner = Planner()
        self.memory = AgentMemory()
        self.event_bus = EventBus()

    def test_agent_initialization(self):
        """Verify AgentCore initializes with dependencies and default tools if needed."""
        agent = AgentCore(
            memory=self.memory,
            planner=self.planner,
            registry=self.registry,
            event_bus=self.event_bus,
        )
        self.assertIsNotNone(agent.memory)
        self.assertIsNotNone(agent.planner)
        self.assertIsNotNone(agent.registry)
        self.assertIsNotNone(agent.event_bus)

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
        # LLM that keeps calling mock_tool forever
        def infinite_action(prompt, system_prompt):
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
        # Verify trajectory records the error observation
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


if __name__ == "__main__":
    unittest.main()
