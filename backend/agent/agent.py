"""
Agent Core Orchestrator.

Owner: Person 1

Responsibilities:
- Coordinate the cognitive loop: PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT.
- Manage state transitions and step limits.
- Emit structured trace events at each phase of the loop.
- Deliver final answer or error summary upon task completion.

TODO:
- Implement `run(task: str)` async generator / execution method.
- Integrate with `Planner`, `LLMInterface`, `ToolRegistry`, and `AgentMemory`.
- Implement autonomous stopping condition detection.
"""

import json
import logging
from typing import Optional, Dict, Any, List

from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.llm import LLMInterface
from backend.agent.registry import ToolRegistry
from backend.agent.events import EventBus, AgentEvent, EventType
from backend.agent.parser import OutputParser
from backend.tools.file_tool import FileTool
from backend.tools.shell_tool import ShellTool
from backend.tools.search_tool import SearchTool
from backend.tools.calculator_tool import CalculatorTool

logger = logging.getLogger("RepoPilot.AgentCore")


class AgentCore:
    """Central autonomous agent brain driving the reasoning loop."""

    def __init__(
        self,
        llm: Optional[LLMInterface] = None,
        memory: Optional[AgentMemory] = None,
        planner: Optional[Planner] = None,
        registry: Optional[ToolRegistry] = None,
        event_bus: Optional[EventBus] = None,
        max_iterations: int = 15,
    ):
        self.llm = llm or LLMInterface()
        self.memory = memory or AgentMemory()
        self.planner = planner or Planner()
        self.registry = registry or ToolRegistry()
        self.event_bus = event_bus or EventBus()
        self.max_iterations = max_iterations
        self.current_plan: List[str] = []

        # Populate default tools if registry is completely empty
        if not self.registry._tools:
            self.registry.register(FileTool())
            self.registry.register(ShellTool())
            self.registry.register(SearchTool())
            self.registry.register(CalculatorTool())

    def _build_system_prompt(self) -> str:
        """
        Dynamically format tool descriptions and operational rules directly from ToolRegistry.
        Does not hardcode routing rules. The LLM decides purely based on tool schemas.
        """
        tools_metadata = self.registry.list_tools()
        tools_doc = json.dumps(tools_metadata, indent=2)

        return (
            "You are RepoPilot, an autonomous software engineering AI agent.\n"
            "You solve developer and repository tasks step-by-step using autonomous tools.\n\n"
            "AVAILABLE TOOLS AND SCHEMAS:\n"
            f"{tools_doc}\n\n"
            "RESPONSE FORMAT REQUIREMENTS:\n"
            "You MUST respond in one of two formats:\n"
            "1. Tool Action JSON format:\n"
            "```json\n"
            "{\n"
            '  "thought": "Reasoning about current state and what to do next",\n'
            '  "tool_name": "<exact name from available tools>",\n'
            '  "tool_args": { ... arguments matching the schema ... }\n'
            "}\n"
            "```\n\n"
            "2. Final Answer format (when the task is completed or cannot proceed):\n"
            "```json\n"
            "{\n"
            '  "thought": "Reasoning summarizing the results and why the task is finished",\n'
            '  "final_answer": "Comprehensive answer or solution to the user task"\n'
            "}\n"
            "```\n"
            "CRITICAL OPERATIONAL RULES:\n"
            "- Carefully inspect observations from previous steps.\n"
            "- If a tool execution fails or returns an error, examine the error details and choose an alternative action or parameters.\n"
            "- Never hallucinate tools not listed above.\n"
            "- Only provide 'final_answer' when the objective has been accomplished or definitively addressed."
        )

    def _build_user_prompt(self, task: str) -> str:
        """Construct user cognitive prompt containing task, current plan, and trajectory history."""
        plan_str = "\n".join(f"- {step}" for step in self.current_plan) if self.current_plan else "No plan initialized."
        history_str = self.memory.get_history_prompt()

        return (
            f"ORIGINAL USER TASK:\n{task}\n\n"
            f"CURRENT EXECUTION PLAN:\n{plan_str}\n\n"
            f"EXECUTION HISTORY & OBSERVATIONS:\n{history_str}\n\n"
            "Decide the next action based on the task, plan, and history observations. "
            "Output your decision as a valid JSON object."
        )

    async def execute_task(self, task: str) -> Dict[str, Any]:
        """
        Execute the autonomous agent loop for a given user task:
        1. Receive user task & initialize state
        2. Formulate plan via Planner
        3. Loop (up to max_iterations):
           - Consult LLM with tool schemas and observation history
           - Parse LLM output into structured action or final answer
           - If final answer, complete task and terminate
           - If tool action, validate against ToolRegistry
           - Execute tool dynamically via ToolRegistry
           - Receive structured ToolResult and store observation in memory
           - If tool failed, trigger dynamic replanning
           - Loop repeat
        4. Terminate safely if max iterations reached
        """
        self.memory.clear()
        
        # 1. Start Task
        await self.event_bus.publish(
            AgentEvent(
                event_type=EventType.TASK_STARTED,
                step=0,
                payload={"task": task}
            )
        )

        # 2. Formulate Initial Plan
        self.current_plan = self.planner.create_initial_plan(task)
        self.memory.add_step("PLAN", self.current_plan)
        await self.event_bus.publish(
            AgentEvent(
                event_type=EventType.PLAN_CREATED,
                step=0,
                payload={"plan": self.current_plan}
            )
        )

        system_prompt = self._build_system_prompt()
        iteration = 0

        while iteration < self.max_iterations:
            iteration += 1

            # 3. LLM Interaction for next step
            user_prompt = self._build_user_prompt(task)
            try:
                raw_llm_response = await self.llm.generate(
                    prompt=user_prompt,
                    system_prompt=system_prompt
                )
            except Exception as e:
                error_msg = f"LLM communication error: {str(e)}"
                logger.error(error_msg)
                self.memory.add_step("OBSERVATION", {"status": "error", "error": error_msg})
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.ERROR_ENCOUNTERED,
                        step=iteration,
                        payload={"error": error_msg}
                    )
                )
                continue

            # 4. Parse & Validate Action
            parsed_action = OutputParser.parse_action(raw_llm_response)
            thought = parsed_action.get("thought", "")

            # If parser reported malformed LLM response
            if parsed_action.get("error"):
                parse_err = parsed_action["error"]
                self.memory.add_step("OBSERVATION", {"status": "error", "error": f"Invalid action: {parse_err}"})
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.ERROR_ENCOUNTERED,
                        step=iteration,
                        payload={"error": parse_err}
                    )
                )
                continue

            # 5. Check for Final Answer
            if parsed_action.get("is_final"):
                final_answer = parsed_action.get("final_answer", "")
                self.memory.add_step("REFLECTION", f"Task finalized: {final_answer}")
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.TASK_COMPLETED,
                        step=iteration,
                        payload={"final_answer": final_answer, "iterations": iteration}
                    )
                )
                return {
                    "status": "success",
                    "final_answer": final_answer,
                    "iterations": iteration,
                    "trajectory": self.memory.get_context()
                }

            # 6. Tool Action Validation
            tool_name = parsed_action.get("tool_name")
            tool_args = parsed_action.get("tool_args", {})

            if not tool_name or not isinstance(tool_name, str):
                err_msg = "LLM response did not specify a valid tool_name."
                self.memory.add_step("OBSERVATION", {"status": "error", "error": err_msg})
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.ERROR_ENCOUNTERED,
                        step=iteration,
                        payload={"error": err_msg}
                    )
                )
                continue

            # Check if requested tool exists in ToolRegistry
            if tool_name not in self.registry._tools:
                available = list(self.registry._tools.keys())
                err_msg = f"Unknown tool '{tool_name}'. Available tools: {available}"
                self.memory.add_step("ACTION", {"tool_name": tool_name, "tool_args": tool_args, "thought": thought})
                self.memory.add_step("OBSERVATION", {"status": "error", "error": err_msg})
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.ERROR_ENCOUNTERED,
                        step=iteration,
                        payload={"tool_name": tool_name, "error": err_msg}
                    )
                )
                continue

            # Record action step in memory
            self.memory.add_step("ACTION", {"tool_name": tool_name, "tool_args": tool_args, "thought": thought})
            await self.event_bus.publish(
                AgentEvent(
                    event_type=EventType.ACTION_SELECTED,
                    step=iteration,
                    payload={"tool_name": tool_name, "tool_args": tool_args, "thought": thought}
                )
            )

            # 7. Execute dynamic tool via ToolRegistry
            await self.event_bus.publish(
                AgentEvent(
                    event_type=EventType.TOOL_STARTED,
                    step=iteration,
                    payload={"tool_name": tool_name, "arguments": tool_args}
                )
            )

            try:
                if isinstance(tool_args, dict):
                    tool_result = await self.registry.execute(tool_name, **tool_args)
                else:
                    tool_result = await self.registry.execute(tool_name, tool_args)
            except Exception as exc:
                # Shield AgentCore from unexpected tool exception: convert to structured error
                tool_result = {
                    "status": "error",
                    "error": f"Tool execution exception: {str(exc)}"
                }

            await self.event_bus.publish(
                AgentEvent(
                    event_type=EventType.TOOL_FINISHED,
                    step=iteration,
                    payload={"tool_name": tool_name, "result": tool_result}
                )
            )

            # 8. Add structured observation to agent state
            self.memory.add_step("OBSERVATION", tool_result)
            await self.event_bus.publish(
                AgentEvent(
                    event_type=EventType.OBSERVATION_RECEIVED,
                    step=iteration,
                    payload={"observation": tool_result}
                )
            )

            # 9. Failure Handling & Adaptive Re-planning
            is_error = (
                isinstance(tool_result, dict) and tool_result.get("status") == "error"
            ) or (
                isinstance(tool_result, dict) and tool_result.get("exit_code", 0) != 0
            )

            if is_error:
                error_detail = (
                    tool_result.get("error")
                    or tool_result.get("stderr")
                    or "Tool returned failure status"
                )
                self.current_plan = self.planner.replan(self.current_plan, str(error_detail))
                self.memory.add_step("REPLAN", self.current_plan)
                await self.event_bus.publish(
                    AgentEvent(
                        event_type=EventType.REPLAN_TRIGGERED,
                        step=iteration,
                        payload={"revised_plan": self.current_plan, "reason": str(error_detail)}
                    )
                )

        # 10. Max Iterations Limit Reached
        timeout_msg = f"Agent reached maximum execution limit of {self.max_iterations} iterations without completing."
        await self.event_bus.publish(
            AgentEvent(
                event_type=EventType.ERROR_ENCOUNTERED,
                step=self.max_iterations,
                payload={"error": timeout_msg}
            )
        )
        return {
            "status": "max_iterations_reached",
            "final_answer": timeout_msg,
            "iterations": self.max_iterations,
            "trajectory": self.memory.get_context()
        }

    async def run(self, task: str) -> Dict[str, Any]:
        """Convenience alias for execute_task."""
        return await self.execute_task(task)

