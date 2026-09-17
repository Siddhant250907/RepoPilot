"""
Shell Command Execution Tool.

Owner: Person 2

Responsibilities:
- Execute terminal commands (e.g. pytest, npm test, python script.py, git diff).
- Enforce strict timeouts to prevent hanging commands.
- Capture stdout, stderr, and return codes as structured observations.
- Disallow dangerous destructive commands.
- Restrict execution to the configured workspace root directory.
"""

import os
import shlex
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from backend.tools.base import BaseTool, ToolResult


class ShellTool(BaseTool):
    """Tool for executing terminal commands within a workspace sandbox."""

    name: str = "shell_tool"
    description: str = "Execute shell commands (e.g. run tests, linters, or scripts) with timeout."

    # Practical safety blocklist of destructive command patterns
    DANGEROUS_PATTERNS = [
        "mkfs",
        ":(){ :|:& };:",
        "forkbomb",
        "format c:",
        "rm -rf /",
        "rm -rf /*",
        "rmdir /s /q c:\\",
        "del /f /s /q c:\\",
    ]

    def __init__(
        self,
        workspace_root: Optional[Union[str, Path, int]] = None,
        timeout_seconds: int = 30
    ):
        if isinstance(workspace_root, int):
            # Support ShellTool(30) legacy positional parameter
            self.timeout_seconds = workspace_root
            self.workspace_root = Path.cwd().resolve()
        else:
            self.workspace_root = Path(workspace_root).resolve() if workspace_root else Path.cwd().resolve()
            self.timeout_seconds = timeout_seconds

    @property
    def input_schema(self) -> Dict[str, Any]:
        """Return JSON Schema for ShellTool parameters."""
        return {
            "type": "object",
            "properties": {
                "command": {
                    "type": ["array", "string"],
                    "items": {"type": "string"},
                    "description": "Command to execute as a list of argument strings (preferred) or as a command string."
                },
                "timeout": {
                    "type": "integer",
                    "description": "Optional execution timeout in seconds (overrides default timeout)."
                }
            },
            "required": ["command"]
        }

    def execute(self, arguments: Optional[Union[Dict[str, Any], List[str], str]] = None, **kwargs) -> ToolResult:
        """
        Execute command synchronously or awaitably.
        Captures stdout, stderr, exit code, and guards with a timeout.
        """
        params: Dict[str, Any] = {}
        if isinstance(arguments, dict):
            params.update(arguments)
        elif isinstance(arguments, (list, tuple)):
            params["command"] = list(arguments)
        elif isinstance(arguments, str):
            params["command"] = arguments
        params.update(kwargs)

        raw_cmd = params.get("command")
        if raw_cmd is None:
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'command'"
            })

        # 1. Parse and validate command arguments
        cmd_args: List[str] = []
        if isinstance(raw_cmd, str):
            trimmed = raw_cmd.strip()
            if not trimmed:
                return ToolResult({
                    "status": "error",
                    "error": "Empty or invalid command"
                })
            try:
                tokens = shlex.split(trimmed, posix=(os.name != "nt"))
                cleaned_tokens = []
                for token in tokens:
                    if (token.startswith('"') and token.endswith('"')) or (token.startswith("'") and token.endswith("'")):
                        cleaned_tokens.append(token[1:-1])
                    else:
                        cleaned_tokens.append(token)
                cmd_args = cleaned_tokens
            except ValueError as ve:
                return ToolResult({
                    "status": "error",
                    "error": f"Failed to parse command string: {str(ve)}"
                })
        elif isinstance(raw_cmd, (list, tuple)):
            if len(raw_cmd) == 0:
                return ToolResult({
                    "status": "error",
                    "error": "Empty or invalid command"
                })
            cmd_args = [str(arg) for arg in raw_cmd]
            if not any(arg.strip() for arg in cmd_args):
                return ToolResult({
                    "status": "error",
                    "error": "Empty or invalid command"
                })
        else:
            return ToolResult({
                "status": "error",
                "error": f"Invalid command argument type: {type(raw_cmd).__name__}"
            })

        # 2. Check for dangerous destructive patterns
        cmd_str_joined = " ".join(cmd_args).lower()
        for pattern in self.DANGEROUS_PATTERNS:
            if pattern in cmd_str_joined:
                return ToolResult({
                    "status": "error",
                    "error": f"Command rejected: destructive pattern detected ('{pattern}')"
                })

        # 3. Determine execution timeout
        timeout = params.get("timeout", self.timeout_seconds)
        try:
            timeout_val = float(timeout)
            if timeout_val <= 0:
                timeout_val = float(self.timeout_seconds)
        except (ValueError, TypeError):
            timeout_val = float(self.timeout_seconds)

        # 4. Determine and enforce working directory containment
        custom_cwd = params.get("cwd")
        if custom_cwd:
            try:
                from backend.utils.security import resolve_safe_path
                effective_cwd = resolve_safe_path(custom_cwd, self.workspace_root)
                if not effective_cwd.exists() or not effective_cwd.is_dir():
                    return ToolResult({
                        "status": "error",
                        "error": f"Working directory not found or not a directory: '{custom_cwd}'"
                    })
            except PermissionError as pe:
                return ToolResult({
                    "status": "error",
                    "error": f"Working directory escapes workspace: {str(pe)}"
                })
            except Exception as exc:
                return ToolResult({
                    "status": "error",
                    "error": f"Invalid working directory: {str(exc)}"
                })
        else:
            effective_cwd = self.workspace_root

        if not effective_cwd.exists():
            try:
                effective_cwd.mkdir(parents=True, exist_ok=True)
            except Exception as e:
                return ToolResult({
                    "status": "error",
                    "error": f"Configured workspace does not exist and could not be created: {str(e)}"
                })
        elif not effective_cwd.is_dir():
            return ToolResult({
                "status": "error",
                "error": f"Configured workspace is a file, not a directory: '{effective_cwd}'"
            })

        # 5. Execute process without shell=True
        MAX_OUTPUT_CHARS = 500_000
        try:
            process = subprocess.run(
                cmd_args,
                cwd=str(effective_cwd),
                capture_output=True,
                text=True,
                timeout=timeout_val,
                shell=False,
            )

            stdout_text = process.stdout
            if len(stdout_text) > MAX_OUTPUT_CHARS:
                stdout_text = stdout_text[:MAX_OUTPUT_CHARS] + "\n... [Output truncated]"

            stderr_text = process.stderr
            if len(stderr_text) > MAX_OUTPUT_CHARS:
                stderr_text = stderr_text[:MAX_OUTPUT_CHARS] + "\n... [Output truncated]"

            if process.returncode == 0:
                return ToolResult({
                    "status": "success",
                    "stdout": stdout_text,
                    "stderr": stderr_text,
                    "exit_code": 0
                })
            else:
                err_msg = stderr_text.strip() if stderr_text.strip() else f"Command failed with exit code {process.returncode}"
                return ToolResult({
                    "status": "error",
                    "error": err_msg,
                    "stdout": stdout_text,
                    "stderr": stderr_text,
                    "exit_code": process.returncode
                })

        except subprocess.TimeoutExpired:
            return ToolResult({
                "status": "error",
                "error": "Command timed out"
            })
        except FileNotFoundError:
            return ToolResult({
                "status": "error",
                "error": f"Command executable not found: {cmd_args[0]}"
            })
        except PermissionError as pe:
            return ToolResult({
                "status": "error",
                "error": f"Permission denied executing command: {str(pe)}"
            })
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Unexpected subprocess exception: {str(exc)}"
            })
