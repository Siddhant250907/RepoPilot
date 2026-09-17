"""
Agent Memory and Trajectory Management.

Owner: Person 1

Responsibilities:
- Maintain short-term working memory: conversation history, tool inputs/outputs, reflections.
- Track step-by-step execution trajectory for auditing and visualization.
- Provide token-aware context window truncation / summarization.

TODO:
- Implement sliding window or summarizer for long execution traces.
- Provide exportable trajectory data structure for frontend visualization.
"""

from typing import List, Dict, Any


class AgentMemory:
    """Short-term and trajectory memory for the autonomous agent."""

    def __init__(self):
        self.trajectory: List[Dict[str, Any]] = []

    def add_step(self, step_type: str, content: Any):
        """
        Append a step (plan, action, observation, reflection) to memory.

        TODO: Implement structured storage and serialization.
        """
        self.trajectory.append({"type": step_type, "content": content})

    def get_context(self) -> List[Dict[str, Any]]:
        """
        Retrieve formatted trajectory for LLM context.

        TODO: Implement context formatting with token limit guards.
        """
        return self.trajectory

    def clear(self):
        """Reset memory buffer."""
        self.trajectory.clear()
