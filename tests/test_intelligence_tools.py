"""
Unit and Adversarial Tests for Part 2 Intelligence Tools (SearchTool & CalculatorTool).

Owner: Person 2 (Tools)

Comprehensive test coverage for:
- SearchTool (workspace search, path traversal security, ignored dirs, resource limits, result shapes)
- CalculatorTool (safe AST evaluation, arithmetic, precedence, division-by-zero, security sandbox, resource limits)
- ToolRegistry integration for SearchTool and CalculatorTool
- Autonomous agent policy verification (passive execution without decision-making)
"""

import math
import os
import sys
import tempfile
import unittest
import asyncio
from pathlib import Path

# Ensure repository root is on sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool
from backend.agent.registry import ToolRegistry


# ==============================================================================
# SearchTool Unit Tests
# ==============================================================================

class TestSearchTool(unittest.TestCase):
    """Unit tests for SearchTool core capabilities and schema adherence."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.workspace = Path(self._temp_dir.name)
        self.tool = SearchTool(workspace_root=self.workspace)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_search_tool_metadata(self):
        """Verify SearchTool exposes standard contract metadata and schema."""
        self.assertEqual(self.tool.name, "search_tool")
        self.assertIsInstance(self.tool.description, str)
        self.assertGreater(len(self.tool.description), 0)

        schema = self.tool.input_schema
        self.assertEqual(schema["type"], "object")
        self.assertIn("query", schema["properties"])
        self.assertIn("path", schema["properties"])
        self.assertIn("file_pattern", schema["properties"])
        self.assertIn("max_results", schema["properties"])
        self.assertIn("query", schema["required"])

        exported_schema = self.tool.to_schema()
        self.assertEqual(exported_schema["name"], "search_tool")
        self.assertEqual(exported_schema["parameters"], schema)

    def test_search_basic_keyword(self):
        """Verify search locates keyword across workspace files with correct metadata."""
        (self.workspace / "auth.py").write_text("def authenticate_user():\n    return True\n", encoding="utf-8")
        (self.workspace / "payment.py").write_text("def process_payment():\n    return False\n", encoding="utf-8")

        res = self.tool.execute({"query": "authenticate_user"})
        self.assertEqual(res["status"], "success")
        data = res["data"]
        self.assertEqual(data["query"], "authenticate_user")
        self.assertEqual(data["count"], 1)
        self.assertFalse(data["truncated"])

        match = data["matches"][0]
        self.assertIn("auth.py", match["file"])
        self.assertEqual(match["line"], 1)
        self.assertIn("def authenticate_user():", match["content"])
        self.assertEqual(match["text"], match["content"])

    def test_search_within_subpath(self):
        """Verify search restricted to specific subfolder only searches that subfolder."""
        src_dir = self.workspace / "src"
        src_dir.mkdir()
        docs_dir = self.workspace / "docs"
        docs_dir.mkdir()

        (src_dir / "app.py").write_text("API_ENDPOINT = '/v1/tasks'\n", encoding="utf-8")
        (docs_dir / "index.md").write_text("See API_ENDPOINT in docs\n", encoding="utf-8")

        res = self.tool.execute({"query": "API_ENDPOINT", "path": "src"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)
        self.assertIn("app.py", res["data"]["matches"][0]["file"])
        self.assertNotIn("index.md", str(res["data"]["matches"]))

    def test_search_single_file_target(self):
        """Verify search on a single target file directly."""
        target_f = self.workspace / "config.env"
        target_f.write_text("DATABASE_URL=postgres://localhost\nPORT=8000\n", encoding="utf-8")

        res = self.tool.execute({"query": "DATABASE_URL", "path": "config.env"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)
        self.assertEqual(res["data"]["matches"][0]["line"], 1)

    def test_search_file_pattern_filter(self):
        """Verify file_pattern filters candidate files."""
        (self.workspace / "test_module.py").write_text("# TODO: implement test\n", encoding="utf-8")
        (self.workspace / "notes.txt").write_text("# TODO: write notes\n", encoding="utf-8")

        res = self.tool.execute({"query": "TODO", "file_pattern": "*.py"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)
        self.assertIn("test_module.py", res["data"]["matches"][0]["file"])

    def test_search_max_results_and_truncation(self):
        """Verify max_results limits matches and sets truncated flag."""
        target = self.workspace / "repeats.txt"
        target.write_text("match\nmatch\nmatch\nmatch\nmatch\n", encoding="utf-8")

        res = self.tool.execute({"query": "match", "max_results": 3})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 3)
        self.assertTrue(res["data"]["truncated"])

    def test_search_no_matches(self):
        """Verify search with no matches returns empty list with count 0."""
        (self.workspace / "code.py").write_text("x = 100\n", encoding="utf-8")
        res = self.tool.execute({"query": "nonexistent_term_xyz"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 0)
        self.assertEqual(res["data"]["matches"], [])
        self.assertFalse(res["data"]["truncated"])

    def test_search_kwargs_and_string_invocation(self):
        """Verify calling execute with kwargs or string argument."""
        (self.workspace / "direct.txt").write_text("target_token = 42", encoding="utf-8")

        res1 = self.tool.execute(query="target_token")
        self.assertEqual(res1["status"], "success")
        self.assertEqual(res1["data"]["count"], 1)

        res2 = self.tool.execute("target_token")
        self.assertEqual(res2["status"], "success")
        self.assertEqual(res2["data"]["count"], 1)


# ==============================================================================
# SearchTool Adversarial & Security Tests
# ==============================================================================

class TestSearchToolAdversarial(unittest.TestCase):
    """Adversarial attacks on SearchTool: path escapes, malformed inputs, resource exhaustion."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.root = Path(self._temp_dir.name)
        self.workspace = self.root / "sandbox"
        self.workspace.mkdir()
        self.outside = self.root / "outside"
        self.outside.mkdir()
        (self.outside / "secret.key").write_text("CLASSIFIED_KEY_9999", encoding="utf-8")
        self.tool = SearchTool(workspace_root=self.workspace)

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_adv_missing_query(self):
        """Reject execution when query argument is missing."""
        res = self.tool.execute({})
        self.assertEqual(res["status"], "error")
        self.assertIn("query", res["error"].lower())

    def test_adv_empty_and_whitespace_query(self):
        """Reject empty and whitespace-only query strings."""
        for empty_q in ("", "   ", "\t\n"):
            res = self.tool.execute({"query": empty_q})
            self.assertEqual(res["status"], "error")
            self.assertIn("query", res["error"].lower())

    def test_adv_huge_query(self):
        """Reject excessively large query strings (buffer overflow / DoS prevention)."""
        res = self.tool.execute({"query": "A" * 1500})
        self.assertEqual(res["status"], "error")
        self.assertIn("maximum allowable length", res["error"].lower())

    def test_adv_invalid_query_type(self):
        """Reject invalid non-string query types."""
        for invalid_q in (12345, ["query"], {"q": "search"}):
            res = self.tool.execute({"query": invalid_q})
            self.assertEqual(res["status"], "error")
            self.assertIn("query", res["error"].lower())

    def test_adv_path_traversal_double_dot(self):
        """Block '../' path traversal attempts."""
        res = self.tool.execute({"query": "CLASSIFIED", "path": "../../outside"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("traversal" in res["error"].lower() or "outside workspace" in res["error"].lower())

    def test_adv_path_traversal_etc_passwd(self):
        """Block root traversal '/etc/passwd' attempts."""
        res = self.tool.execute({"query": "root", "path": "../../../etc/passwd"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("traversal" in res["error"].lower() or "outside workspace" in res["error"].lower())

    def test_adv_path_absolute_outside_workspace(self):
        """Block absolute paths outside the configured workspace."""
        abs_outside = str(self.outside.resolve())
        res = self.tool.execute({"query": "CLASSIFIED", "path": abs_outside})
        self.assertEqual(res["status"], "error")
        self.assertTrue("outside workspace" in res["error"].lower() or "traversal" in res["error"].lower())

    def test_adv_path_nonexistent(self):
        """Return structured error when search path does not exist."""
        res = self.tool.execute({"query": "hello", "path": "nonexistent_subfolder"})
        self.assertEqual(res["status"], "error")
        self.assertIn("not found", res["error"].lower())

    def test_adv_symlink_outside_skipped(self):
        """Symlink pointing to file outside workspace is skipped and not searched."""
        link_target = self.outside / "secret.key"
        link_path = self.workspace / "leak_link.key"
        try:
            link_path.symlink_to(link_target.resolve())
        except (OSError, NotImplementedError):
            # Platform does not support symlinks without elevated privileges
            return

        res = self.tool.execute({"query": "CLASSIFIED"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 0)


    def test_adv_ignored_dirs_omitted(self):
        """Ensure .git, node_modules, and .venv are automatically pruned from recursive scan."""
        git_dir = self.workspace / ".git"
        git_dir.mkdir()
        (git_dir / "config").write_text("HIDDEN_IN_GIT = True", encoding="utf-8")

        node_dir = self.workspace / "node_modules" / "express"
        node_dir.mkdir(parents=True)
        (node_dir / "index.js").write_text("HIDDEN_IN_NODE = True", encoding="utf-8")

        venv_dir = self.workspace / ".venv"
        venv_dir.mkdir()
        (venv_dir / "pyvenv.cfg").write_text("HIDDEN_IN_VENV = True", encoding="utf-8")

        res_git = self.tool.execute({"query": "HIDDEN_IN_GIT"})
        self.assertEqual(res_git["status"], "success")
        self.assertEqual(res_git["data"]["count"], 0)

        res_node = self.tool.execute({"query": "HIDDEN_IN_NODE"})
        self.assertEqual(res_node["status"], "success")
        self.assertEqual(res_node["data"]["count"], 0)

        res_venv = self.tool.execute({"query": "HIDDEN_IN_VENV"})
        self.assertEqual(res_venv["status"], "success")
        self.assertEqual(res_venv["data"]["count"], 0)

    def test_adv_binary_file_skipped(self):
        """Binary files are safely skipped without crash or garbled output."""
        bin_file = self.workspace / "app.exe"
        bin_file.write_bytes(b"\x00\x01\x02\x03\xffMATCH_IN_BIN\x00")

        res = self.tool.execute({"query": "MATCH_IN_BIN"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 0)

    def test_adv_invalid_utf8_handled(self):
        """Files with invalid UTF-8 bytes are handled with replacement without crashing."""
        broken_f = self.workspace / "latin1.txt"
        broken_f.write_bytes(b"header\n\x80\x81\x82 INVALID UTF8\nfooter with TARGET\n")

        res = self.tool.execute({"query": "TARGET"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)

    def test_adv_unreadable_file_handling(self):
        """Permission denied on file read skips file gracefully without crashing tool."""
        protected = self.workspace / "locked.txt"
        protected.write_text("sensitive_data_123", encoding="utf-8")

        from unittest.mock import patch
        orig_open = open

        def mock_open_fn(file, *args, **kwargs):
            if "locked.txt" in str(file):
                raise PermissionError("Access is denied")
            return orig_open(file, *args, **kwargs)

        with patch("builtins.open", side_effect=mock_open_fn):
            res = self.tool.execute({"query": "sensitive_data"})
            self.assertEqual(res["status"], "success")
            self.assertEqual(res["data"]["count"], 0)

    def test_adv_huge_file_skipped(self):
        """Files exceeding MAX_FILE_SIZE_BYTES (5 MB) are skipped to prevent memory bloat."""
        huge_file = self.workspace / "huge_data.csv"
        with open(huge_file, "wb") as f:
            f.seek(6 * 1024 * 1024 - 1)
            f.write(b"X")

        res = self.tool.execute({"query": "X"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 0)

    def test_adv_deeply_nested_directory(self):
        """Deeply nested directories are traversed recursively up to files."""
        deep_dir = self.workspace / "a" / "b" / "c" / "d" / "e"
        deep_dir.mkdir(parents=True)
        (deep_dir / "target.py").write_text("def nested_function(): pass\n", encoding="utf-8")

        res = self.tool.execute({"query": "nested_function"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)
        self.assertIn("target.py", res["data"]["matches"][0]["file"])

    def test_adv_filenames_with_spaces_and_unicode(self):
        """Filenames with spaces and Unicode characters are discovered cleanly."""
        fancy_file = self.workspace / "моя папка" / "файл 🚀 space.txt"
        fancy_file.parent.mkdir(parents=True)
        fancy_file.write_text("UNIQUE_UNICODE_TOKEN = 123\n", encoding="utf-8")

        res = self.tool.execute({"query": "UNIQUE_UNICODE_TOKEN"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["count"], 1)
        self.assertIn("space.txt", res["data"]["matches"][0]["file"])

    def test_adv_repeated_searches(self):
        """Multiple consecutive searches run cleanly without descriptor leaks."""
        (self.workspace / "cycle.txt").write_text("cycle_target\n", encoding="utf-8")
        for _ in range(10):
            res = self.tool.execute({"query": "cycle_target"})
            self.assertEqual(res["status"], "success")
            self.assertEqual(res["data"]["count"], 1)


# ==============================================================================
# CalculatorTool Unit Tests
# ==============================================================================

class TestCalculatorTool(unittest.TestCase):
    """Unit tests for safe mathematical evaluation using CalculatorTool."""

    def setUp(self):
        self.tool = CalculatorTool()

    def test_calculator_metadata(self):
        """Verify CalculatorTool metadata and schema."""
        self.assertEqual(self.tool.name, "calculator_tool")
        self.assertIsInstance(self.tool.description, str)
        self.assertGreater(len(self.tool.description), 0)

        schema = self.tool.input_schema
        self.assertEqual(schema["type"], "object")
        self.assertIn("expression", schema["properties"])
        self.assertIn("expression", schema["required"])

        exported = self.tool.to_schema()
        self.assertEqual(exported["name"], "calculator_tool")
        self.assertEqual(exported["parameters"], schema)

    def test_basic_arithmetic(self):
        """Verify addition, subtraction, multiplication, division."""
        res_add = self.tool.execute({"expression": "2 + 3"})
        self.assertEqual(res_add["status"], "success")
        self.assertEqual(res_add["data"]["result"], 5)

        res_sub = self.tool.execute({"expression": "10 - 4"})
        self.assertEqual(res_sub["status"], "success")
        self.assertEqual(res_sub["data"]["result"], 6)

        res_mul = self.tool.execute({"expression": "7 * 8"})
        self.assertEqual(res_mul["status"], "success")
        self.assertEqual(res_mul["data"]["result"], 56)

        res_div = self.tool.execute({"expression": "100 / 4"})
        self.assertEqual(res_div["status"], "success")
        self.assertEqual(res_div["data"]["result"], 25.0)

    def test_floor_division_and_modulo(self):
        """Verify integer division and remainder operations."""
        res_fdiv = self.tool.execute({"expression": "17 // 3"})
        self.assertEqual(res_fdiv["status"], "success")
        self.assertEqual(res_fdiv["data"]["result"], 5)

        res_mod = self.tool.execute({"expression": "20 % 7"})
        self.assertEqual(res_mod["status"], "success")
        self.assertEqual(res_mod["data"]["result"], 6)

    def test_exponentiation(self):
        """Verify safe power operations."""
        res_pow = self.tool.execute({"expression": "2 ** 8"})
        self.assertEqual(res_pow["status"], "success")
        self.assertEqual(res_pow["data"]["result"], 256)

    def test_operator_precedence(self):
        """Verify standard arithmetic operator precedence (PEMDAS)."""
        res = self.tool.execute({"expression": "2 + 3 * 4"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["result"], 14)

    def test_parentheses(self):
        """Verify grouping with parentheses overrides default precedence."""
        res = self.tool.execute({"expression": "(2 + 3) * 4"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["result"], 20)

    def test_negative_numbers_and_unary(self):
        """Verify unary positive and negative operators."""
        res1 = self.tool.execute({"expression": "-5 + 10"})
        self.assertEqual(res1["status"], "success")
        self.assertEqual(res1["data"]["result"], 5)

        res2 = self.tool.execute({"expression": "-(3 + 2)"})
        self.assertEqual(res2["status"], "success")
        self.assertEqual(res2["data"]["result"], -5)

        res3 = self.tool.execute({"expression": "+42"})
        self.assertEqual(res3["status"], "success")
        self.assertEqual(res3["data"]["result"], 42)

    def test_floats_and_decimals(self):
        """Verify floating-point computations."""
        res = self.tool.execute({"expression": "3.5 * 2.0"})
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["data"]["result"], 7.0)

    def test_complex_expression(self):
        """Verify multi-step complex arithmetic expression."""
        res = self.tool.execute({"expression": "((100 - 20) / 4) + (2 ** 3) * 2"})
        self.assertEqual(res["status"], "success")
        # ((80) / 4) + 8 * 2 = 20.0 + 16 = 36.0
        self.assertEqual(res["data"]["result"], 36.0)

    def test_kwargs_and_string_invocation(self):
        """Verify keyword and direct string invocation styles."""
        res1 = self.tool.execute(expression="15 + 15")
        self.assertEqual(res1["status"], "success")
        self.assertEqual(res1["data"]["result"], 30)

        res2 = self.tool.execute("50 - 20")
        self.assertEqual(res2["status"], "success")
        self.assertEqual(res2["data"]["result"], 30)


# ==============================================================================
# CalculatorTool Adversarial & Security Tests
# ==============================================================================

class TestCalculatorToolAdversarial(unittest.TestCase):
    """Security penetration tests and boundary checks against CalculatorTool."""

    def setUp(self):
        self.tool = CalculatorTool()

    def test_adv_missing_expression(self):
        """Reject execution when expression argument is missing."""
        res = self.tool.execute({})
        self.assertEqual(res["status"], "error")
        self.assertIn("expression", res["error"].lower())

    def test_adv_empty_and_whitespace_expression(self):
        """Reject empty and whitespace-only expressions."""
        for empty_expr in ("", "   ", "\t\n"):
            res = self.tool.execute({"expression": empty_expr})
            self.assertEqual(res["status"], "error")
            self.assertIn("expression", res["error"].lower())

    def test_adv_invalid_expression_type(self):
        """Reject non-string expression types."""
        res = self.tool.execute({"expression": 12345})
        self.assertEqual(res["status"], "error")
        self.assertIn("expression", res["error"].lower())

    def test_adv_expression_too_long(self):
        """Reject expressions exceeding maximum length limit."""
        res = self.tool.execute({"expression": "1+" * 300})
        self.assertEqual(res["status"], "error")
        self.assertIn("maximum length limit", res["error"].lower())

    def test_adv_division_by_zero(self):
        """Return structured error on division by zero without uncaught exception."""
        res = self.tool.execute({"expression": "10 / 0"})
        self.assertEqual(res["status"], "error")
        self.assertIn("division by zero", res["error"].lower())

    def test_adv_floor_division_by_zero(self):
        """Return structured error on floor division by zero."""
        res = self.tool.execute({"expression": "10 // 0"})
        self.assertEqual(res["status"], "error")
        self.assertIn("division by zero", res["error"].lower())

    def test_adv_modulo_by_zero(self):
        """Return structured error on modulo by zero."""
        res = self.tool.execute({"expression": "10 % 0"})
        self.assertEqual(res["status"], "error")
        self.assertIn("modulo by zero", res["error"].lower())

    def test_adv_malformed_syntax(self):
        """Return structured error on malformed mathematical syntax."""
        for malformed in ("2 + * 3", "((1 + 2)", "2 + +", "3 **"):
            res = self.tool.execute({"expression": malformed})
            self.assertEqual(res["status"], "error")
            self.assertTrue("malformed" in res["error"].lower() or "syntax" in res["error"].lower())

    def test_adv_security_import_statement(self):
        """Block attempts to execute import statements."""
        res = self.tool.execute({"expression": "import os"})
        self.assertEqual(res["status"], "error")

    def test_adv_security_dunder_import(self):
        """Block __import__ function calls."""
        res = self.tool.execute({"expression": "__import__('os').system('whoami')"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_open_file(self):
        """Block attempts to call open() or read files."""
        res = self.tool.execute({"expression": "open('secret.txt').read()"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_os_system(self):
        """Block attempts to call os.system."""
        res = self.tool.execute({"expression": "os.system('ls')"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_subprocess(self):
        """Block attempts to call subprocess."""
        res = self.tool.execute({"expression": "subprocess.Popen('id')"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_attribute_access(self):
        """Block attribute access traversal (e.g. __class__, __subclasses__)."""
        res = self.tool.execute({"expression": "(1).__class__.__bases__"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_built_in_function_calls(self):
        """Block general function calls (eval, abs, len, print)."""
        for fn_call in ("abs(-5)", "len([1,2])", "print('hacked')", "eval('2+2')"):
            res = self.tool.execute({"expression": fn_call})
            self.assertEqual(res["status"], "error")
            self.assertTrue("security" in res["error"].lower() or "not permitted" in res["error"].lower())

    def test_adv_security_lambda_and_comprehensions(self):
        """Block lambdas and comprehensions."""
        res_lambda = self.tool.execute({"expression": "(lambda x: x + 1)(5)"})
        self.assertEqual(res_lambda["status"], "error")

        res_comp = self.tool.execute({"expression": "[x for x in range(10)]"})
        self.assertEqual(res_comp["status"], "error")

    def test_adv_security_strings_and_collections(self):
        """Block string literals, lists, and dicts."""
        res_str = self.tool.execute({"expression": "'malicious string'"})
        self.assertEqual(res_str["status"], "error")

        res_list = self.tool.execute({"expression": "[1, 2, 3]"})
        self.assertEqual(res_list["status"], "error")

        res_dict = self.tool.execute({"expression": "{'a': 1}"})
        self.assertEqual(res_dict["status"], "error")

    def test_adv_enormous_exponent(self):
        """Block astronomical exponent calculations that could freeze CPU."""
        res = self.tool.execute({"expression": "2 ** 999999"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("exponent" in res["error"].lower() or "overflow" in res["error"].lower())

    def test_adv_huge_base_and_exponent(self):
        """Block large power operations exceeding digit thresholds."""
        res = self.tool.execute({"expression": "9999 ** 999"})
        self.assertEqual(res["status"], "error")
        self.assertTrue("overflow" in res["error"].lower() or "digit size" in res["error"].lower())

    def test_adv_complex_numbers_rejected(self):
        """Reject complex number results (e.g. square root of negative numbers) for JSON safety."""
        res = self.tool.execute({"expression": "(-4) ** 0.5"})
        self.assertEqual(res["status"], "error")
        self.assertIn("complex", res["error"].lower())


    def test_adv_repeated_calculations(self):
        """Multiple consecutive calculations execute cleanly without state leaks."""
        for i in range(20):
            res = self.tool.execute({"expression": f"{i} * {i}"})
            self.assertEqual(res["status"], "success")
            self.assertEqual(res["data"]["result"], i * i)


# ==============================================================================
# ToolRegistry Integration Tests (Part 2)
# ==============================================================================

class TestPart2ToolRegistryIntegration(unittest.TestCase):
    """Verify ToolRegistry registers, discovers, and dispatches SearchTool and CalculatorTool."""

    def setUp(self):
        self._temp_dir = tempfile.TemporaryDirectory()
        self.workspace = Path(self._temp_dir.name)
        (self.workspace / "test.py").write_text("def find_me(): return 42\n", encoding="utf-8")

    def tearDown(self):
        self._temp_dir.cleanup()

    def test_registry_integration_flow(self):
        """Verify ToolRegistry dynamically dispatches SearchTool and CalculatorTool."""
        async def _run():
            registry = ToolRegistry()
            search_tool = SearchTool(workspace_root=self.workspace)
            calculator_tool = CalculatorTool()

            registry.register(search_tool)
            registry.register(calculator_tool)

            # 1. Tools appear in catalog with valid schemas
            tools = registry.list_tools()
            tool_names = [t["name"] for t in tools]
            self.assertIn("search_tool", tool_names)
            self.assertIn("calculator_tool", tool_names)

            # 2. Dynamic execution of SearchTool
            search_res = await registry.execute("search_tool", query="find_me")
            self.assertEqual(search_res["status"], "success")
            self.assertEqual(search_res["data"]["count"], 1)

            # 3. Dynamic execution of CalculatorTool
            calc_res = await registry.execute("calculator_tool", expression="25 * 4")
            self.assertEqual(calc_res["status"], "success")
            self.assertEqual(calc_res["data"]["result"], 100)

            # 4. Failure handling via registry returns structured error without crashing
            calc_err = await registry.execute("calculator_tool", expression="10 / 0")
            self.assertEqual(calc_err["status"], "error")
            self.assertIn("division by zero", calc_err["error"].lower())

        asyncio.run(_run())


# ==============================================================================
# Autonomous Agent Policy Review (Part 2)
# ==============================================================================

class TestPart2AutonomousPolicy(unittest.TestCase):
    """Verify SearchTool and CalculatorTool remain passive execution components without autonomous routing."""

    def test_search_tool_is_passive(self):
        """SearchTool does not attempt fallbacks or call other tools on missing path."""
        tool = SearchTool()
        res = tool.execute({"query": "target", "path": "does_not_exist_abc"})
        self.assertEqual(res["status"], "error")
        self.assertNotIn("fallback_action", res)
        self.assertNotIn("next_tool", res)

    def test_calculator_tool_is_passive(self):
        """CalculatorTool does not attempt shell execution or alternate tools on syntax failure."""
        tool = CalculatorTool()
        res = tool.execute({"expression": "invalid + * syntax"})
        self.assertEqual(res["status"], "error")
        self.assertNotIn("fallback_action", res)
        self.assertNotIn("retry_with", res)


if __name__ == "__main__":
    unittest.main()
