"""
Unit Tests for Tool Implementations.

Owner: Person 2 (Tools)
"""

import unittest
from backend.tools.file_tool import FileTool
from backend.tools.shell_tool import ShellTool
from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool


class TestTools(unittest.TestCase):
    """Test suite for tool metadata and schemas."""

    def test_tool_names(self):
        """Verify each tool possesses a descriptive name."""
        self.assertEqual(FileTool().name, "file_tool")
        self.assertEqual(ShellTool().name, "shell_tool")
        self.assertEqual(SearchTool().name, "search_tool")
        self.assertEqual(CalculatorTool().name, "calculator_tool")


if __name__ == "__main__":
    unittest.main()
