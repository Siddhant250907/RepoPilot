"""
Repository and Workspace Search Tool.

Owner: Person 2 (Tools)

Responsibilities:
- Perform targeted text and pattern searches across files in the workspace.
- Enforce strict workspace containment and path traversal protection.
- Safely skip ignored directories (.git, node_modules, .venv) and binary files.
- Bound resource consumption (file count, match count, query length, file size).
- Return structured search observations for LLM consumption.
"""

import fnmatch
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

from backend.tools.base import BaseTool, ToolResult
from backend.utils.security import resolve_safe_path


class SearchTool(BaseTool):
    """Tool for searching code, documentation, and error patterns in the workspace."""

    name: str = "search_tool"
    description: str = "Search workspace files for text occurrences, function definitions, or error signatures."

    # Directories to omit from recursive scanning to prevent pathological scans
    DEFAULT_IGNORED_DIRS: Set[str] = {
        ".git",
        ".venv",
        "venv",
        "env",
        ".env",
        "__pycache__",
        "node_modules",
        ".idea",
        ".vscode",
        "dist",
        "build",
        ".pytest_cache",
        ".mypy_cache",
        ".tox",
    }

    # Resource safety guardrails
    MAX_QUERY_LENGTH: int = 1000
    MAX_FILE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB per file
    MAX_FILES_SCANNED: int = 5000
    DEFAULT_MAX_RESULTS: int = 100
    HARD_MAX_RESULTS: int = 500

    def __init__(
        self,
        workspace_root: Optional[Union[str, Path]] = None,
        max_results: int = DEFAULT_MAX_RESULTS,
        ignored_dirs: Optional[Set[str]] = None,
    ):
        if workspace_root:
            self.workspace_root = Path(workspace_root).resolve()
        else:
            self.workspace_root = Path.cwd().resolve()

        self.default_max_results = min(max_results, self.HARD_MAX_RESULTS)
        self.ignored_dirs = set(ignored_dirs) if ignored_dirs is not None else set(self.DEFAULT_IGNORED_DIRS)

    @property
    def input_schema(self) -> Dict[str, Any]:
        """Return JSON Schema describing SearchTool parameters."""
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Text, identifier, or keyword to search for across workspace files."
                },
                "path": {
                    "type": "string",
                    "description": "Optional sub-directory or file path within workspace to restrict the search. Defaults to '.' (entire workspace)."
                },
                "file_pattern": {
                    "type": "string",
                    "description": "Optional glob pattern to filter filenames (e.g. '*.py', '*.json', 'test_*')."
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum number of matching lines to return. Defaults to 100 (max 500)."
                }
            },
            "required": ["query"]
        }

    def execute(self, arguments: Optional[Union[Dict[str, Any], str]] = None, **kwargs) -> ToolResult:
        """
        Execute workspace search synchronously or awaitably.
        Supports dictionary argument passing or direct keyword arguments.
        """
        params: Dict[str, Any] = {}
        if isinstance(arguments, dict):
            params.update(arguments)
        elif isinstance(arguments, str):
            params["query"] = arguments
        params.update(kwargs)

        # 1. Validate query
        raw_query = params.get("query")
        if raw_query is None:
            return ToolResult({
                "status": "error",
                "error": "Missing required argument: 'query'"
            })

        if not isinstance(raw_query, str):
            return ToolResult({
                "status": "error",
                "error": f"Invalid query argument type: expected string, got {type(raw_query).__name__}"
            })

        query = raw_query.strip()
        if not query:
            return ToolResult({
                "status": "error",
                "error": "Empty or invalid query: 'query' cannot be blank"
            })

        if len(query) > self.MAX_QUERY_LENGTH:
            return ToolResult({
                "status": "error",
                "error": f"Query exceeds maximum allowable length of {self.MAX_QUERY_LENGTH} characters"
            })

        # 2. Parse and validate search subpath
        raw_path = params.get("path", ".")
        if not isinstance(raw_path, (str, Path)):
            return ToolResult({
                "status": "error",
                "error": f"Invalid path argument type: expected string or Path, got {type(raw_path).__name__}"
            })

        str_path = str(raw_path).strip()
        if not str_path:
            str_path = "."

        try:
            target_path = resolve_safe_path(str_path, self.workspace_root)
        except PermissionError as pe:
            return ToolResult({
                "status": "error",
                "error": f"Path traversal error: {str(pe)}"
            })
        except Exception as exc:
            return ToolResult({
                "status": "error",
                "error": f"Invalid path: {str(exc)}"
            })

        if not target_path.exists():
            return ToolResult({
                "status": "error",
                "error": f"Path not found: '{raw_path}'"
            })

        # 3. Parse optional limits & pattern
        file_pattern = params.get("file_pattern")
        if file_pattern is not None and not isinstance(file_pattern, str):
            return ToolResult({
                "status": "error",
                "error": f"Invalid file_pattern argument type: expected string, got {type(file_pattern).__name__}"
            })

        raw_max = params.get("max_results", self.default_max_results)
        try:
            max_results = int(raw_max)
            if max_results <= 0:
                max_results = self.default_max_results
        except (ValueError, TypeError):
            max_results = self.default_max_results
        max_results = min(max_results, self.HARD_MAX_RESULTS)

        # 4. Collect target files
        files_to_scan: List[Path] = []
        if target_path.is_file():
            files_to_scan.append(target_path)
        else:
            try:
                for root, dirs, files in os.walk(target_path):
                    # Filter out ignored directories in-place
                    dirs[:] = [d for d in dirs if d not in self.ignored_dirs and not d.startswith(".")]

                    for file_name in files:
                        if file_pattern and not fnmatch.fnmatch(file_name, file_pattern):
                            continue
                        files_to_scan.append(Path(root) / file_name)
                        if len(files_to_scan) >= self.MAX_FILES_SCANNED:
                            break
                    if len(files_to_scan) >= self.MAX_FILES_SCANNED:
                        break
            except PermissionError as pe:
                return ToolResult({
                    "status": "error",
                    "error": f"Permission denied scanning directory: {str(pe)}"
                })
            except OSError as oe:
                return ToolResult({
                    "status": "error",
                    "error": f"Filesystem error scanning directory: {str(oe)}"
                })

        # 5. Search for query in candidate files
        matches: List[Dict[str, Any]] = []
        truncated = False

        for file_path in files_to_scan:
            if len(matches) >= max_results:
                truncated = True
                break

            try:
                # Symlink containment check to prevent reading files outside workspace
                try:
                    resolved_file = file_path.resolve()
                    if not (resolved_file == self.workspace_root or self.workspace_root in resolved_file.parents):
                        continue
                except (OSError, ValueError):
                    continue

                # File size check
                if file_path.stat().st_size > self.MAX_FILE_SIZE_BYTES:
                    continue

                # Binary probe
                with open(file_path, "rb") as bf:
                    chunk = bf.read(1024)
                    if b"\x00" in chunk:
                        continue

                # Read lines with UTF-8 replacement for resilient parsing
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    for line_num, line in enumerate(f, start=1):
                        if query in line:
                            try:
                                rel_file = str(file_path.relative_to(self.workspace_root))
                            except ValueError:
                                rel_file = str(file_path)

                            stripped_line = line.rstrip("\r\n")
                            matches.append({
                                "file": rel_file,
                                "line": line_num,
                                "content": stripped_line,
                                "text": stripped_line,
                            })

                            if len(matches) >= max_results:
                                truncated = True
                                break
            except (PermissionError, OSError, UnicodeDecodeError):
                continue

        return ToolResult({
            "status": "success",
            "data": {
                "query": query,
                "matches": matches,
                "count": len(matches),
                "truncated": truncated
            }
        })
