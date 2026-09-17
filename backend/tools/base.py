"""
Base Tool Abstract Interface.

Owner: Person 2

Responsibilities:
- Define standard contract for all RepoPilot tools (`name`, `description`, `input_schema`, `execute()`).
- Provide parameter schema generation for LLM prompt context.
- Encapsulate tool execution errors so they return structured error observations rather than crashing.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ToolResult(dict):
    """
    Structured tool execution result dictionary.
    Inherits from dict and implements __await__ so it can be used synchronously
    or awaited directly in asynchronous pipelines (such as ToolRegistry dynamic dispatcher).
    """

    def __await__(self):
        async def _async_self():
            return self

        return _async_self().__await__()


class BaseTool(ABC):
    """Abstract base class for all agent tools."""

    name: str = "base_tool"
    description: str = "Base tool description"

    @property
    def input_schema(self) -> Dict[str, Any]:
        """
        Return the JSON Schema object describing valid arguments for the tool.
        Subclasses can override this property or provide a schema dictionary.
        """
        return {
            "type": "object",
            "properties": {},
            "required": [],
        }

    @abstractmethod
    def execute(self, arguments: Optional[Dict[str, Any]] = None, **kwargs) -> Any:
        """
        Execute the tool action.
        Must handle its own exceptions and return structured outputs/errors.
        Can be called synchronously or awaited.
        """
        pass

    def to_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation of the tool for the LLM prompt."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.input_schema,
        }
