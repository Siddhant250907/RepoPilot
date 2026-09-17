"""
Agent Memory for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Maintain short-term working memory and conversation history for the agent.
- Store interaction steps (user task, agent actions, tool results, tool errors, reflections).
- Return stored history for prompt construction and trajectory inspection.
- Pure in-memory representation: no databases, embeddings, or vector stores.
"""

from typing import List, Dict, Any


class Memory:
    """
    A simple in-memory history tracker for the autonomous agent.

    Stores sequential interaction records using role and content dictionaries.
    """

    def __init__(self):
        # 1. Start with an empty history
        self.history: List[Dict[str, Any]] = []

    def add_message(self, role: str, content: Any) -> None:
        """
        Add a message to history using role and content.

        Supported roles include:
        - 'user' / 'task': User task or goal description
        - 'action': Agent's planned action or tool invocation
        - 'tool_result': Successful output from tool execution
        - 'tool_error': Execution failure or error message from a tool
        - 'reflection': Agent self-assessment and next-step reasoning
        """
        self.history.append({"role": role, "content": content})

    def add(self, role: str, content: Any) -> None:
        """Convenience alias for add_message."""
        self.add_message(role=role, content=content)

    def get_history(self) -> List[Dict[str, Any]]:
        """Return the stored history."""
        return list(self.history)

    def get_messages(self) -> List[Dict[str, Any]]:
        """Return the stored history as messages."""
        return self.get_history()

    def get_context(self) -> List[Dict[str, Any]]:
        """Return formatted trajectory for LLM context."""
        return self.get_history()

    def clear(self) -> None:
        """Reset and empty the memory history."""
        self.history.clear()

    # Backwards compatibility methods for existing code and test suites
    def add_step(self, step_type: str, content: Any) -> None:
        """Record an execution step into history."""
        self.history.append({"role": step_type, "type": step_type, "content": content})

    @property
    def trajectory(self) -> List[Dict[str, Any]]:
        """Expose history for backwards compatibility."""
        return self.history

    def __len__(self) -> int:
        return len(self.history)


# Alias to maintain compatibility with existing AgentCore imports
AgentMemory = Memory
