"""
Authentication and security test suite.
"""

import sys
from pathlib import Path
import pytest

login_dir = Path(__file__).resolve().parent.parent / "demo" / "projects" / "broken-login"
if str(login_dir) not in sys.path:
    sys.path.insert(0, str(login_dir))

from auth import login


def test_login_valid_credentials():
    """Valid developer user should be able to log in successfully."""
    # Fails with 403 Forbidden because 'active' != 'ACTIVE'
    session = login("developer", "secret_dev")
    assert session["status"] == "authenticated"
    assert session["username"] == "developer"
    assert session["role"] == "developer"


def test_login_invalid_password():
    """Invalid password should raise 401 Unauthorized."""
    with pytest.raises(ValueError, match="401"):
        login("developer", "wrong_password")


def test_login_unknown_user():
    """Non-existent user should raise 401 Unauthorized."""
    with pytest.raises(ValueError, match="401"):
        login("non_existent_user", "some_password")

