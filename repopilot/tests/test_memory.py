"""
Unit Tests for Agent Memory.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.memory import AgentMemory


class TestAgentMemory(unittest.TestCase):
    """Test suite for AgentMemory buffer and trajectory tracking."""

    def setUp(self):
        self.memory = AgentMemory()

    def test_memory_add_and_clear(self):
        """Verify memory step recording and clearing."""
        self.memory.add_step("PLAN", {"goal": "Explore codebase"})
        self.assertEqual(len(self.memory.trajectory), 1)
        self.memory.clear()
        self.assertEqual(len(self.memory.trajectory), 0)


if __name__ == "__main__":
    unittest.main()
