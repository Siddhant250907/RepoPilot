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
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()


class Settings:
    """Centralized configuration settings."""

    # Server settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # LLM settings
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-2.5-flash")

    # Search Tool settings
    SEARCH_API_KEY: str = os.getenv("SEARCH_API_KEY", "")


settings = Settings()
