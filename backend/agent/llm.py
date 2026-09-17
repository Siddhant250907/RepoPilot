"""
LLM Interface and Provider Abstraction for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Provide a provider-agnostic abstraction for language model calls.
- Decouple the agent reasoning loop from specific LLM providers.
- Expose a unified generate() method accepting prompt, task, history, and tools.
- Maintain a deterministic MockLLMInterface for unit and integration testing.
- Note: No external agent frameworks (LangChain, CrewAI); direct REST API/SDK calls only.
"""

import inspect
import json
import os
import urllib.error
import urllib.request
from abc import ABC, abstractmethod
from typing import Any, Callable, Dict, List, Optional, Union


class BaseLLM(ABC):
    """Abstract base class defining the contract for all LLM providers."""

    @abstractmethod
    async def generate(
        self,
        task: str = "",
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate an LLM completion for the given task, history, and available tools.
        """
        pass


class LLMInterface(BaseLLM):
    """
    Direct client interface to LLM provider API (e.g. Gemini REST API).
    Does not use 3rd-party agent frameworks.
    """

    def __init__(
        self,
        api_key: str = "",
        model: str = "gemini-2.5-flash",
        model_name: str = "",
        **kwargs: Any,
    ):
        self.api_key = api_key or os.getenv("LLM_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        self.model = model_name or model or os.getenv("LLM_MODEL", "gemini-2.5-flash")
        self.model_name = self.model
        self.config = kwargs

    async def generate(
        self,
        prompt: str = "",
        system_prompt: str = "",
        task: str = "",
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """
        Send prompt and system prompt to LLM and return raw text response.
        Uses direct HTTP API call via urllib to avoid external agent framework dependencies.
        """
        if not self.api_key:
            raise ValueError(
                "LLM API key not configured. Provide api_key or use MockLLM / MockLLMInterface for tests."
            )

        effective_prompt = prompt or task
        if not effective_prompt:
            return ""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        contents = [{"parts": [{"text": effective_prompt}]}]
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
            method="POST",
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
    Supports queued responses, dynamic response functions, and canned fallback responses.
    """

    def __init__(
        self,
        responses: Optional[List[Union[str, Dict[str, Any]]]] = None,
        response_fn: Optional[Callable[..., Union[str, Dict[str, Any]]]] = None,
        canned_response: str = '{"type": "final", "answer": "Task completed successfully."}',
        model_name: str = "mock",
        **kwargs: Any,
    ):
        super().__init__(api_key="mock-key", model="mock-model", model_name=model_name, **kwargs)
        self.responses: List[Union[str, Dict[str, Any]]] = list(responses) if responses else []
        self.response_fn = response_fn
        self.canned_response = canned_response
        self.call_history: List[Dict[str, Any]] = []
        self.last_call: Dict[str, Any] = {}

    async def generate(
        self,
        prompt: str = "",
        system_prompt: str = "",
        task: str = "",
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """Record prompt/call parameters and return next queued or computed response."""
        call_record = {
            "prompt": prompt,
            "system_prompt": system_prompt,
            "task": task,
            "history": history or [],
            "tools": tools or [],
            "kwargs": kwargs,
        }
        self.call_history.append(call_record)
        self.last_call = call_record

        if self.response_fn:
            sig = inspect.signature(self.response_fn)
            params = list(sig.parameters.keys())
            if len(params) == 1:
                res = self.response_fn(prompt or task)
            elif len(params) >= 2 and ("system_prompt" in params or params[1] != "history"):
                res = self.response_fn(prompt, system_prompt)
            else:
                try:
                    res = self.response_fn(prompt, system_prompt)
                except TypeError:
                    res = self.response_fn(task=task, history=history, tools=tools)
        elif self.responses:
            res = self.responses.pop(0)
        else:
            res = self.canned_response

        if isinstance(res, dict):
            return json.dumps(res)
        return str(res)


# Aliases for provider and testing compatibility
MockLLM = MockLLMInterface
