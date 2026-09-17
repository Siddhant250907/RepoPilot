"""
Output Parser for LLM Responses.

Owner: Person 1 (Agent Core)

Responsibilities:
- Parse structured outputs (Thought, Action, Tool Arguments, Final Answer) from LLM responses.
- Robustly handle markdown codeblocks, raw JSON objects, and ReAct-style text blocks.
- Provide graceful degradation without crashing when the LLM produces malformed responses.
"""

import json
import re
from typing import Any, Dict, Optional


class OutputParser:
    """Parses raw LLM text into structured thoughts and tool invocations."""

    @staticmethod
    def parse_action(raw_text: str) -> Dict[str, Any]:
        """
        Extract thought, tool name, tool arguments, and final answer from LLM output.
        Supports:
        1. JSON dictionaries (raw or enclosed in markdown code fences)
        2. ReAct format (Thought: ... Action: ... Action Input: ...)
        3. Final Answer patterns
        """
        if not raw_text or not isinstance(raw_text, str) or not raw_text.strip():
            return {
                "thought": "",
                "tool_name": None,
                "tool_args": {},
                "is_final": False,
                "final_answer": "",
                "error": "Empty or missing LLM response"
            }

        text = raw_text.strip()

        # 1. Attempt JSON parsing (look for ```json ... ``` code fence first, then raw JSON)
        parsed_json = OutputParser._extract_json(text)
        if parsed_json and isinstance(parsed_json, dict):
            thought = str(parsed_json.get("thought", "")).strip()

            # Final answer in JSON
            if "final_answer" in parsed_json and parsed_json["final_answer"]:
                return {
                    "thought": thought,
                    "tool_name": None,
                    "tool_args": {},
                    "is_final": True,
                    "final_answer": str(parsed_json["final_answer"]).strip(),
                }

            # Tool action in JSON
            tool_name = (
                parsed_json.get("tool_name")
                or parsed_json.get("action")
                or parsed_json.get("tool")
            )
            if tool_name and isinstance(tool_name, str):
                tool_name = tool_name.strip()
                tool_args = (
                    parsed_json.get("tool_args")
                    or parsed_json.get("action_input")
                    or parsed_json.get("parameters")
                    or parsed_json.get("args")
                    or parsed_json.get("arguments")
                    or {}
                )

                if isinstance(tool_args, str):
                    try:
                        tool_args = json.loads(tool_args)
                    except json.JSONDecodeError:
                        pass

                if not isinstance(tool_args, dict):
                    tool_args = {"input": tool_args}

                return {
                    "thought": thought,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "is_final": False,
                    "final_answer": "",
                }

        # 2. Attempt ReAct-style text parsing:
        # Thought: ...
        # Action: tool_name
        # Action Input: {...}
        thought_match = re.search(r"(?:Thought:)\s*(.*?)(?=(?:Action:|Final Answer:|$))", text, re.DOTALL | re.IGNORECASE)
        thought = thought_match.group(1).strip() if thought_match else ""

        final_match = re.search(r"(?:Final Answer:)\s*(.*)", text, re.DOTALL | re.IGNORECASE)
        if final_match:
            return {
                "thought": thought,
                "tool_name": None,
                "tool_args": {},
                "is_final": True,
                "final_answer": final_match.group(1).strip(),
            }

        action_match = re.search(r"(?:Action:)\s*([a-zA-Z0-9_\-\.]+)", text, re.IGNORECASE)
        if action_match:
            tool_name = action_match.group(1).strip()
            args_match = re.search(r"(?:Action Input:)\s*(.*)", text, re.DOTALL | re.IGNORECASE)
            tool_args = {}
            if args_match:
                raw_args_str = args_match.group(1).strip()
                extracted = OutputParser._extract_json(raw_args_str)
                if isinstance(extracted, dict):
                    tool_args = extracted
                elif raw_args_str:
                    tool_args = {"query": raw_args_str}

            return {
                "thought": thought,
                "tool_name": tool_name,
                "tool_args": tool_args,
                "is_final": False,
                "final_answer": "",
            }

        # 3. Fallback: check if text looks like an attempted/malformed JSON or tool call
        if text.startswith("{") or text.endswith("}") or "tool_name" in text or "action" in text:
            return {
                "thought": text,
                "tool_name": None,
                "tool_args": {},
                "is_final": False,
                "final_answer": "",
                "error": f"Malformed or invalid JSON action: {text[:100]}"
            }

        # Otherwise treat plain non-empty narrative text as final answer if no action found
        return {
            "thought": text,
            "tool_name": None,
            "tool_args": {},
            "is_final": True,
            "final_answer": text,
        }


    @staticmethod
    def _extract_json(text: str) -> Optional[Any]:
        """Attempt to extract and parse JSON from code fences or raw string."""
        # Check for ```json ... ```
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
        if fence_match:
            try:
                return json.loads(fence_match.group(1))
            except json.JSONDecodeError:
                pass

        # Check for standalone outer braces { ... }
        brace_match = re.search(r"(\{.*\})", text, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(1))
            except json.JSONDecodeError:
                pass

        try:
            return json.loads(text)
        except (json.JSONDecodeError, TypeError):
            return None
