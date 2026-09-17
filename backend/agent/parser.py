"""
Output Parser for LLM Responses.

Owner: Person 1 (Agent Core)

Responsibilities:
- Parse structured outputs (Thought, Action, Tool Arguments, Final Answer) from LLM responses.
- Robustly handle markdown codeblocks, raw JSON objects, and ReAct-style text blocks.
- Provide graceful degradation without crashing when the LLM produces malformed responses.
- Return structured error dictionaries rather than raising unhandled exceptions.
"""

import json
import re
from typing import Any, Dict, Optional


def _error(message: str) -> Dict[str, Any]:
    """Helper to construct a structured error response."""
    return {
        "type": "error",
        "error": message,
        "thought": "",
        "tool": None,
        "arguments": {},
        "tool_name": None,
        "tool_args": {},
        "is_final": False,
        "final_answer": "",
        "answer": "",
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
    """Parses raw LLM text into structured tool calls, final answers, or error observations."""

    @classmethod
    def parse(cls, raw_text: str) -> Dict[str, Any]:
        """
        Parse raw LLM output text into a structured response.
        Supports:
        1. JSON dictionaries (with "type": "tool_call"/"final", or "tool_name"/"final_answer")
        2. Markdown-fenced JSON blocks (```json ... ```)
        3. ReAct format (Thought: ... Action: ... Action Input: ... / Final Answer: ...)
        4. Graceful error dictionaries for malformed responses.
        """
        if not raw_text or not isinstance(raw_text, str) or not raw_text.strip():
            return _error("Empty response from LLM")

        cleaned = _strip_markdown_code_fences(raw_text)

        # 1. Attempt JSON parsing
        parsed_json = cls._extract_json(cleaned)
        if parsed_json is None:
            parsed_json = cls._extract_json(raw_text)

        if parsed_json is not None and isinstance(parsed_json, dict):
            thought = str(parsed_json.get("thought", "")).strip()

            # Check explicit "type" field if present
            response_type = parsed_json.get("type")

            if response_type == "tool_call":
                tool_name = parsed_json.get("tool") or parsed_json.get("tool_name") or parsed_json.get("action")
                if not tool_name or not isinstance(tool_name, str) or not tool_name.strip():
                    return _error("Malformed tool call: missing or invalid 'tool' name string")

                arguments = (
                    parsed_json.get("arguments")
                    if "arguments" in parsed_json
                    else parsed_json.get("tool_args")
                    if "tool_args" in parsed_json
                    else parsed_json.get("action_input", {})
                )
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except Exception:
                        arguments = {"input": arguments}
                if not isinstance(arguments, dict):
                    return _error("Malformed tool call: 'arguments' must be a dictionary")

                tool_name_str = tool_name.strip()
                return {
                    "type": "tool_call",
                    "tool": tool_name_str,
                    "arguments": arguments,
                    "thought": thought,
                    "tool_name": tool_name_str,
                    "tool_args": arguments,
                    "is_final": False,
                    "final_answer": "",
                    "answer": "",
                }

            elif response_type == "final":
                if "answer" not in parsed_json and "final_answer" not in parsed_json:
                    return _error("Malformed final response: missing 'answer' field")

                answer_str = str(parsed_json.get("answer") or parsed_json.get("final_answer", ""))
                return {
                    "type": "final",
                    "answer": answer_str,
                    "thought": thought,
                    "tool": None,
                    "arguments": {},
                    "tool_name": None,
                    "tool_args": {},
                    "is_final": True,
                    "final_answer": answer_str,
                }

            elif response_type and response_type not in ("tool_call", "final"):
                return _error(
                    f"Unknown response type: '{response_type}'. Expected 'tool_call' or 'final'."
                )

            # JSON without explicit "type" field
            # Check for final answer in JSON
            if "final_answer" in parsed_json and parsed_json["final_answer"]:
                ans = str(parsed_json["final_answer"]).strip()
                return {
                    "type": "final",
                    "answer": ans,
                    "thought": thought,
                    "tool": None,
                    "arguments": {},
                    "tool_name": None,
                    "tool_args": {},
                    "is_final": True,
                    "final_answer": ans,
                }

            if "answer" in parsed_json and parsed_json["answer"]:
                ans = str(parsed_json["answer"]).strip()
                return {
                    "type": "final",
                    "answer": ans,
                    "thought": thought,
                    "tool": None,
                    "arguments": {},
                    "tool_name": None,
                    "tool_args": {},
                    "is_final": True,
                    "final_answer": ans,
                }

            # Check for tool action in JSON
            tool_name = (
                parsed_json.get("tool_name")
                or parsed_json.get("action")
                or parsed_json.get("tool")
            )
            if tool_name and isinstance(tool_name, str):
                tool_name_str = tool_name.strip()
                tool_args = (
                    parsed_json.get("tool_args")
                    if "tool_args" in parsed_json
                    else parsed_json.get("arguments")
                    if "arguments" in parsed_json
                    else parsed_json.get("action_input")
                    if "action_input" in parsed_json
                    else parsed_json.get("parameters")
                    if "parameters" in parsed_json
                    else parsed_json.get("args")
                    if "args" in parsed_json
                    else {}
                )

                if isinstance(tool_args, str):
                    try:
                        tool_args = json.loads(tool_args)
                    except json.JSONDecodeError:
                        pass

                if not isinstance(tool_args, dict):
                    tool_args = {"input": tool_args}

                return {
                    "type": "tool_call",
                    "tool": tool_name_str,
                    "arguments": tool_args,
                    "thought": thought,
                    "tool_name": tool_name_str,
                    "tool_args": tool_args,
                    "is_final": False,
                    "final_answer": "",
                    "answer": "",
                }

        # 2. Attempt ReAct-style text parsing:
        thought_match = re.search(
            r"(?:Thought:)\s*(.*?)(?=(?:Action:|Final Answer:|$))",
            raw_text,
            re.DOTALL | re.IGNORECASE,
        )
        thought = thought_match.group(1).strip() if thought_match else ""

        final_match = re.search(r"(?:Final Answer:)\s*(.*)", raw_text, re.DOTALL | re.IGNORECASE)
        if final_match:
            ans = final_match.group(1).strip()
            return {
                "type": "final",
                "answer": ans,
                "thought": thought,
                "tool": None,
                "arguments": {},
                "tool_name": None,
                "tool_args": {},
                "is_final": True,
                "final_answer": ans,
            }

        action_match = re.search(r"(?:Action:)\s*([a-zA-Z0-9_\-\.]+)", raw_text, re.IGNORECASE)
        if action_match:
            tool_name = action_match.group(1).strip()
            args_match = re.search(r"(?:Action Input:)\s*(.*)", raw_text, re.DOTALL | re.IGNORECASE)
            tool_args = {}
            if args_match:
                raw_args_str = args_match.group(1).strip()
                extracted = cls._extract_json(raw_args_str)
                if isinstance(extracted, dict):
                    tool_args = extracted
                elif raw_args_str:
                    tool_args = {"query": raw_args_str}

            return {
                "type": "tool_call",
                "tool": tool_name,
                "arguments": tool_args,
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": tool_args,
                "is_final": False,
                "final_answer": "",
                "answer": "",
            }

        # 3. Fallback: check if text looks like an attempted/malformed JSON or tool call
        text_strip = raw_text.strip()
        if (
            text_strip.startswith("{")
            or text_strip.endswith("}")
            or "{" in text_strip
            or "tool_name" in text_strip
            or "action" in text_strip
            or '"tool"' in text_strip
        ):
            return _error(f"Malformed or invalid JSON action: {text_strip[:100]}")

        # 4. Otherwise treat plain non-empty narrative text as final answer
        return {
            "type": "final",
            "answer": text_strip,
            "thought": text_strip,
            "tool": None,
            "arguments": {},
            "tool_name": None,
            "tool_args": {},
            "is_final": True,
            "final_answer": text_strip,
        }

    @classmethod
    def parse_action(cls, raw_text: str) -> Dict[str, Any]:
        """Alias for parse() to maintain backwards compatibility."""
        return cls.parse(raw_text)

    @staticmethod
    def _extract_json(text: str) -> Optional[Any]:
        """Attempt to extract and parse JSON from code fences or raw string."""
        if not text or not isinstance(text, str):
            return None

        # Check for ```json ... ``` or ``` ... ```
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass

        # Try raw json.loads on stripped text
        stripped = text.strip()
        try:
            return json.loads(stripped)
        except (json.JSONDecodeError, ValueError):
            pass

        # Find outer braces { ... }
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(stripped[start : end + 1])
            except (json.JSONDecodeError, ValueError):
                pass

        return None


# Module-level aliases & convenience functions
Parser = OutputParser
parse = OutputParser.parse
parse_action = OutputParser.parse_action
