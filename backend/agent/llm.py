"""
LLM Interface and Provider Abstraction for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Provide a provider-agnostic abstraction for language model calls.
- Decouple the agent reasoning loop from specific LLM providers (Gemini, OpenAI, Anthropic, etc.).
- Expose a unified generate() method accepting task, history, and tools.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLM(ABC):
    """Abstract base class defining the contract for all LLM providers."""

    @abstractmethod
    async def generate(
        self,
        task: str,
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate an LLM completion for the given task, history, and available tools.

        Args:
            task: The current user task or goal.
            history: Conversation / trajectory history (list of role/content dicts).
            tools: Available tool schemas or tool instances.
            **kwargs: Optional model parameters (temperature, max_tokens, etc.).

        Returns:
            The raw text response from the model.
        """
        pass


class LLMInterface(BaseLLM):
    """
    Unified LLM interface used by RepoPilot's AgentCore.

    Concrete provider adapters (e.g. GeminiProvider, OpenAIProvider, MockLLM)
    subclass this or implement BaseLLM to connect external models.
    """

    def __init__(self, model_name: str = "default", **kwargs: Any):
        self.model_name = model_name
        self.config = kwargs

    async def generate(
        self,
        task: str = "",
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        """
        Generate a response using the configured provider.

        Subclasses override this method to integrate with concrete provider APIs.
        """
        raise NotImplementedError(
            "No LLM provider is currently connected. "
            "Connect an external provider (Gemini, OpenAI, Anthropic) or use MockLLM for testing."
        )


class MockLLM(LLMInterface):
    """
    A lightweight mock LLM for testing the agent loop offline
    without making real API calls.
    """

    def __init__(
        self,
        canned_response: str = '{"type": "final", "answer": "Task completed successfully."}',
        model_name: str = "mock",
    ):
        super().__init__(model_name=model_name)
        self.canned_response = canned_response
        self.last_call: Dict[str, Any] = {}

    async def generate(
        self,
        task: str = "",
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
        **kwargs: Any,
    ) -> str:
        self.last_call = {
            "task": task,
            "history": history or [],
            "tools": tools or [],
            "kwargs": kwargs,
        }
        return self.canned_response
