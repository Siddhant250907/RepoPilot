"""
Task Planner and Goal Decomposition.

Owner: Person 1

Responsibilities:
- Analyze user task description and current repository context.
- Formulate high-level execution plans with clear verification criteria.
- Support dynamic re-planning when tool execution yields unexpected results or failures.

TODO:
- Implement `create_plan(task: str, context: dict) -> List[str]`.
- Implement `replan(current_plan, observation: str) -> List[str]`.
"""

from typing import List, Dict, Any


class Planner:
    """Cognitive planner responsible for decomposing goals and adapting plans."""

    def __init__(self):
        pass

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

