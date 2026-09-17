"""
Planner and Context Preparation Component.

Owner: Person 1 (Agent Core)

Responsibilities:
- Analyze user task description and current repository context.
- Formulate high-level execution plans with clear verification criteria.
- Support dynamic re-planning when tool execution yields unexpected results or failures.
- Prepare and structure context provided to the LLM.
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
    Cognitive planner responsible for decomposing goals, adapting plans,
    and structuring prompt context for the LLM.
    Acts as context aggregator without making tool selection decisions.
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

    def create_initial_plan(self, task: str) -> List[str]:
        """
        Generate initial sequence of sub-goals based on general problem solving stages.
        Does NOT mandate specific tools; leaves tool selection to the autonomous LLM reasoning.
        """
        if not task or not task.strip():
            return ["Analyze the given objective", "Determine required actions", "Complete the task"]

        clean_task = task.strip()
        return [
            f"Understand and analyze task objective: {clean_task}",
            "Explore relevant repository context, files, commands, or data as needed",
            "Perform necessary actions and verify each intermediate result",
            "Synthesize findings and provide a comprehensive final answer"
        ]

    def replan(self, current_plan: List[str], failure_observation: str) -> List[str]:
        """
        Re-evaluate and adapt the plan based on failure or unexpected observation.
        Adds recovery and diagnosis steps without hardcoding specific tools.
        """
        base_plan = list(current_plan) if current_plan else ["Resolve objective"]
        obs_summary = str(failure_observation).strip()
        if len(obs_summary) > 120:
            obs_summary = obs_summary[:117] + "..."

        diagnostic_step = f"Diagnose cause of unexpected result or error: {obs_summary}"
        recovery_step = "Reassess approach, alternative parameters, or alternative actions to achieve the objective"

        new_plan = [diagnostic_step, recovery_step]
        for step in base_plan:
            if step not in new_plan:
                new_plan.append(step)

        return new_plan
