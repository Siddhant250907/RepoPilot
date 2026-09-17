"""
Security and Sandboxing Utilities.

Owner: Person 2 (Tools)

Responsibilities:
- Validate that file paths do not escape target workspace directories (directory traversal prevention).
- Sanitize shell commands against disallowed shell operations.
"""

from pathlib import Path
from typing import Union


def is_safe_path(target_path: Union[str, Path], base_directory: Union[str, Path]) -> bool:
    """
    Verify target_path resolves strictly within base_directory.
    Anchors relative paths to base_directory, resolves symlinks,
    and checks that the resolved target is contained within the base directory.
    """
    try:
        base = Path(base_directory).resolve()
        target = Path(target_path)
        if not target.is_absolute():
            target = base / target
        resolved_target = target.resolve()

        return resolved_target == base or base in resolved_target.parents
    except Exception:
        return False


def resolve_safe_path(target_path: Union[str, Path], base_directory: Union[str, Path]) -> Path:
    """
    Resolve target_path within base_directory and verify containment.
    Raises PermissionError if the target resolves outside base_directory.
    """
    base = Path(base_directory).resolve()
    target = Path(target_path)
    if not target.is_absolute():
        target = base / target
    resolved_target = target.resolve()

    if not (resolved_target == base or base in resolved_target.parents):
        raise PermissionError(f"Access denied: '{target_path}' resolves outside workspace '{base}'")
    return resolved_target
