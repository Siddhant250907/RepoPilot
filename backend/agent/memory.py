"""
Agent Memory and Trajectory Management.

Owner: Person 1 (Agent Core)

Responsibilities:
- Maintain short-term working memory: plans, actions, tool observations, reflections.
- Track step-by-step execution trajectory for auditing and visualization.
- Format execution history cleanly into prompt context for subsequent LLM cognitive cycles.
"""

import json
from typing import Any, Dict, List, Optional


class AgentMemory:
    """Short-term and trajectory memory for the autonomous agent."""

    def __init__(self, max_trajectory_steps: int = 50):
        self.trajectory: List[Dict[str, Any]] = []
        self.max_trajectory_steps = max_trajectory_steps

    def add_step(self, step_type: str, content: Any):
        """
        Append a step (plan, action, observation, reflection, decision) to memory.
        """
        self.trajectory.append({
            "type": step_type,
            "content": content
        })
        if len(self.trajectory) > self.max_trajectory_steps:
            # Preserve early plan but slide middle window
            self.trajectory = [self.trajectory[0]] + self.trajectory[-(self.max_trajectory_steps - 1):]

    def get_context(self) -> List[Dict[str, Any]]:
        """Retrieve full trajectory history for audit or visualization."""
        return self.trajectory

    def get_history_prompt(self) -> str:
        """
        Format the trajectory history into a readable narrative string for the LLM prompt.
        Preserves tool names, arguments, and full structured observation results.
        """
        if not self.trajectory:
            return "No previous steps."

        lines: List[str] = []
        for i, step in enumerate(self.trajectory, start=1):
            stype = step.get("type", "").upper()
            content = step.get("content")

            if stype == "PLAN":
                if isinstance(content, list):
                    plan_items = "\n".join(f"  - {item}" for item in content)
                    lines.append(f"Step {i} [PLAN]:\n{plan_items}")
                else:
                    lines.append(f"Step {i} [PLAN]: {content}")

            elif stype == "ACTION":
                if isinstance(content, dict):
                    tool_name = content.get("tool_name") or content.get("action")
                    tool_args = content.get("tool_args") or content.get("action_input")
                    thought = content.get("thought", "")
                    if thought:
                        lines.append(f"Step {i} [THOUGHT]: {thought}")
                    lines.append(f"Step {i} [ACTION]: {tool_name}({json.dumps(tool_args)})")
                else:
                    lines.append(f"Step {i} [ACTION]: {content}")

            elif stype == "OBSERVATION":
                if isinstance(content, dict):
                    obs_str = json.dumps(content, default=str)
                    # Bound individual observation length in prompt to prevent context explosion
                    if len(obs_str) > 2000:
                        obs_str = obs_str[:2000] + "... [Observation truncated]"
                    lines.append(f"Step {i} [OBSERVATION]: {obs_str}")
                else:
                    lines.append(f"Step {i} [OBSERVATION]: {content}")

            elif stype == "REFLECTION":
                lines.append(f"Step {i} [REFLECTION]: {content}")

            elif stype == "REPLAN":
                if isinstance(content, list):
                    plan_items = "\n".join(f"  - {item}" for item in content)
                    lines.append(f"Step {i} [REVISED PLAN]:\n{plan_items}")
                else:
                    lines.append(f"Step {i} [REVISED PLAN]: {content}")

            else:
                lines.append(f"Step {i} [{stype}]: {content}")

        return "\n".join(lines)

    def clear(self):
        """Reset memory buffer."""
        self.trajectory.clear()
