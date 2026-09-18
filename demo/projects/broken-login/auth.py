"""
Authentication and Authorization Module for Broken Login Demo.

Simulates user authentication, session management, and RBAC permissions.
"""

from typing import Dict, Any, Optional

# Simulated user database
USER_DATABASE: Dict[str, Dict[str, Any]] = {
    "admin": {
        "password_hash": "hash_secret_admin",
        "role": "admin",
        "status": "active",  # Notice: lowercase 'active'
    },
    "developer": {
        "password_hash": "hash_secret_dev",
        "role": "developer",
        "status": "active",
    },
    "guest": {
        "password_hash": "hash_secret_guest",
        "role": "guest",
        "status": "suspended",
    },
}


def hash_password(password: str) -> str:
    """Mock hash function for demo purposes."""
    return f"hash_{password}"


def login(username: str, password: str) -> Dict[str, Any]:
    """
    Authenticate a user by username and password.
    Returns user session object on success.
    
    BUG: Case-sensitive status comparison bug after the latest merge.
    Compares user['status'] with uppercase 'ACTIVE', causing 403 Forbidden
    even for valid users because database records use lowercase 'active'.
    """
    user = USER_DATABASE.get(username)
    if not user:
        raise ValueError("401 Unauthorized: User not found")

    if user["password_hash"] != hash_password(password):
        raise ValueError("401 Unauthorized: Invalid credentials")

    # BUG: Case mismatch: user["status"] is 'active', but compared against uppercase 'ACTIVE'
    if user["status"] != "active":
        raise PermissionError("403 Forbidden: Account inactive or pending verification")



    return {
        "status": "authenticated",
        "username": username,
        "role": user["role"],
    }


def check_admin_access(session: Dict[str, Any]) -> bool:
    """Verify if the current authenticated session has admin privileges."""
    if session.get("status") != "authenticated":
        return False
    return session.get("role") == "admin"
