"""
Unit Tests for Agent Memory.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.memory import AgentMemory


class TestAgentMemory(unittest.TestCase):
    """Test suite for AgentMemory buffer, trajectory tracking, formatting, and bounds."""

    def setUp(self):
        self.memory = AgentMemory(max_trajectory_steps=10)

    def test_memory_add_and_clear(self):
        """Verify memory step recording and clearing."""
        self.memory.add_step("PLAN", {"goal": "Explore codebase"})
        self.assertEqual(len(self.memory.trajectory), 1)
        self.memory.clear()
        self.assertEqual(len(self.memory.trajectory), 0)

    def test_get_history_prompt_empty(self):
        """Verify get_history_prompt returns friendly message when empty."""
        prompt = self.memory.get_history_prompt()
        self.assertEqual(prompt, "No previous steps.")

    def test_get_history_prompt_formatting(self):
        """Verify all step types are formatted clearly into prompt context."""
        self.memory.add_step("PLAN", ["Goal 1", "Goal 2"])
        self.memory.add_step("ACTION", {
            "thought": "Let's read file",
            "tool_name": "file_tool",
            "tool_args": {"operation": "read", "path": "main.py"}
        })
        self.memory.add_step("OBSERVATION", {
            "status": "success",
            "content": "print('hello')"
        })
        self.memory.add_step("REFLECTION", "File read successfully, moving to next step.")
        self.memory.add_step("REPLAN", ["New goal 1", "New goal 2"])

        prompt = self.memory.get_history_prompt()
        self.assertIn("Step 1 [PLAN]:", prompt)
        self.assertIn("Goal 1", prompt)
        self.assertIn("Step 2 [THOUGHT]: Let's read file", prompt)
        self.assertIn("Step 2 [ACTION]: file_tool", prompt)
        self.assertIn("Step 3 [OBSERVATION]:", prompt)
        self.assertIn("print('hello')", prompt)
        self.assertIn("Step 4 [REFLECTION]: File read successfully", prompt)
        self.assertIn("Step 5 [REVISED PLAN]:", prompt)

    def test_max_trajectory_steps_bound(self):
        """Verify memory bounds trajectory to avoid unbound growth while preserving initial plan."""
        self.memory.add_step("PLAN", "Initial root plan")
        for i in range(20):
            self.memory.add_step("ACTION", f"Action {i}")

        self.assertLessEqual(len(self.memory.trajectory), 10)
        self.assertEqual(self.memory.trajectory[0]["content"], "Initial root plan")


if __name__ == "__main__":
    unittest.main()
