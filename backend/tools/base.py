"""
Base Tool Abstract Interface.

Owner: Person 2

Responsibilities:
- Define standard contract for all RepoPilot tools (`name`, `description`, `execute()`).
- Provide parameter schema generation for LLM prompt context.
- Encapsulate tool execution errors so they return structured error observations rather than crashing.

TODO:
- Implement standard validation logic for tool arguments.
- Add execution timeout wrapper method.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseTool(ABC):
    """Abstract base class for all agent tools."""

    name: str = "base_tool"
    description: str = "Base tool description"

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """
        Execute the tool action.
        Must handle its own exceptions and return structured outputs/errors.
        """
        pass

    def to_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation of the tool for the LLM prompt."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": {},
        }
