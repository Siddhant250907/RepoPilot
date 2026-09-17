"""
Output Parser for Structured LLM Responses.

Owner: Person 1 (Agent Core)

Responsibilities:
- Parse structured JSON outputs from LLM responses into tool calls or final answers.
- Safely handle invalid JSON, missing fields, unknown types, and malformed data.
- Return structured error dictionaries rather than raising exceptions.
"""

import json
from typing import Dict, Any


def _error(message: str) -> Dict[str, Any]:
    """Helper to construct a structured error response."""
    return {
        "type": "error",
        "error": message,
        "thought": "",
        "tool_name": None,
        "tool_args": {},
        "is_final": False,
        "final_answer": "",
    }


def _strip_markdown_code_fences(text: str) -> str:
    """Strip markdown ```json ... ``` code blocks if present."""
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


class OutputParser:
    """Parses raw LLM text into structured tool calls or final answers."""

    @staticmethod
    def parse(raw_text: str) -> Dict[str, Any]:
        """
        Parse raw LLM output text into a structured response.

        Expected formats:
        1. Tool call:
           {
               "type": "tool_call",
               "tool": "file_reader",
               "arguments": {"path": "app.py"}
           }

        2. Final answer:
           {
               "type": "final",
               "answer": "The bug was fixed."
           }

        Returns a structured error dict on malformed or unexpected responses.
        """
        if not raw_text or not raw_text.strip():
            return _error("Empty response from LLM")

        cleaned = _strip_markdown_code_fences(raw_text)

        # Attempt to parse JSON (with fallback to extract JSON between { and })
        try:
            data = json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                try:
                    data = json.loads(cleaned[start : end + 1])
                except (json.JSONDecodeError, ValueError) as err:
                    return _error(f"Invalid JSON format: {err}")
            else:
                return _error("Invalid JSON: no valid JSON object found in response")

        if not isinstance(data, dict):
            return _error("Response must be a JSON object")

        # Validate response type
        if "type" not in data or not data["type"]:
            return _error("Missing 'type' field in response")

        response_type = data["type"]

        if response_type == "tool_call":
            # Validate tool name
            tool_name = data.get("tool")
            if not tool_name or not isinstance(tool_name, str) or not tool_name.strip():
                return _error("Malformed tool call: missing or invalid 'tool' name string")

            # Validate arguments
            arguments = data.get("arguments", {})
            if not isinstance(arguments, dict):
                return _error("Malformed tool call: 'arguments' must be a dictionary")

            return {
                "type": "tool_call",
                "tool": tool_name.strip(),
                "arguments": arguments,
                "thought": data.get("thought", ""),
                "tool_name": tool_name.strip(),
                "tool_args": arguments,
                "is_final": False,
                "final_answer": "",
            }

        elif response_type == "final":
            # Validate answer field
            if "answer" not in data:
                return _error("Malformed final response: missing 'answer' field")

            answer = str(data["answer"])
            return {
                "type": "final",
                "answer": answer,
                "thought": data.get("thought", ""),
                "tool_name": None,
                "tool_args": {},
                "is_final": True,
                "final_answer": answer,
            }

        else:
            return _error(
                f"Unknown response type: '{response_type}'. Expected 'tool_call' or 'final'."
            )

    @classmethod
    def parse_action(cls, raw_text: str) -> Dict[str, Any]:
        """Alias for parse() to maintain backwards compatibility."""
        return cls.parse(raw_text)


# Module-level alias & convenience function
Parser = OutputParser
parse = OutputParser.parse
