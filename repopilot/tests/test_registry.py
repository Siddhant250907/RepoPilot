"""
Unit Tests for Tool Registry.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.registry import ToolRegistry
from backend.tools.base import BaseTool


class DummyTool(BaseTool):
    name = "dummy_tool"
    description = "A dummy tool for unit testing."

    async def execute(self, **kwargs):
        return "dummy_result"


class TestToolRegistry(unittest.TestCase):
    """Test suite for ToolRegistry registration and lookup."""

    def setUp(self):
        self.registry = ToolRegistry()

    def test_register_and_get_tool(self):
        """Verify tool registration and retrieval."""
        tool = DummyTool()
        self.registry.register(tool)
        retrieved = self.registry.get_tool("dummy_tool")
        self.assertEqual(retrieved.name, "dummy_tool")

    def test_missing_tool_raises(self):
        """Verify querying nonexistent tool raises KeyError."""
        with self.assertRaises(KeyError):
            self.registry.get_tool("nonexistent")


if __name__ == "__main__":
    unittest.main()
