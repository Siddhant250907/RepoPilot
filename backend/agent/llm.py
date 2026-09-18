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
        model: str = "gemini-3.6-flash",
        model_name: str = "",
        **kwargs: Any,
    ):
        resolved_key = api_key or os.getenv("LLM_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
        if not resolved_key:
            try:
                from backend.config import settings
                resolved_key = getattr(settings, "LLM_API_KEY", "")
            except Exception:
                pass
        self.api_key = resolved_key

        resolved_model = model_name or os.getenv("LLM_MODEL", "") or model
        if not resolved_model or resolved_model == "gemini-2.5-flash":
            resolved_model = "gemini-3.6-flash"
        self.model = resolved_model
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

        model_id = self.model
        if model_id.startswith("models/"):
            model_id = model_id[len("models/"):]

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={self.api_key}"

        contents = [{"parts": [{"text": effective_prompt}]}]
        payload: Dict[str, Any] = {"contents": contents}
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        # Optional generation parameters from kwargs or instance config
        generation_config: Dict[str, Any] = {}
        temperature = kwargs.get("temperature", self.config.get("temperature"))
        if temperature is not None:
            generation_config["temperature"] = float(temperature)

        max_output_tokens = kwargs.get(
            "max_output_tokens",
            kwargs.get("max_tokens", self.config.get("max_output_tokens", self.config.get("max_tokens"))),
        )
        if max_output_tokens is not None:
            generation_config["maxOutputTokens"] = int(max_output_tokens)

        if generation_config:
            payload["generationConfig"] = generation_config

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

                if "error" in result:
                    err_msg = result["error"].get("message", str(result["error"]))
                    raise RuntimeError(f"Gemini API returned error: {err_msg}")

                prompt_feedback = result.get("promptFeedback")
                if prompt_feedback and prompt_feedback.get("blockReason"):
                    raise RuntimeError(f"Gemini API blocked prompt: {prompt_feedback.get('blockReason')}")

                candidates = result.get("candidates", [])
                if candidates:
                    candidate = candidates[0]
                    parts = candidate.get("content", {}).get("parts", [])
                    if parts:
                        return "".join(p.get("text", "") for p in parts if "text" in p).strip()

                    finish_reason = candidate.get("finishReason")
                    if finish_reason and finish_reason not in ("STOP", "MAX_TOKENS"):
                        raise RuntimeError(
                            f"Gemini generation stopped unexpectedly with reason: {finish_reason}"
                        )
                return ""
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"LLM API HTTP error {e.code}: {err_body}") from e
        except urllib.error.URLError as e:
            raise RuntimeError(f"LLM API network error: {e.reason}") from e
        except json.JSONDecodeError as e:
            raise RuntimeError(f"Failed to parse LLM API JSON response: {e}") from e
        except RuntimeError:
            raise
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


if __name__ == "__main__":
    import asyncio

    print("=== RepoPilot LLM Module Self-Test ===")

    # Check LLMInterface configuration
    llm = LLMInterface()
    print(f"Configured model: {llm.model}")
    print(f"API key detected: {'Yes' if llm.api_key else 'No (set LLM_API_KEY or GEMINI_API_KEY in environment or .env)'}")

    # Exercise MockLLMInterface execution
    print("\n--- Testing MockLLMInterface multi-turn execution ---")
    mock = MockLLMInterface(responses=[
        {"type": "tool_call", "tool": "file_tool", "arguments": {"action": "read", "path": "main.py"}},
        {"type": "final", "answer": "Task completed successfully."}
    ])

    async def _demo():
        out1 = await mock.generate(prompt="Analyze codebase")
        print(f"Turn 1 Output: {out1}")
        out2 = await mock.generate(prompt="Provide summary")
        print(f"Turn 2 Output: {out2}")

    asyncio.run(_demo())
    print("\n=== llm.py executed successfully! ===")
