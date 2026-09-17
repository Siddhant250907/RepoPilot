"""
End-to-End Integration Tests for AgentCore and Tool Integration.

Tests:
1. Multi-tool realistic scenario (SearchTool -> FileTool -> ShellTool)
2. Failure recovery: Tool intentionally fails -> observation fed to LLM -> LLM reassesses -> succeeds
3. Iteration limit handling
4. Malformed/Unknown tool actions
5. Anti-cheating autonomy verification: confirm dynamic execution through ToolRegistry without hardcoded routing
"""

import asyncio
import os
import shutil
import tempfile
import unittest
from typing import Dict, Any, List

from backend.agent.agent import AgentCore
from backend.agent.events import EventBus, EventType
from backend.agent.llm import MockLLMInterface
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry
from backend.tools.file_tool import FileTool
from backend.tools.shell_tool import ShellTool
from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool


class TestFullAgentIntegration(unittest.TestCase):
    """End-to-End integration test suite for AgentCore with frozen tools."""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="agent_integration_")
        # Create a sample workspace inside temp_dir
        self.workspace = os.path.join(self.temp_dir, "workspace")
        os.makedirs(self.workspace, exist_ok=True)

        # Create mock project files
        self.auth_file = os.path.join(self.workspace, "auth.py")
        with open(self.auth_file, "w", encoding="utf-8") as f:
            f.write("def login(username, password):\n    if username == 'admin':\n        return True\n    return False\n")

        self.test_file = os.path.join(self.workspace, "test_auth.py")
        with open(self.test_file, "w", encoding="utf-8") as f:
            f.write("from auth import login\ndef test_login():\n    assert login('admin', '123') is True\n")

        # Initialize tools configured to this workspace
        self.registry = ToolRegistry()
        self.file_tool = FileTool(workspace_root=self.workspace)
        self.shell_tool = ShellTool(workspace_root=self.workspace)
        self.search_tool = SearchTool(workspace_root=self.workspace)
        self.calculator_tool = CalculatorTool()

        self.registry.register(self.file_tool)
        self.registry.register(self.shell_tool)
        self.registry.register(self.search_tool)
        self.registry.register(self.calculator_tool)

        self.event_bus = EventBus()
        self.events_received: List[Any] = []
        self.event_bus.subscribe(lambda evt: self.events_received.append(evt))

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_multi_tool_autonomous_scenario(self):
        """
        Demonstrate multi-tool autonomous workflow:
        1. LLM autonomously chooses SearchTool to find 'login'
        2. LLM receives observation and chooses FileTool to inspect auth.py
        3. LLM receives observation and chooses CalculatorTool to compute test coverage percentage
        4. LLM receives observation and outputs final answer.

        Verifies:
        - At least 3 distinct tools invoked
        - Observations properly fed into LLM
        - Trajectory preserved
        """
        tool_call_sequence = []

        def response_fn(prompt: str, system_prompt: str):
            # Check LLM observation history in prompt
            if "search_tool" not in prompt:
                # Step 1: LLM decides to search the codebase
                tool_call_sequence.append("search_tool")
                return {
                    "thought": "I will search the workspace for login functions.",
                    "tool_name": "search_tool",
                    "tool_args": {"query": "def login"}
                }
            elif "file_tool" not in prompt:
                # Step 2: Search succeeded; LLM decides to inspect auth.py
                self.assertIn("auth.py", prompt)
                tool_call_sequence.append("file_tool")
                return {
                    "thought": "Found login in auth.py, inspecting the file.",
                    "tool_name": "file_tool",
                    "tool_args": {"operation": "read", "path": "auth.py"}
                }
            elif "calculator_tool" not in prompt:
                # Step 3: File read succeeded; LLM decides to calculate coverage ratio
                self.assertIn("def login(username, password)", prompt)
                tool_call_sequence.append("calculator_tool")
                return {
                    "thought": "Now calculating coverage metric: (1 / 2) * 100",
                    "tool_name": "calculator_tool",
                    "tool_args": {"expression": "(1 / 2) * 100"}
                }
            else:
                # Final step: LLM summarizes
                self.assertIn("50", prompt)
                return {
                    "thought": "I have completed searching, reading, and computing metrics.",
                    "final_answer": "Analysis complete: auth.py has 1 function with 50% coverage."
                }

        mock_llm = MockLLMInterface(response_fn=response_fn)
        agent = AgentCore(
            llm=mock_llm,
            registry=self.registry,
            event_bus=self.event_bus,
        )

        result = asyncio.run(agent.execute_task("Inspect the auth logic and calculate test coverage"))

        self.assertEqual(result["status"], "success")
        self.assertIn("Analysis complete", result["final_answer"])
        self.assertEqual(tool_call_sequence, ["search_tool", "file_tool", "calculator_tool"])

        # Check that distinct tools were called
        self.assertGreaterEqual(len(set(tool_call_sequence)), 3)

        # Check event bus captured all tool calls
        tool_started_events = [e for e in self.events_received if e.event_type == EventType.TOOL_STARTED]
        self.assertEqual(len(tool_started_events), 3)

    def test_failure_recovery_shell_failure_then_file_inspection(self):
        """
        Failure Recovery requirement:
        1. LLM chooses ShellTool to run a command that fails (e.g. exit code 1)
        2. Framework remains alive; observation with exit code & stderr is passed back to LLM
        3. AgentCore triggers replan and emits REPLAN_TRIGGERED
        4. LLM reassesses observation and chooses FileTool to read the test file instead
        5. LLM receives file content and produces final answer
        """
        tool_call_sequence = []

        def response_fn(prompt: str, system_prompt: str):
            if "shell_tool" not in prompt:
                # Step 1: Try running nonexistent test runner command
                tool_call_sequence.append("shell_tool")
                return {
                    "thought": "Let me run a test command using shell_tool.",
                    "tool_name": "shell_tool",
                    "tool_args": {"command": "python -c 'import sys; sys.exit(1)'"}
                }
            elif "file_tool" not in prompt:
                # Step 2: Observe shell failure and recover by inspecting test_auth.py
                self.assertIn("exit_code", prompt)
                tool_call_sequence.append("file_tool")
                return {
                    "thought": "Shell command returned non-zero exit code. Reassessing by reading test file directly.",
                    "tool_name": "file_tool",
                    "tool_args": {"operation": "read", "path": "test_auth.py"}
                }
            else:
                # Step 3: Final answer
                self.assertIn("test_login", prompt)
                return {
                    "thought": "I found the test contents despite shell failure.",
                    "final_answer": "Resolved by inspecting test_auth.py directly after shell command failure."
                }


        mock_llm = MockLLMInterface(response_fn=response_fn)
        agent = AgentCore(
            llm=mock_llm,
            registry=self.registry,
            event_bus=self.event_bus,
        )

        result = asyncio.run(agent.execute_task("Investigate tests"))

        self.assertEqual(result["status"], "success")
        self.assertEqual(tool_call_sequence, ["shell_tool", "file_tool"])

        # Check that replanning was triggered and recorded
        replan_events = [e for e in self.events_received if e.event_type == EventType.REPLAN_TRIGGERED]
        self.assertGreaterEqual(len(replan_events), 1)

        # Check trajectory contains REPLAN step
        step_types = [s["type"] for s in agent.memory.get_context()]
        self.assertIn("REPLAN", step_types)

    def test_failure_types_comprehensive(self):
        """
        Verify all 5 required failure types are gracefully handled as structured observations:
        1. Tool receives invalid arguments (FileTool unknown operation)
        2. File/path doesn't exist (FileTool read nonexistent)
        3. Shell command exits non-zero (ShellTool command failure)
        4. Calculator receives invalid expression (CalculatorTool syntax error)
        5. Search receives invalid path outside workspace (SearchTool path traversal)
        """
        failure_scenarios = [
            # 1. Invalid operation
            ("file_tool", {"operation": "invalid_op", "path": "auth.py"}),
            # 2. Nonexistent file
            ("file_tool", {"operation": "read", "path": "nonexistent_99.py"}),
            # 3. Shell non-zero exit
            ("shell_tool", {"command": "python -c 'raise SystemExit(2)'"}),
            # 4. Calculator invalid expression
            ("calculator_tool", {"expression": "2 +* 5"}),
            # 5. Search path traversal / outside workspace
            ("search_tool", {"query": "test", "path": "../../outside"}),
        ]

        for tool_name, tool_args in failure_scenarios:
            mock_llm = MockLLMInterface(responses=[
                {
                    "thought": f"Attempting action with {tool_name}",
                    "tool_name": tool_name,
                    "tool_args": tool_args
                },
                {
                    "thought": "Observed failure; closing out task safely.",
                    "final_answer": f"Handled {tool_name} failure."
                }
            ])

            agent = AgentCore(
                llm=mock_llm,
                registry=self.registry,
            )

            result = asyncio.run(agent.execute_task(f"Test failure on {tool_name}"))

            self.assertEqual(result["status"], "success")
            self.assertEqual(result["final_answer"], f"Handled {tool_name} failure.")

            # Ensure observation was recorded with status="error" or non-zero exit code
            observations = [s["content"] for s in agent.memory.get_context() if s["type"] == "OBSERVATION"]
            self.assertEqual(len(observations), 1)
            obs = observations[0]
            is_error = obs.get("status") == "error" or obs.get("exit_code", 0) != 0
            self.assertTrue(is_error, f"Expected error observation for {tool_name} with {tool_args}, got {obs}")

    def test_autonomy_verification_no_hardcoded_routing(self):
        """
        Verify that:
        - Tool selection is purely driven by LLM decision
        - AgentCore queries the registry dynamically
        - AgentCore does NOT hardcode tool names for tasks
        """
        import inspect
        import backend.agent.agent as agent_module

        source = inspect.getsource(agent_module)

        # Anti-cheating verification: Ensure no keyword-based tool routing
        forbidden_patterns = [
            'if "search" in task',
            'if "calculate" in task',
            'if "pytest" in task',
            'if "shell" in task',
            'if "file" in task',
            'if tool_failed:',
            'if shell_failed:',
            'if pytest_failed:',
        ]

        for pattern in forbidden_patterns:
            self.assertNotIn(pattern, source, f"Forbidden hardcoded routing found: {pattern}")


if __name__ == "__main__":
    unittest.main()
