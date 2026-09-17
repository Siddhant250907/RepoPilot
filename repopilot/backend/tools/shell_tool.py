"""
Shell Command Execution Tool.

Owner: Person 2

Responsibilities:
- Execute terminal commands (e.g. pytest, npm test, python script.py, git diff).
- Enforce strict timeouts to prevent hanging commands.
- Capture stdout, stderr, and return codes as structured observations.
- Disallow dangerous commands (e.g. destructive formatting, interactive prompts).

TODO:
- Implement async subprocess execution with timeout.
- Implement command blocklist / sanitization checks.
"""

from backend.tools.base import BaseTool
from typing import Any


class ShellTool(BaseTool):
    """Tool for running sandboxed terminal commands."""

    name: str = "shell_tool"
    description: str = "Execute shell commands (e.g. run tests, linters, or scripts) with timeout."

    def __init__(self, timeout_seconds: int = 30):
        self.timeout_seconds = timeout_seconds

    async def execute(self, command: str = "", **kwargs) -> Any:
        """
        Execute shell command asynchronously with timeout guard.

        TODO: Implement async subprocess execution with timeout and output capture.
        """
        raise NotImplementedError("ShellTool pending implementation by Person 2")
