"""
Unit Tests for Output Parser.

Owner: Person 1 (Agent Core)
"""

import unittest
from backend.agent.parser import OutputParser


class TestOutputParser(unittest.TestCase):
    """Test suite for LLM output parsing across diverse formats."""

    def test_empty_parse(self):
        """Verify fallback handling for unformatted empty text."""
        result = OutputParser.parse_action("")
        self.assertIn("thought", result)
        self.assertFalse(result["is_final"])
        self.assertIn("error", result)

    def test_parse_json_action(self):
        """Verify parsing raw JSON action format."""
        raw = '{"thought": "Need to list directory", "tool_name": "file_tool", "tool_args": {"operation": "list", "path": "."}}'
        result = OutputParser.parse_action(raw)
        self.assertEqual(result["thought"], "Need to list directory")
        self.assertEqual(result["tool_name"], "file_tool")
        self.assertEqual(result["tool_args"], {"operation": "list", "path": "."})
        self.assertFalse(result["is_final"])

    def test_parse_markdown_fenced_json(self):
        """Verify parsing JSON inside markdown ```json ... ``` code fence."""
        raw = """Here is my plan:
```json
{
  "thought": "Running search query",
  "tool_name": "search_tool",
  "tool_args": {
    "query": "authentication"
  }
}
```
"""
        result = OutputParser.parse_action(raw)
        self.assertEqual(result["thought"], "Running search query")
        self.assertEqual(result["tool_name"], "search_tool")
        self.assertEqual(result["tool_args"], {"query": "authentication"})
        self.assertFalse(result["is_final"])

    def test_parse_json_final_answer(self):
        """Verify parsing JSON final answer format."""
        raw = '{"thought": "All tasks done", "final_answer": "Repository configured successfully."}'
        result = OutputParser.parse_action(raw)
        self.assertTrue(result["is_final"])
        self.assertEqual(result["final_answer"], "Repository configured successfully.")
        self.assertIsNone(result["tool_name"])

    def test_parse_react_format(self):
        """Verify parsing ReAct-style text format."""
        raw = """Thought: Need to calculate memory requirement.
Action: calculator_tool
Action Input: {"expression": "1024 * 1024"}"""
        result = OutputParser.parse_action(raw)
        self.assertEqual(result["thought"], "Need to calculate memory requirement.")
        self.assertEqual(result["tool_name"], "calculator_tool")
        self.assertEqual(result["tool_args"], {"expression": "1024 * 1024"})
        self.assertFalse(result["is_final"])

    def test_parse_react_final_answer(self):
        """Verify parsing ReAct-style Final Answer."""
        raw = """Thought: Finished analysis.
Final Answer: All 4 tests passed."""
        result = OutputParser.parse_action(raw)
        self.assertTrue(result["is_final"])
        self.assertEqual(result["final_answer"], "All 4 tests passed.")

    def test_parse_malformed_json_returns_error(self):
        """Verify that malformed JSON is captured with error rather than crashing."""
        raw = '{"tool_name": "shell_tool", "tool_args": broken json without quotes'
        result = OutputParser.parse_action(raw)
        self.assertFalse(result["is_final"])
        self.assertIn("error", result)


if __name__ == "__main__":
    unittest.main()
