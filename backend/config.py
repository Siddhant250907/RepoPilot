"""
Application Configuration and Environment Settings.

Responsibilities:
- Load and validate environment variables using Pydantic / python-dotenv.
- Provide centralized access to API keys, model parameters, and runtime settings.

TODO:
- Define typed configuration fields for LLM provider parameters.
- Add validation for optional tool API keys (e.g. Search API).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Ensure local virtual environment binaries are in PATH for subprocess tools
for candidate in [
    Path(sys.prefix) / ("Scripts" if os.name == "nt" else "bin"),
    Path(__file__).resolve().parent.parent / ".venv" / ("Scripts" if os.name == "nt" else "bin"),
]:
    if candidate.exists() and str(candidate) not in os.environ.get("PATH", ""):
        os.environ["PATH"] = str(candidate) + os.pathsep + os.environ.get("PATH", "")


class Settings:
    """Centralized configuration settings."""

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # LLM settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-3.5-flash")

    # Search Tool settings
    SEARCH_API_KEY: str = os.getenv("SEARCH_API_KEY", "")


settings = Settings()

