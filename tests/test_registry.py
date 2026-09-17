"""
Unit Tests for Tool Registry.

Owner: Person 1 (Agent Core)
"""

import unittest
import asyncio
from backend.agent.registry import ToolRegistry
from backend.tools.base import BaseTool, ToolResult


class DummyTool(BaseTool):
    name = "dummy_tool"
    description = "A dummy tool for unit testing."

    @property
    def input_schema(self):
        return {
            "type": "object",
            "properties": {
                "param1": {"type": "string"}
            }
        }

    async def execute(self, **kwargs):
        return ToolResult({"status": "success", "echo": kwargs})


class TestToolRegistry(unittest.TestCase):
    """Test suite for ToolRegistry registration, schema listing, and dynamic execution."""

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

    def test_list_tools_schema_generation(self):
        """Verify registry produces valid tool metadata list for LLM context."""
        tool = DummyTool()
        self.registry.register(tool)
        tools_list = self.registry.list_tools()
        self.assertEqual(len(tools_list), 1)
        self.assertEqual(tools_list[0]["name"], "dummy_tool")
        self.assertEqual(tools_list[0]["description"], "A dummy tool for unit testing.")
        self.assertIn("parameters", tools_list[0])

    def test_dynamic_execute(self):
        """Verify registry executes tool dynamically with arbitrary kwargs."""
        tool = DummyTool()
        self.registry.register(tool)
        result = asyncio.run(self.registry.execute("dummy_tool", param1="value1"))
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["echo"], {"param1": "value1"})


if __name__ == "__main__":
    unittest.main()
