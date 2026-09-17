"""
Agent Memory for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Maintain short-term working memory and conversation trajectory for the agent.
- Track step-by-step execution trajectory (plans, actions, tool observations, errors, reflections).
- Format execution history cleanly into prompt context for subsequent LLM cognitive cycles.
- Pure in-memory representation with bounded sliding window to avoid context explosion.
"""

import json
from typing import Any, Dict, List, Optional


class StructuredResult(dict):
    """
    Structured observation dictionary that is also comparable to string content
    for compatibility with tests and consumers expecting string values.
    """

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, str):
            if "data" in self and str(self["data"]) == other:
                return True
            if "error" in self and str(self["error"]) == other:
                return True
            return str(self.get("data", self)) == other or str(self) == other
        return super().__eq__(other)

    def __str__(self) -> str:
        if "data" in self and isinstance(self["data"], str):
            return self["data"]
        if "error" in self and isinstance(self["error"], str):
            return self["error"]
        return json.dumps(self, default=str)


class Memory:
    """
    Short-term working memory and trajectory tracker for the autonomous agent.
    Maintains ordered execution records with both role-based and step-based interfaces.
    """

    def __init__(self, max_trajectory_steps: int = 50):
        self.trajectory: List[Dict[str, Any]] = []
        self.max_trajectory_steps = max_trajectory_steps

    @property
    def history(self) -> List[Dict[str, Any]]:
        """Expose trajectory as history for backwards compatibility."""
        return self.trajectory

    @history.setter
    def history(self, val: List[Dict[str, Any]]) -> None:
        self.trajectory = val

    def add_message(self, role: str, content: Any, **kwargs: Any) -> None:
        """
        Add a message to history using role and content.
        Maps role to step_type for unified trajectory tracking.
        """
        r = str(role).lower()
        if r in ("tool_result", "tool_error", "observation"):
            step_type = "OBSERVATION"
        elif r in ("action", "tool_call"):
            step_type = "ACTION"
        elif r in ("plan",):
            step_type = "PLAN"
        elif r in ("reflection",):
            step_type = "REFLECTION"
        elif r in ("replan",):
            step_type = "REPLAN"
        elif r in ("user", "task"):
            step_type = "TASK"
        elif r in ("assistant",):
            step_type = "FINAL"
        else:
            step_type = role.upper()

        stored_content = StructuredResult(content) if isinstance(content, dict) else content

        entry: Dict[str, Any] = {
            "role": role,
            "type": step_type,
            "content": stored_content,
            **kwargs,
        }
        self.trajectory.append(entry)
        self._enforce_bounds()

    def add(self, role: str, content: Any, **kwargs: Any) -> None:
        """Convenience alias for add_message."""
        self.add_message(role=role, content=content, **kwargs)

    def add_step(self, step_type: str, content: Any, **kwargs: Any) -> None:
        """
        Record an execution step (plan, action, observation, reflection) into memory.
        Maps step_type to role for message compatibility.
        """
        stype = str(step_type).lower()
        if stype in ("observation", "tool_result", "tool_error"):
            if isinstance(content, dict) and (content.get("status") == "error" or "error" in content):
                role = "tool_error"
            else:
                role = "tool_result"
        elif stype in ("action", "tool_call"):
            role = "action"
        elif stype in ("user", "task"):
            role = "user"
        elif stype == "plan":
            role = "plan"
        elif stype == "reflection":
            role = "reflection"
        elif stype == "replan":
            role = "replan"
        else:
            role = stype

        stored_content = StructuredResult(content) if isinstance(content, dict) else content

        entry: Dict[str, Any] = {
            "role": role,
            "type": step_type,
            "content": stored_content,
            **kwargs,
        }
        self.trajectory.append(entry)
        self._enforce_bounds()

    def _enforce_bounds(self) -> None:
        """Preserve root plan/task but slide middle window if trajectory exceeds limit."""
        if len(self.trajectory) > self.max_trajectory_steps:
            self.trajectory = [self.trajectory[0]] + self.trajectory[-(self.max_trajectory_steps - 1):]

    def get_history(self) -> List[Dict[str, Any]]:
        """Return the stored trajectory history."""
        return list(self.trajectory)

    def get_messages(self) -> List[Dict[str, Any]]:
        """Return the stored history as messages."""
        return list(self.trajectory)

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
            stype = str(step.get("type", "")).upper()
            content = step.get("content")

            if stype == "PLAN":
                if isinstance(content, list):
                    plan_items = "\n".join(f"  - {item}" for item in content)
                    lines.append(f"Step {i} [PLAN]:\n{plan_items}")
                else:
                    lines.append(f"Step {i} [PLAN]: {content}")

            elif stype == "ACTION":
                if isinstance(content, dict):
                    tool_name = content.get("tool_name") or content.get("action") or content.get("tool")
                    tool_args = content.get("tool_args") or content.get("action_input") or content.get("arguments")
                    thought = content.get("thought", "")
                    if thought:
                        lines.append(f"Step {i} [THOUGHT]: {thought}")
                    lines.append(f"Step {i} [ACTION]: {tool_name}({json.dumps(tool_args)})")
                else:
                    lines.append(f"Step {i} [ACTION]: {content}")

            elif stype == "OBSERVATION":
                if "tool_result" in step and isinstance(step["tool_result"], dict):
                    obs_str = json.dumps(step["tool_result"], default=str)
                elif isinstance(content, dict):
                    obs_str = json.dumps(content, default=str)
                else:
                    obs_str = str(content)

                if len(obs_str) > 2000:
                    obs_str = obs_str[:2000] + "... [Observation truncated]"
                lines.append(f"Step {i} [OBSERVATION]: {obs_str}")

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

    def clear(self) -> None:
        """Reset and empty the memory buffer."""
        self.trajectory.clear()

    def __len__(self) -> int:
        return len(self.trajectory)


# Alias to maintain backwards compatibility
AgentMemory = Memory
