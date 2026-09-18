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
        resolve_safe_path(target_path, base_directory)
        return True
    except Exception:
        return False


def resolve_safe_path(target_path: Union[str, Path], base_directory: Union[str, Path]) -> Path:
    """
    Resolve target_path within base_directory and verify containment.
    Handles relative paths seamlessly:
    - Path relative to base_directory directly (e.g. 'calc.py')
    - Path relative to project root pointing into base_directory (e.g. 'workspace/user_repos/slug/calc.py')
    - Path prefixed with repository directory name (e.g. 'slug/calc.py')
    Raises PermissionError if the target resolves outside base_directory.
    """
    base = Path(base_directory).resolve()
    target = Path(target_path)

    if target.is_absolute():
        resolved_target = target.resolve()
    else:
        # Check direct candidate inside base
        direct = (base / target).resolve()
        if direct.exists():
            resolved_target = direct
        else:
            # Check project-root relative candidate (e.g. workspace/user_repos/...)
            cwd_cand = (Path.cwd() / target).resolve()
            if (cwd_cand == base or base in cwd_cand.parents) and cwd_cand.exists():
                resolved_target = cwd_cand
            elif target.parts and target.parts[0] == base.name:
                stripped = Path(*target.parts[1:]) if len(target.parts) > 1 else Path(".")
                resolved_target = (base / stripped).resolve()
            else:
                resolved_target = direct

    if not (resolved_target == base or base in resolved_target.parents):
        raise PermissionError(f"Access denied: '{target_path}' resolves outside workspace '{base}'")
    return resolved_target
