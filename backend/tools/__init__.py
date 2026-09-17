"""
Tools Package.

Owner: Person 2

Houses concrete tool implementations and execution boundaries:
- BaseTool (abstract interface)
- ToolResult (structured result dictionary with async support)
- FileTool (codebase exploration and file inspection)
- ShellTool (sandboxed terminal command runner)
- SearchTool (web search for errors and docs)
- CalculatorTool (deterministic math computations)
"""

from backend.tools.base import BaseTool, ToolResult
from backend.tools.file_tool import FileTool
from backend.tools.shell_tool import ShellTool
from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool

__all__ = [
    "BaseTool",
    "ToolResult",
    "FileTool",
    "ShellTool",
    "SearchTool",
    "CalculatorTool",
]

