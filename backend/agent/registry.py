"""
Tool Registry and Dynamic Dispatcher.

Owner: Person 1

Responsibilities:
- Register available tool instances.
- Generate unified tool schemas/descriptions to inject into LLM system prompts.
- Dynamically dispatch tool calls to registered tool implementations.
- Enforce that tool selection is autonomous and never hardcoded.

TODO:
- Implement tool registration decorator or register method.
- Implement `dispatch(tool_name: str, **args)` with error boundary.
- Generate tool catalogue documentation for LLM prompt.
"""

from typing import Dict, Any, List
from backend.tools.base import BaseTool


class ToolRegistry:
    """Dynamic registry for tools accessible to the agent."""

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool instance."""
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool:
        """Retrieve tool by name."""
        if name not in self._tools:
            raise KeyError(f"Tool '{name}' not found in registry.")
        return self._tools[name]

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return descriptions and schemas for all registered tools."""
        return [tool.to_schema() for tool in self._tools.values()]

    async def execute(self, name: str, **kwargs) -> Any:
        """Execute a tool dynamically by name."""
        tool = self.get_tool(name)
        return await tool.execute(**kwargs)
