"""
File Inspection and Exploration Tool.

Owner: Person 2

Responsibilities:
- Safely read file contents, list directories, and locate files in target repositories.
- Enforce path containment within allowed project root (prevent path traversal attacks).
- Handle missing files, binary files, and permission errors gracefully without crashing.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from backend.tools.base import BaseTool, ToolResult
from backend.utils.security import resolve_safe_path


class FileTool(BaseTool):
    """Tool for exploring and inspecting files within the repository workspace."""

    name: str = "file_tool"
    description: str = "Read file contents, write/update file contents, list directory entries, or search text across files in the workspace."

    def __init__(self, workspace_root: Optional[Union[str, Path]] = None):
        if workspace_root:
            self.workspace_root = Path(workspace_root).resolve()
        else:
            self.workspace_root = Path.cwd().resolve()

    @property
    def input_schema(self) -> Dict[str, Any]:
        """Return JSON Schema for FileTool arguments."""
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "enum": ["list", "read", "search", "write"],
                    "description": "File system action to perform: 'list', 'read', 'search', or 'write'."
                },
                "path": {
                    "type": "string",
                    "description": "Target file or directory path relative to workspace root."
                },
                "content": {
                    "type": "string",
                    "description": "Text content to write into the file (required for 'write' action)."
                },
                "query": {
                    "type": "string",
                    "description": "Search query string (required for 'search' action)."
                }
            },
            "required": ["action", "path"]
        }

    def execute(self, arguments: Optional[Dict[str, Any]] = None, **kwargs) -> ToolResult:
        """
        Execute file action synchronously or awaitably.
        Supports passing arguments as a single dictionary or as keyword arguments.
        """
        params: Dict[str, Any] = {}
        if isinstance(arguments, dict):
            params.update(arguments)
        elif isinstance(arguments, str):
            params["action"] = arguments
        params.update(kwargs)

        # 1. Validate action
        action = params.get("action")
        if not action or not isinstance(action, str):
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'action'"
            })

        action = action.strip().lower()
        if action not in ("list", "read", "search", "write"):
            return ToolResult({
                "status": "error",
                "error": f"Unknown action: '{action}'. Supported actions are: 'list', 'read', 'search'"
            })

        # 2. Validate path
        raw_path = params.get("path")
        if raw_path is None or (isinstance(raw_path, str) and raw_path.strip() == ""):
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'path'"
            })

        if not isinstance(raw_path, (str, Path)):
            return ToolResult({
                "status": "error",
                "error": f"Invalid path argument type: {type(raw_path).__name__}"
            })

        # 3. Path security and containment check
        try:
            target_path = resolve_safe_path(raw_path, self.workspace_root)
        except PermissionError as pe:
            return ToolResult({
                "status": "error",
                "error": f"Path traversal error: {str(pe)}"
            })
        except Exception as e:
            return ToolResult({
                "status": "error",
                "error": f"Invalid path: {str(e)}"
            })

        # 4. Dispatch action
        try:
            if action == "list":
                return self._list_directory(target_path, raw_path)
            elif action == "read":
                return self._read_file(target_path, raw_path)
            elif action == "search":
                query = params.get("query")
                return self._search_files(target_path, raw_path, query)
            elif action == "write":
                content = params.get("content")
                if content is None:
                    return ToolResult({
                        "status": "error",
                        "error": "Missing required argument: 'content' for action 'write'"
                    })
                return self._write_file(target_path, raw_path, str(content))
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Unexpected filesystem exception: {str(exc)}"
            })

        return ToolResult({
            "status": "error",
            "error": f"Unhandled action: {action}"
        })

    def _write_file(self, target_path: Path, raw_path: Any, content: str) -> ToolResult:
        """Safely write content to a file within target_path."""
        try:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_text(content, encoding="utf-8")
            return ToolResult({
                "status": "success",
                "data": f"Successfully wrote {len(content)} characters to '{raw_path}'",
                "path": str(raw_path)
            })
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Failed to write file '{raw_path}': {str(exc)}"
            })

    def _list_directory(self, target_path: Path, raw_path: Any) -> ToolResult:
        """List files and directories within target_path."""
        if not target_path.exists():
            return ToolResult({
                "status": "error",
                "error": f"Directory not found: '{raw_path}'"
            })

        if not target_path.is_dir():
            return ToolResult({
                "status": "error",
                "error": f"Path is not a directory: '{raw_path}'"
            })

        try:
            entries = []
            for item in sorted(target_path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower())):
                try:
                    rel = str(item.relative_to(self.workspace_root))
                except ValueError:
                    rel = item.name

                is_dir = item.is_dir()
                size = None
                if not is_dir:
                    try:
                        size = item.stat().st_size
                    except OSError:
                        size = None

                entries.append({
                    "name": item.name,
                    "type": "directory" if is_dir else "file",
                    "path": rel,
                    "size_bytes": size,
                })

            return ToolResult({
                "status": "success",
                "data": entries
            })
        except PermissionError as pe:
            return ToolResult({
                "status": "error",
                "error": f"Permission denied accessing directory: {str(pe)}"
            })
        except OSError as oe:
            return ToolResult({
                "status": "error",
                "error": f"Filesystem error listing directory: {str(oe)}"
            })

    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

    def _read_file(self, target_path: Path, raw_path: Any) -> ToolResult:
        """Read content of a text file."""
        if not target_path.exists():
            return ToolResult({
                "status": "error",
                "error": f"File not found: '{raw_path}'"
            })

        if target_path.is_dir():
            return ToolResult({
                "status": "error",
                "error": f"Attempting to read directory as file: '{raw_path}'"
            })

        try:
            # Check for very large file to avoid OOM or process hanging
            try:
                if target_path.stat().st_size > self.MAX_FILE_SIZE:
                    return ToolResult({
                        "status": "error",
                        "error": f"File '{raw_path}' exceeds maximum allowable size of {self.MAX_FILE_SIZE // (1024 * 1024)} MB."
                    })
            except OSError:
                pass

            # Check for binary content by reading small initial chunk
            with open(target_path, "rb") as bf:
                chunk = bf.read(1024)
                if b"\x00" in chunk:
                    return ToolResult({
                        "status": "error",
                        "error": f"File '{raw_path}' is a binary file and cannot be read as text."
                    })

            with open(target_path, "r", encoding="utf-8") as f:
                content = f.read()

            return ToolResult({
                "status": "success",
                "data": content
            })
        except UnicodeDecodeError:
            return ToolResult({
                "status": "error",
                "error": f"File '{raw_path}' has invalid encoding or is not valid UTF-8."
            })
        except PermissionError as pe:
            return ToolResult({
                "status": "error",
                "error": f"Permission denied reading file: {str(pe)}"
            })
        except OSError as oe:
            return ToolResult({
                "status": "error",
                "error": f"Filesystem error reading file: {str(oe)}"
            })

    def _search_files(self, target_path: Path, raw_path: Any, query: Any) -> ToolResult:
        """Search text recursively in files."""
        if query is None or not isinstance(query, str) or query.strip() == "":
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'query' for search action"
            })

        if not target_path.exists():
            return ToolResult({
                "status": "error",
                "error": f"Path not found: '{raw_path}'"
            })

        matches: List[Dict[str, Any]] = []
        max_results = 200

        # Directories to ignore during recursive search
        ignored_dir_names = {".git", ".venv", "venv", "__pycache__", "node_modules", ".idea", ".vscode"}

        files_to_search: List[Path] = []
        if target_path.is_file():
            files_to_search.append(target_path)
        else:
            try:
                for root, dirs, files in os.walk(target_path):
                    # Filter out ignored directories in-place
                    dirs[:] = [d for d in dirs if d not in ignored_dir_names]
                    for file_name in files:
                        files_to_search.append(Path(root) / file_name)
            except PermissionError as pe:
                return ToolResult({
                    "status": "error",
                    "error": f"Permission denied walking directory: {str(pe)}"
                })

        for file_p in files_to_search:
            if len(matches) >= max_results:
                break
            try:
                # Check binary before reading line by line
                with open(file_p, "rb") as bf:
                    chunk = bf.read(1024)
                    if b"\x00" in chunk:
                        continue

                with open(file_p, "r", encoding="utf-8", errors="replace") as f:
                    for line_num, line in enumerate(f, start=1):
                        if query in line:
                            try:
                                rel_file = str(file_p.relative_to(self.workspace_root))
                            except ValueError:
                                rel_file = str(file_p)

                            matches.append({
                                "file": rel_file,
                                "line": line_num,
                                "content": line.rstrip("\r\n")
                            })
                            if len(matches) >= max_results:
                                break
            except (PermissionError, OSError, UnicodeDecodeError):
                # Gracefully skip unreadable or locked files without crashing
                continue

        return ToolResult({
            "status": "success",
            "data": matches
        })
