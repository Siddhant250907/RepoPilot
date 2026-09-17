"""
Unit Tests for Output Parser.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.parser import OutputParser


class TestOutputParser(unittest.TestCase):
    """Test suite for LLM output parsing."""

    def test_empty_parse(self):
        """Verify fallback handling for unformatted text."""
        result = OutputParser.parse_action("")
        self.assertIn("thought", result)
        self.assertIn("is_final", result)


if __name__ == "__main__":
    unittest.main()
