"""
Temporary test to verify real Gemini autonomous tool selection using Planner and Parser.
"""

import asyncio
import json
import os
from dotenv import load_dotenv
import pytest

# Load environment configuration
load_dotenv()

from backend.agent.agent import create_default_registry
from backend.agent.llm import LLMInterface
from backend.agent.parser import OutputParser
from backend.agent.planner import Planner


def test_gemini_autonomous_tool_selection():
    """Verify Gemini receives tool schemas and autonomously produces a valid tool_call."""
    # 1. Initialize real LLMInterface, Planner, and default ToolRegistry
    llm = LLMInterface()
    assert bool(llm.api_key), "Gemini API key not found in environment or .env"

    planner = Planner()
    registry = create_default_registry()
    tools = registry.get_all()
    registered_tool_names = {getattr(t, "name", str(t)) for t in tools}

    # 2. Build prompt using existing Planner with tool descriptions
    task = "Inspect the repository and find the contents of README.md."
    prompt = planner.build_prompt(task=task, tools=tools, history=[])

    # 3. Call real Gemini API
    raw_response = asyncio.run(llm.generate(prompt=prompt))

    # 4. Parse response using existing OutputParser
    parsed = OutputParser.parse(raw_response)
    selected_tool = parsed.get("tool") or parsed.get("tool_name")

    # 5. Print raw response, parsed response, and selected tool name
    print("\n" + "=" * 60)
    print("--- RAW GEMINI RESPONSE ---")
    print(raw_response)
    print("\n--- PARSED RESPONSE ---")
    print(json.dumps(parsed, indent=2))
    print("\n--- SELECTED TOOL NAME ---")
    print(selected_tool)
    print("=" * 60 + "\n")

    # 6. Verify structured tool call and autonomous tool selection from registry
    assert parsed.get("type") == "tool_call", (
        f"Expected response type 'tool_call', got '{parsed.get('type')}'. Raw response: {raw_response}"
    )
    assert selected_tool in registered_tool_names, (
        f"Selected tool '{selected_tool}' is not in registered tools: {registered_tool_names}"
    )
