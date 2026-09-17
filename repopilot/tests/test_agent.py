"""
Unit Tests for Agent Core.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.agent import AgentCore
from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry


class TestAgentCore(unittest.TestCase):
    """Test suite for AgentCore initialization and basic state management."""

    def setUp(self):
        self.agent = AgentCore(
            memory=AgentMemory(),
            planner=Planner(),
            registry=ToolRegistry(),
        )

    def test_agent_initialization(self):
        """Verify AgentCore initializes with dependencies."""
        self.assertIsNotNone(self.agent.memory)
        self.assertIsNotNone(self.agent.planner)
        self.assertIsNotNone(self.agent.registry)


if __name__ == "__main__":
    unittest.main()
