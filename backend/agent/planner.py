"""
Planner and Context Preparation Component.

Owner: Person 1 (Agent Core)

Responsibilities:
- Prepare and structure context provided to the LLM.
- Collate the user task, available tools, prior interaction history, and response constraints.
- Maintain neutrality: the planner does NOT select tools; the LLM determines all tool calls autonomously.
"""

import json
from typing import List, Dict, Any, Optional

DEFAULT_INSTRUCTIONS = """You MUST respond with a single valid JSON object in ONE of the following formats:

1. To call a tool:
{
    "type": "tool_call",
    "tool": "<tool_name>",
    "arguments": {
        "<param_name>": "<param_value>"
    }
}

2. When the task is complete:
{
    "type": "final",
    "answer": "<final summary or resolution>"
}

Do NOT output any markdown commentary or text outside the JSON object.
"""


class Planner:
    """
    Prepares and structures prompt context for the LLM.
    Acts as the context aggregator without making tool selection decisions.
    """

    def __init__(self, instructions: str = DEFAULT_INSTRUCTIONS):
        self.instructions = instructions

    def format_tools(self, tools: Optional[List[Any]] = None) -> str:
        """Format the list of available tools into human/LLM-readable descriptions."""
        if not tools:
            return "No tools available."

        lines = []
        for tool in tools:
            if hasattr(tool, "to_schema") and callable(tool.to_schema):
                schema = tool.to_schema()
                name = schema.get("name", getattr(tool, "name", "unknown"))
                desc = schema.get("description", getattr(tool, "description", ""))
                params = schema.get("parameters", {})
                lines.append(f"- {name}: {desc} (Parameters: {json.dumps(params)})")
            elif isinstance(tool, dict):
                name = tool.get("name", "unknown")
                desc = tool.get("description", "")
                params = tool.get("parameters", {})
                lines.append(f"- {name}: {desc} (Parameters: {json.dumps(params)})")
            elif hasattr(tool, "name"):
                name = getattr(tool, "name")
                desc = getattr(tool, "description", "")
                lines.append(f"- {name}: {desc}")
            else:
                lines.append(f"- {str(tool)}")
        return "\n".join(lines)

    def format_history(self, history: Optional[List[Dict[str, Any]]] = None) -> str:
        """Format the execution/conversation history into sequential step text."""
        if not history:
            return "None (first step)."

        lines = []
        for idx, item in enumerate(history, 1):
            role = item.get("role", item.get("type", "step"))
            content = item.get("content", "")
            if isinstance(content, (dict, list)):
                content_str = json.dumps(content)
            else:
                content_str = str(content)
            lines.append(f"Step {idx} [{role}]: {content_str}")
        return "\n".join(lines)

    def build_prompt(
        self,
        task: str,
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
    ) -> str:
        """
        Assemble the complete LLM prompt containing task, tools, history, and JSON instructions.
        """
        tools_text = self.format_tools(tools)
        history_text = self.format_history(history)

        return (
            f"# USER TASK\n"
            f"{task}\n\n"
            f"# AVAILABLE TOOLS\n"
            f"{tools_text}\n\n"
            f"# EXECUTION HISTORY\n"
            f"{history_text}\n\n"
            f"# INSTRUCTIONS\n"
            f"{self.instructions}"
        )

    def prepare_context(
        self,
        task: str,
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
    ) -> str:
        """Convenience alias for build_prompt."""
        return self.build_prompt(task=task, history=history, tools=tools)

    def get_structured_context(
        self,
        task: str,
        history: Optional[List[Dict[str, Any]]] = None,
        tools: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """Return the context components as a structured dictionary."""
        return {
            "task": task,
            "tools": tools or [],
            "history": history or [],
            "prompt": self.build_prompt(task=task, history=history, tools=tools),
        }

    # Backwards compatibility methods
    def create_initial_plan(self, task: str) -> List[str]:
        """Generate initial high-level sub-goals for task."""
        return [task] if task else []

    def replan(self, current_plan: List[str], failure_observation: str) -> List[str]:
        """Adapt plan upon failure observation."""
        return current_plan
