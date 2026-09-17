"""
LLM Communication Interface.

Owner: Person 1

Responsibilities:
- Provide unified abstraction over raw LLM provider APIs (e.g. Gemini, OpenAI, Anthropic).
- Handle prompt formatting, system instructions, and temperature/token configs.
- Stream responses and manage token usage tracking.
- Note: No agent frameworks (LangChain, CrewAI) allowed; direct API/SDK calls only.

TODO:
- Implement direct API client calls with proper retry and backoff logic.
- Implement structured prompt construction supporting system instructions and tool schemas.
"""

from typing import Dict, Any, List


class LLMInterface:
    """Direct client interface to LLM provider API."""

    def __init__(self, api_key: str = "", model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model

    async def generate(self, prompt: str, system_prompt: str = "", **kwargs) -> str:
        """
        Send prompt to LLM and return raw text response.

        TODO: Implement direct provider API call without 3rd-party agent frameworks.
        """
        raise NotImplementedError("LLM generation pending implementation by Person 1")
