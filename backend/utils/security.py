"""
Security and Sandboxing Utilities.

Owner: Person 2 (Tools)

Responsibilities:
- Validate that file paths do not escape target workspace directories (directory traversal prevention).
- Sanitize shell commands against disallowed shell operations.
"""

import os
from pathlib import Path


def is_safe_path(target_path: str, base_directory: str) -> bool:
    """
    Verify target_path resolves strictly within base_directory.

    TODO: Person 2 will implement strict path containment validation.
    """
    try:
        resolved_base = Path(base_directory).resolve()
        resolved_target = Path(target_path).resolve()
        return resolved_base in resolved_target.parents or resolved_base == resolved_target
    except Exception:
        return False
