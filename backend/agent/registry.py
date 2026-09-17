"""
Tool Registry for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Store available tool instances indexed by their unique name.
- Provide lookup and retrieval methods for individual tools and all registered tools.
- Maintain neutrality: the registry does NOT decide which tool to use.
  Tool selection is determined autonomously by the LLM.
"""

from typing import Dict, Any, List, Optional


class ToolRegistry:
    """A simple generic registry for managing agent tools."""

    def __init__(self):
        self._tools: Dict[str, Any] = {}

    def register(self, tool: Any) -> None:
        """
        Register a tool by its name.
        The tool must have a 'name' attribute.
        """
        name = getattr(tool, "name", None)
        if not name and isinstance(tool, dict):
            name = tool.get("name")
        if not name:
            raise ValueError("Tool must have a valid 'name' attribute.")
        self._tools[name] = tool

    def get(self, name: str) -> Optional[Any]:
        """
        Retrieve a tool by name.
        Returns None if the tool is not registered.
        """
        return self._tools.get(name)

    def get_all(self) -> List[Any]:
        """
        Return a list of all registered tools.
        """
        return list(self._tools.values())

    def get_tool(self, name: str) -> Any:
        """
        Retrieve a tool by name, raising KeyError if not found.
        Maintained for strict lookup and backwards compatibility.
        """
        if name not in self._tools:
            raise KeyError(f"Tool '{name}' not found in registry.")
        return self._tools[name]

    def list_tools(self) -> List[Dict[str, Any]]:
        """Return descriptions and schemas for all registered tools."""
        schemas = []
        for tool in self._tools.values():
            if hasattr(tool, "to_schema") and callable(tool.to_schema):
                schemas.append(tool.to_schema())
            elif isinstance(tool, dict):
                schemas.append(tool)
            else:
                schemas.append({
                    "name": getattr(tool, "name", "unknown"),
                    "description": getattr(tool, "description", ""),
                    "parameters": getattr(tool, "input_schema", {}),
                })
        return schemas

    async def execute(self, name: str, *args: Any, **kwargs: Any) -> Any:
        """Execute a tool dynamically by name."""
        tool = self.get(name) or self.get_tool(name)
        if hasattr(tool, "execute") and callable(tool.execute):
            import inspect
            if inspect.iscoroutinefunction(tool.execute):
                return await tool.execute(*args, **kwargs)
            res = tool.execute(*args, **kwargs)
            return await res if inspect.isawaitable(res) else res
        raise AttributeError(f"Tool '{name}' has no executable interface.")

    def __contains__(self, name: str) -> bool:
        """Check if a tool is registered by name."""
        return name in self._tools

    def __len__(self) -> int:
        """Return the number of registered tools."""
        return len(self._tools)
