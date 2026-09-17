"""
Unit and Integration Tests for RepoPilot Tools (Part 1).

Owner: Person 2 (Tools)

Comprehensive test coverage for:
- BaseTool interface & contracts
- FileTool (operations, path security, error boundaries, binary handling)
- ShellTool (safe execution, output capture, timeouts, workspace containment)
- ToolRegistry integration & async dispatcher compatibility
- Robustness & edge cases across both tools
"""

import os
import sys
import tempfile
import unittest
import asyncio
from pathlib import Path

# Ensure repository root is on sys.path for direct script execution
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.tools.base import BaseTool, ToolResult
from backend.tools.file_tool import FileTool
from backend.tools.shell_tool import ShellTool
from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool
from backend.agent.registry import ToolRegistry
from backend.agent.agent import AgentCore


# ==============================================================================
# Base Tools & Metadata Suite (Preserves Person 2 Contract)
# ==============================================================================

class TestTools(unittest.TestCase):
    """Test suite for tool metadata, contracts, and ToolResult behaviors."""

    def test_tool_names(self):
        """Verify each tool possesses the registered descriptive name."""
        self.assertEqual(FileTool().name, "file_tool")
        self.assertEqual(ShellTool().name, "shell_tool")
        self.assertEqual(SearchTool().name, "search_tool")
        self.assertEqual(CalculatorTool().name, "calculator_tool")

    def test_base_tool_interface(self):
        """Verify BaseTool requires implementation of abstract methods and exposes schema."""
        class IncompleteTool(BaseTool):
            pass

        with self.assertRaises(TypeError):
            IncompleteTool()

        tool = FileTool()
        schema = tool.to_schema()
        self.assertIn("name", schema)
        self.assertIn("description", schema)
        self.assertIn("parameters", schema)
        self.assertEqual(schema["name"], "file_tool")

    def test_tool_result_sync_and_async_behavior(self):
        """Verify ToolResult is a dict and is awaitable."""
        res = ToolResult({"status": "success", "data": "content"})
        self.assertIsInstance(res, dict)
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], "content")
        self.assertEqual(res.get("status"), "success")

        async def _await_res():
            return await res

        awaited = asyncio.run(_await_res())
        self.assertIsInstance(awaited, dict)
        self.assertEqual(awaited["status"], "success")


# ==============================================================================
# FileTool Tests
# ==============================================================================

class TestFileTool(unittest.TestCase):
    """Unit tests for FileTool capabilities, path containment, and error handling."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._temp_dir.name)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_file_tool_metadata(self):
        """1. Tool metadata exists."""
        tool = FileTool()
        self.assertEqual(tool.name, "file_tool")
        self.assertIsInstance(tool.description, str)
        self.assertGreater(len(tool.description), 0)
        schema = tool.input_schema
        self.assertEqual(schema["type"], "object")
        self.assertIn("action", schema["properties"])
        self.assertIn("path", schema["properties"])
        self.assertIn("query", schema["properties"])
        self.assertIn("action", schema["required"])
        self.assertIn("path", schema["required"])

    def test_file_tool_read_existing_file(self):
        """2. Read existing file."""
        test_file = self.tmp_path / "hello.py"
        test_file.write_text("print('hello world')", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "read", "path": "hello.py"})

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], "print('hello world')")

    def test_file_tool_read_nonexistent_file(self):
        """3. Read nonexistent file."""
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "read", "path": "does_not_exist.txt"})

        self.assertEqual(res["status"], "error")
        self.assertIn("File not found", res["error"])

    def test_file_tool_list_directory(self):
        """4. List directory contents."""
        (self.tmp_path / "subdir").mkdir()
        (self.tmp_path / "file1.txt").write_text("abc", encoding="utf-8")
        (self.tmp_path / "file2.py").write_text("x = 1", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "list", "path": "."})

        self.assertEqual(res["status"], "success")
        entries = res["data"]
        names = [e["name"] for e in entries]
        self.assertIn("subdir", names)
        self.assertIn("file1.txt", names)
        self.assertIn("file2.py", names)

        # Verify entry structure
        for entry in entries:
            self.assertIn("name", entry)
            self.assertIn("type", entry)
            self.assertIn("path", entry)
            self.assertIn(entry["type"], ("directory", "file"))

    def test_file_tool_search_text(self):
        """5. Search text in files."""
        (self.tmp_path / "target.py").write_text("def authenticate_user():\n    return True\n", encoding="utf-8")
        (self.tmp_path / "other.py").write_text("def calculate_tax():\n    return 0\n", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "search", "path": ".", "query": "authenticate"})

        self.assertEqual(res["status"], "success")
        matches = res["data"]
        self.assertEqual(len(matches), 1)
        self.assertIn("target.py", matches[0]["file"])
        self.assertEqual(matches[0]["line"], 1)
        self.assertIn("authenticate_user", matches[0]["content"])

    def test_file_tool_search_recursively(self):
        """6. Search recursively across nested folders."""
        sub1 = self.tmp_path / "src" / "auth"
        sub1.mkdir(parents=True)
        (sub1 / "login.py").write_text("# user login handler\ndef login(): pass\n", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "search", "path": "src", "query": "login handler"})

        self.assertEqual(res["status"], "success")
        matches = res["data"]
        self.assertGreaterEqual(len(matches), 1)
        self.assertTrue(any("login.py" in m["file"] for m in matches))

    def test_file_tool_invalid_action(self):
        """7. Invalid action returns structured error."""
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "destroy", "path": "file.txt"})

        self.assertEqual(res["status"], "error")
        self.assertIn("Unknown action", res["error"])

    def test_file_tool_missing_required_argument(self):
        """8. Missing required argument."""
        tool = FileTool(workspace_root=self.tmp_path)

        # Missing action
        res1 = tool.execute({"path": "file.txt"})
        self.assertEqual(res1["status"], "error")
        self.assertIn("action", res1["error"])

        # Missing path
        res2 = tool.execute({"action": "read"})
        self.assertEqual(res2["status"], "error")
        self.assertIn("path", res2["error"])

        # Missing search query
        res3 = tool.execute({"action": "search", "path": "."})
        self.assertEqual(res3["status"], "error")
        self.assertIn("query", res3["error"])

    def test_file_tool_read_directory_as_file(self):
        """9. Attempt to read a directory."""
        (self.tmp_path / "folder").mkdir()
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "read", "path": "folder"})

        self.assertEqual(res["status"], "error")
        self.assertIn("directory", res["error"].lower())

    def test_file_tool_path_traversal_rejection(self):
        """10. Path traversal rejection (e.g. ../../outside)."""
        workspace = self.tmp_path / "workspace"
        workspace.mkdir()
        outside_file = self.tmp_path / "secret.txt"
        outside_file.write_text("super_secret_password", encoding="utf-8")

        tool = FileTool(workspace_root=workspace)
        res = tool.execute({"action": "read", "path": "../secret.txt"})

        self.assertEqual(res["status"], "error")
        self.assertTrue("Path traversal" in res["error"] or "outside workspace" in res["error"])

    def test_file_tool_access_outside_workspace_rejection(self):
        """11. Access outside workspace rejection via absolute path."""
        workspace = self.tmp_path / "workspace"
        workspace.mkdir()
        outside_dir = self.tmp_path / "other"
        outside_dir.mkdir()

        tool = FileTool(workspace_root=workspace)
        res = tool.execute({"action": "list", "path": str(outside_dir)})

        self.assertEqual(res["status"], "error")
        self.assertTrue("outside workspace" in res["error"] or "Path traversal" in res["error"])

    def test_file_tool_binary_and_unreadable_file_handling(self):
        """12. Invalid/unreadable/binary file handling."""
        bin_file = self.tmp_path / "image.png"
        bin_file.write_bytes(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR")

        tool = FileTool(workspace_root=self.tmp_path)

        # Reading binary file directly returns structured error instead of crash
        res_read = tool.execute({"action": "read", "path": "image.png"})
        self.assertEqual(res_read["status"], "error")
        self.assertTrue("binary" in res_read["error"].lower() or "encoding" in res_read["error"].lower())

        # Searching across directory containing binary file does not crash
        res_search = tool.execute({"action": "search", "path": ".", "query": "PNG"})
        self.assertEqual(res_search["status"], "success")
        self.assertIsInstance(res_search["data"], list)


# ==============================================================================
# ShellTool Tests
# ==============================================================================

class TestShellTool(unittest.TestCase):
    """Unit tests for ShellTool sandboxed execution, timeouts, and process containment."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._temp_dir.name)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_shell_tool_metadata(self):
        """1. Tool metadata exists."""
        tool = ShellTool()
        self.assertEqual(tool.name, "shell_tool")
        self.assertIsInstance(tool.description, str)
        self.assertGreater(len(tool.description), 0)
        schema = tool.input_schema
        self.assertEqual(schema["type"], "object")
        self.assertIn("command", schema["properties"])
        self.assertIn("command", schema["required"])

    def test_shell_tool_successful_command(self):
        """2. Successful command execution."""
        tool = ShellTool(workspace_root=self.tmp_path)
        cmd = [sys.executable, "-c", "print('hello from python')"]
        res = tool.execute({"command": cmd})

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["exit_code"], 0)
        self.assertIn("hello from python", res["stdout"])

    def test_shell_tool_stdout_capture(self):
        """3. stdout capture."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute({"command": [sys.executable, "-c", "import sys; sys.stdout.write('captured_stdout')"]})

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["stdout"], "captured_stdout")

    def test_shell_tool_stderr_capture(self):
        """4. stderr capture."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute({"command": [sys.executable, "-c", "import sys; sys.stderr.write('captured_stderr')"]})

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["stderr"], "captured_stderr")

    def test_shell_tool_exit_code_capture(self):
        """5. Exit code capture on zero and non-zero."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute({"command": [sys.executable, "-c", "import sys; sys.exit(0)"]})
        self.assertEqual(res["exit_code"], 0)

    def test_shell_tool_nonzero_exit_code(self):
        """6. Non-zero exit code returns status=error with captured streams."""
        tool = ShellTool(workspace_root=self.tmp_path)
        cmd = [
            sys.executable,
            "-c",
            "import sys; sys.stdout.write('out'); sys.stderr.write('err'); sys.exit(42)"
        ]
        res = tool.execute({"command": cmd})

        self.assertEqual(res["status"], "error")
        self.assertEqual(res["exit_code"], 42)
        self.assertEqual(res["stdout"], "out")
        self.assertEqual(res["stderr"], "err")

    def test_shell_tool_timeout(self):
        """7. Timeout returns structured error without hanging."""
        tool = ShellTool(workspace_root=self.tmp_path, timeout_seconds=1)
        cmd = [sys.executable, "-c", "import time; time.sleep(5)"]
        res = tool.execute({"command": cmd})

        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error"], "Command timed out")

    def test_shell_tool_empty_invalid_command(self):
        """8. Empty/invalid command."""
        tool = ShellTool(workspace_root=self.tmp_path)

        # Empty list
        res1 = tool.execute({"command": []})
        self.assertEqual(res1["status"], "error")
        self.assertIn("Empty or invalid", res1["error"])

        # Empty string
        res2 = tool.execute({"command": "   "})
        self.assertEqual(res2["status"], "error")
        self.assertIn("Empty or invalid", res2["error"])

        # Missing command key
        res3 = tool.execute({})
        self.assertEqual(res3["status"], "error")
        self.assertIn("Missing required argument", res3["error"])

    def test_shell_tool_workspace_restriction(self):
        """9. Workspace restriction (cwd is the configured workspace)."""
        workspace = self.tmp_path / "my_project"
        workspace.mkdir()

        tool = ShellTool(workspace_root=workspace)
        cmd = [sys.executable, "-c", "import os; print(os.getcwd())"]
        res = tool.execute({"command": cmd})

        self.assertEqual(res["status"], "success")
        # Resolve paths to account for symlinks/8.3 names on Windows
        self.assertEqual(Path(res["stdout"].strip()).resolve(), workspace.resolve())

    def test_shell_tool_exception_handling(self):
        """10. Exception handling for nonexistent executable."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute({"command": ["non_existent_binary_12345"]})

        self.assertEqual(res["status"], "error")
        self.assertTrue("not found" in res["error"].lower() or "exception" in res["error"].lower())

    def test_shell_tool_safe_argument_list_execution(self):
        """11. Safe argument-list execution prevents shell injection."""
        tool = ShellTool(workspace_root=self.tmp_path)
        # Trying an injection via argument string with shell=False will not spawn a second command
        canary = self.tmp_path / "injected.txt"
        cmd = [sys.executable, "-c", "print('safe')", f"&& echo hacked > {canary}"]
        res = tool.execute({"command": cmd})

        self.assertEqual(res["status"], "success")
        self.assertFalse(canary.exists())

    def test_shell_tool_dangerous_pattern_blocked(self):
        """12. Verify destructive commands are caught and blocked."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute({"command": ["rm", "-rf", "/"]})

        self.assertEqual(res["status"], "error")
        self.assertIn("destructive", res["error"].lower())


# ==============================================================================
# Person 1 Integration Verification Suite
# ==============================================================================

class TestToolIntegration(unittest.TestCase):
    """End-to-end integration tests between AgentCore, ToolRegistry, and Tool implementations."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._temp_dir.name)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_tool_registry_integration(self):
        """Verify ToolRegistry can register and dynamically dispatch FileTool and ShellTool."""
        async def _run():
            (self.tmp_path / "code.py").write_text("x = 42", encoding="utf-8")

            registry = ToolRegistry()
            file_tool = FileTool(workspace_root=self.tmp_path)
            shell_tool = ShellTool(workspace_root=self.tmp_path)

            registry.register(file_tool)
            registry.register(shell_tool)

            # 1. Test listing tools produces valid schemas
            tools_list = registry.list_tools()
            tool_names = [t["name"] for t in tools_list]
            self.assertIn("file_tool", tool_names)
            self.assertIn("shell_tool", tool_names)

            # 2. Test dynamic execution via registry dispatch
            file_res = await registry.execute("file_tool", action="read", path="code.py")
            self.assertEqual(file_res["status"], "success")
            self.assertEqual(file_res["data"], "x = 42")

            shell_res = await registry.execute("shell_tool", command=[sys.executable, "-c", "print('registry ok')"])
            self.assertEqual(shell_res["status"], "success")
            self.assertIn("registry ok", shell_res["stdout"])

        asyncio.run(_run())

    def test_agent_core_file_tool_flow(self):
        """Flow 1: AgentCore -> ToolRegistry -> FileTool -> structured result -> AgentCore."""
        test_file = self.tmp_path / "app.py"
        test_file.write_text("print('repo pilot running')", encoding="utf-8")

        agent = AgentCore()
        file_tool = FileTool(workspace_root=self.tmp_path)
        agent.registry.register(file_tool)

        # Verify registration via registry interface
        self.assertIs(agent.registry.get_tool("file_tool"), file_tool)

        # AgentCore dispatches execution through ToolRegistry
        result = asyncio.run(agent.registry.execute("file_tool", action="read", path="app.py"))

        # Verify structured result reached AgentCore
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["data"], "print('repo pilot running')")

        # AgentCore records observation into memory
        agent.memory.add_step("observation", result)
        context = agent.memory.get_context()
        self.assertEqual(len(context), 1)
        self.assertEqual(context[0]["type"], "observation")
        self.assertEqual(context[0]["content"]["data"], "print('repo pilot running')")

    def test_agent_core_shell_tool_flow(self):
        """Flow 2: AgentCore -> ToolRegistry -> ShellTool -> structured result -> AgentCore."""
        agent = AgentCore()
        shell_tool = ShellTool(workspace_root=self.tmp_path)
        agent.registry.register(shell_tool)

        # Verify registration via registry interface
        self.assertIs(agent.registry.get_tool("shell_tool"), shell_tool)

        # AgentCore dispatches execution through ToolRegistry
        result = asyncio.run(agent.registry.execute(
            "shell_tool",
            command=[sys.executable, "-c", "print('tests passing cleanly')"]
        ))

        # Verify structured result reached AgentCore
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["exit_code"], 0)
        self.assertIn("tests passing cleanly", result["stdout"])

        # AgentCore records observation into memory
        agent.memory.add_step("observation", result)
        context = agent.memory.get_context()
        self.assertEqual(len(context), 1)
        self.assertEqual(context[0]["content"]["exit_code"], 0)

    def test_agent_core_shell_tool_failure_and_replanning_flow(self):
        """Flow 3: Failure flow: AgentCore -> ShellTool -> failure observation -> replan."""
        agent = AgentCore()
        shell_tool = ShellTool(workspace_root=self.tmp_path)
        agent.registry.register(shell_tool)

        initial_plan = ["run pytest", "deploy to production"]
        agent.memory.add_step("plan", initial_plan)

        # Agent executes command that fails with exit code 1
        result = asyncio.run(agent.registry.execute(
            "shell_tool",
            command=[sys.executable, "-c", "import sys; sys.stderr.write('SyntaxError: unexpected token'); sys.exit(1)"]
        ))

        # Verify structured error observation returned, not an unhandled exception
        self.assertEqual(result["status"], "error")
        self.assertEqual(result["exit_code"], 1)
        self.assertIn("SyntaxError: unexpected token", result["stderr"])

        # AgentCore records failure observation
        agent.memory.add_step("observation", result)

        # AgentCore uses Planner to adapt and make next decision based on failure observation
        next_plan = agent.planner.replan(initial_plan, failure_observation=result["stderr"])
        agent.memory.add_step("decision", {"action": "inspect_code", "revised_plan": next_plan})

        # Verify complete trajectory is preserved for subsequent LLM cognitive cycles
        trajectory = agent.memory.get_context()
        self.assertEqual(len(trajectory), 3)
        self.assertEqual(trajectory[0]["type"], "plan")
        self.assertEqual(trajectory[1]["type"], "observation")
        self.assertEqual(trajectory[1]["content"]["status"], "error")
        self.assertEqual(trajectory[2]["type"], "decision")

    def test_agent_core_file_tool_path_traversal_rejection_flow(self):
        """Flow 4: Security rejection flow: AgentCore -> FileTool -> traversal attempt -> structured error."""
        workspace = self.tmp_path / "sandbox"
        workspace.mkdir()
        secret = self.tmp_path / "credentials.env"
        secret.write_text("SECRET_KEY=supersecret", encoding="utf-8")

        agent = AgentCore()
        file_tool = FileTool(workspace_root=workspace)
        agent.registry.register(file_tool)

        # Agent requests file outside workspace sandbox
        result = asyncio.run(agent.registry.execute(
            "file_tool",
            action="read",
            path="../credentials.env"
        ))

        # Verify structured error observation returned and sandbox maintained
        self.assertEqual(result["status"], "error")
        self.assertTrue("Path traversal" in result["error"] or "outside workspace" in result["error"])

        # AgentCore records security rejection observation without crashing
        agent.memory.add_step("observation", result)
        context = agent.memory.get_context()
        self.assertEqual(len(context), 1)
        self.assertEqual(context[0]["content"]["status"], "error")


# ==============================================================================
# Edge Cases & Robustness Suite
# ==============================================================================

class TestToolEdgeCases(unittest.TestCase):
    """Edge cases, boundaries, and invocation parameter styles for tools."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self._temp_dir.name)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_file_tool_empty_file(self):
        """Test reading an empty file returns empty string with status=success."""
        empty_f = self.tmp_path / "empty.py"
        empty_f.write_text("", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "read", "path": "empty.py"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], "")

    def test_file_tool_empty_directory(self):
        """Test listing an empty directory returns empty list with status=success."""
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "list", "path": "."})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], [])

    def test_file_tool_search_no_matches(self):
        """Test search with no matches returns empty list with status=success."""
        (self.tmp_path / "file.txt").write_text("apple banana orange", encoding="utf-8")
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "search", "path": ".", "query": "nonexistent_query"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], [])

    def test_file_tool_search_literal_special_chars(self):
        """Test search treats regex special characters as literal text."""
        (self.tmp_path / "file.txt").write_text("Result: (value[0] == *ptr)", encoding="utf-8")
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "search", "path": ".", "query": "(value[0] == *ptr)"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(len(res["data"]), 1)
        self.assertIn("(value[0] == *ptr)", res["data"][0]["content"])

    def test_file_tool_relative_dots_within_workspace(self):
        """Test path with relative components that stay within workspace."""
        sub = self.tmp_path / "sub"
        sub.mkdir()
        target = self.tmp_path / "root.py"
        target.write_text("val = 99", encoding="utf-8")

        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute({"action": "read", "path": "sub/../root.py"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], "val = 99")

    def test_file_tool_kwargs_invocation(self):
        """Test calling execute with direct kwargs instead of dictionary."""
        (self.tmp_path / "direct.txt").write_text("kwargs works", encoding="utf-8")
        tool = FileTool(workspace_root=self.tmp_path)
        res = tool.execute(action="read", path="direct.txt")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"], "kwargs works")

    def test_shell_tool_kwargs_invocation(self):
        """Test calling shell tool execute with direct kwargs."""
        tool = ShellTool(workspace_root=self.tmp_path)
        res = tool.execute(command=[sys.executable, "-c", "print('kwargs cmd')"])
        self.assertEqual(res["status"], "success")
        self.assertIn("kwargs cmd", res["stdout"])

    def test_shell_tool_string_command_execution(self):
        """Test executing a command provided as a string."""
        tool = ShellTool(workspace_root=self.tmp_path)
        cmd = f'"{sys.executable}" -c "print(77 + 33)"'
        res = tool.execute({"command": cmd})
        self.assertEqual(res["status"], "success")
        self.assertIn("110", res["stdout"])

    def test_shell_tool_custom_timeout_override(self):
        """Test per-execution timeout overriding default timeout."""
        tool = ShellTool(workspace_root=self.tmp_path, timeout_seconds=30)
        cmd = [sys.executable, "-c", "import time; time.sleep(3)"]
        res = tool.execute({"command": cmd, "timeout": 0.5})
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error"], "Command timed out")

    def test_shell_tool_constructor_variations(self):
        """Verify ShellTool constructor handles various parameter styles."""
        tool1 = ShellTool()
        self.assertEqual(tool1.timeout_seconds, 30)

        tool2 = ShellTool(timeout_seconds=45)
        self.assertEqual(tool2.timeout_seconds, 45)

        tool3 = ShellTool(15)
        self.assertEqual(tool3.timeout_seconds, 15)

        tool4 = ShellTool(workspace_root=".")
        self.assertEqual(tool4.timeout_seconds, 30)


if __name__ == "__main__":
    unittest.main()
