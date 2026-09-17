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

import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Union, Callable


class LLMInterface:
    """
    Direct client interface to LLM provider API.
    Does not use 3rd-party agent frameworks (LangChain, CrewAI, AutoGen).
    Supports Gemini REST API when api_key is provided, with fallback/mock capability.
    """

    def __init__(self, api_key: str = "", model: str = "gemini-2.5-flash"):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.model = model or os.getenv("LLM_MODEL", "gemini-2.5-flash")

    async def generate(self, prompt: str, system_prompt: str = "", **kwargs) -> str:
        """
        Send prompt and system prompt to LLM and return raw text response.
        Uses direct HTTP API call via urllib to avoid external agent framework dependencies.
        """
        if not self.api_key:
            raise ValueError(
                "LLM API key not configured. Provide api_key or use MockLLMInterface for tests."
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        contents = []
        if prompt:
            contents.append({"parts": [{"text": prompt}]})

        payload: Dict[str, Any] = {"contents": contents}
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return ""
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LLM API HTTP error {e.code}: {err_body}") from e
        except Exception as e:
            raise RuntimeError(f"LLM API communication failed: {e}") from e


class MockLLMInterface(LLMInterface):
    """
    Deterministic LLM Interface for unit and integration testing.
    Allows queueing scripted responses or providing a dynamic response function.
    """

    def __init__(
        self,
        responses: Optional[List[Union[str, Dict[str, Any]]]] = None,
        response_fn: Optional[Callable[[str, str], Union[str, Dict[str, Any]]]] = None,
    ):
        super().__init__(api_key="mock-key", model="mock-model")
        self.responses: List[Union[str, Dict[str, Any]]] = list(responses) if responses else []
        self.response_fn = response_fn
        self.call_history: List[Dict[str, Any]] = []

    async def generate(self, prompt: str, system_prompt: str = "", **kwargs) -> str:
        """Record prompt and return next queued or computed response."""
        self.call_history.append({
            "prompt": prompt,
            "system_prompt": system_prompt,
            "kwargs": kwargs
        })

        if self.response_fn:
            res = self.response_fn(prompt, system_prompt)
        elif self.responses:
            res = self.responses.pop(0)
        else:
            # Default fallback final answer if queue empty
            res = json.dumps({
                "thought": "No further actions required.",
                "final_answer": "Task completed successfully."
            })

        if isinstance(res, dict):
            return json.dumps(res)
        return str(res)

