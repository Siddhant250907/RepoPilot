"""
Agent Core Orchestrator for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Coordinate the cognitive reasoning loop: PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT.
- Maintain memory and execution history across iterations.
- Dispatch autonomous tool calls dynamically via ToolRegistry without hardcoded routing.
- Safely handle tool failures, unknown tools, and malformed outputs as observations.
- Terminate upon receiving a final response or reaching the maximum iteration limit.
"""

import inspect
import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from backend.agent.events import AgentEvent, EventBus, EventType
from backend.agent.llm import LLMInterface
from backend.agent.memory import AgentMemory, StructuredResult
from backend.agent.parser import OutputParser
from backend.agent.planner import Planner
from backend.agent.registry import ToolRegistry
from backend.tools.calculator_tool import CalculatorTool
from backend.tools.file_tool import FileTool
from backend.tools.search_tool import SearchTool
from backend.tools.shell_tool import ShellTool

logger = logging.getLogger("RepoPilot.AgentCore")


def create_default_registry() -> ToolRegistry:
    """
    Instantiate and populate a ToolRegistry with Person 2's core tools:
    - FileTool (name: 'file_tool')
    - ShellTool (name: 'shell_tool')
    - SearchTool (name: 'search_tool')
    - CalculatorTool (name: 'calculator_tool')
    """
    registry = ToolRegistry()
    registry.register(FileTool())
    registry.register(ShellTool())
    registry.register(SearchTool())
    registry.register(CalculatorTool())
    return registry


class AgentCore:
    """
    Autonomous Agent orchestrator driving the cognitive loop for RepoPilot.
    Executes tasks using LLM-directed tool invocations and structured reflection.
    """

    def __init__(
        self,
        llm: Optional[Any] = None,
        memory: Optional[AgentMemory] = None,
        planner: Optional[Planner] = None,
        registry: Optional[ToolRegistry] = None,
        event_bus: Optional[EventBus] = None,
        max_iterations: int = 15,
    ):
        self.llm = llm or LLMInterface()
        self.memory = memory or AgentMemory()
        self.planner = planner or Planner()
        self.registry = registry if registry is not None else create_default_registry()
        self.event_bus = event_bus or EventBus()
        self.max_iterations = max_iterations

        self.status: str = "idle"
        self.step_count: int = 0
        self.final_answer: Optional[str] = None
        self.current_plan: List[str] = []

        # Populate default tools if registry is completely empty
        if not self.registry._tools:
            for tool in create_default_registry().get_all():
                self.registry.register(tool)

    async def _emit(self, event_type: EventType, step: int, payload: Dict[str, Any]) -> None:
        """Helper to publish trace events safely without breaking the agent loop."""
        if self.event_bus:
            try:
                event = AgentEvent(
                    event_type=event_type,
                    step=step,
                    payload=payload,
                )
                await self.event_bus.publish(event)
            except Exception as exc:
                logger.debug(f"Event emission failed: {exc}")

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
            '  "tool": "<exact name from available tools>",\n'
            '  "arguments": { ... arguments matching the schema ... }\n'
            "}\n"
            "```\n\n"
            "2. Final Answer format (when the task is completed or cannot proceed):\n"
            "```json\n"
            "{\n"
            '  "thought": "Reasoning summarizing the results and why the task is finished",\n'
            '  "answer": "Comprehensive answer or solution to the user task"\n'
            "}\n"
            "```\n\n"
            "CRITICAL OPERATIONAL RULES:\n"
            "- Carefully inspect observations from previous steps.\n"
            "- If a tool execution fails or returns an error, examine the error details and choose an alternative action or parameters.\n"
            "- Never hallucinate tools not listed above.\n"
            "- Only provide 'answer' when the objective has been accomplished or definitively addressed."
        )

    def _build_user_prompt(self, task: str) -> str:
        """Construct user cognitive prompt containing task, current plan, and trajectory history."""
        plan_str = (
            "\n".join(f"- {step}" for step in self.current_plan)
            if self.current_plan
            else "No plan initialized."
        )
        history_str = self.memory.get_history_prompt()

        return (
            f"ORIGINAL USER TASK:\n{task}\n\n"
            f"CURRENT EXECUTION PLAN:\n{plan_str}\n\n"
            f"EXECUTION HISTORY & OBSERVATIONS:\n{history_str}\n\n"
            "Decide the next action based on the task, plan, and history observations. "
            "Output your decision as a valid JSON object."
        )

    async def _plan(self, task: str, step: int) -> Tuple[str, List[Any], List[Dict[str, Any]]]:
        """
        PLAN Phase:
        Formulates/maintains initial plan, gathers available tools and history,
        and constructs prompt context.
        """
        tools = self.registry.get_all()
        history = self.memory.get_history()
        prompt = self.planner.build_prompt(task=task, history=history, tools=tools)

        await self._emit(
            EventType.PLAN_CREATED,
            step,
            {
                "task": task,
                "plan": self.current_plan,
                "available_tools_count": len(tools),
                "history_length": len(history),
            },
        )
        return prompt, tools, history

    async def _act(
        self,
        task: str,
        history: List[Dict[str, Any]],
        tools: List[Any],
        step: int,
    ) -> Dict[str, Any]:
        """
        ACT Phase:
        Queries the LLM for the next autonomous action and parses the structured response.
        """
        user_prompt = self._build_user_prompt(task)
        system_prompt = self._build_system_prompt()

        sig = inspect.signature(self.llm.generate)
        params = sig.parameters
        has_var_keyword = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in params.values())

        if has_var_keyword:
            kwargs_to_pass = {
                "prompt": user_prompt,
                "system_prompt": system_prompt,
                "task": task,
                "history": history,
                "tools": tools,
            }
        else:
            kwargs_to_pass = {}
            if "prompt" in params:
                kwargs_to_pass["prompt"] = user_prompt
            if "system_prompt" in params:
                kwargs_to_pass["system_prompt"] = system_prompt
            if "task" in params:
                kwargs_to_pass["task"] = task
            if "history" in params:
                kwargs_to_pass["history"] = history
            if "tools" in params:
                kwargs_to_pass["tools"] = tools

        raw_response = await self.llm.generate(**kwargs_to_pass)
        return OutputParser.parse(raw_response)

    async def _observe(self, action_decision: Dict[str, Any], step: int) -> Any:
        """
        OBSERVE Phase:
        Executes the tool requested by the LLM, capturing outputs or error observations.
        Unknown tools and execution exceptions are converted into observations so the LLM
        can autonomously recover in the next iteration.
        """
        tool_name = action_decision.get("tool") or action_decision.get("tool_name")
        tool_args = (
            action_decision.get("arguments")
            if "arguments" in action_decision
            else action_decision.get("tool_args", {})
        )
        thought = action_decision.get("thought", "")

        # Normalize common argument aliases (e.g. operation -> action for file_tool)
        if isinstance(tool_args, dict):
            if "operation" in tool_args and "action" not in tool_args:
                tool_args = dict(tool_args)
                tool_args["action"] = tool_args["operation"]

        # 1. Retrieve the requested tool from registry safely
        tool = self.registry.get(tool_name)
        if tool is None:
            available_tools = [getattr(t, "name", str(t)) for t in self.registry.get_all()]
            err_msg = (
                f"Unknown tool '{tool_name}'. Available tools: {available_tools}. "
                "Please select an existing tool."
            )
            obs = {"status": "error", "error": err_msg}
            self.memory.add_step(
                "ACTION",
                {"tool_name": tool_name, "tool_args": tool_args, "thought": thought},
            )
            self.memory.add_step("OBSERVATION", obs)
            await self._emit(
                EventType.ERROR_ENCOUNTERED,
                step,
                {"tool": tool_name, "tool_name": tool_name, "error": err_msg},
            )
            self.current_plan = self.planner.replan(self.current_plan, err_msg)
            self.memory.add_step("REPLAN", self.current_plan)
            await self._emit(
                EventType.REPLAN_TRIGGERED,
                step,
                {"revised_plan": self.current_plan, "reason": err_msg},
            )
            return obs

        # Record valid action step in memory
        self.memory.add_step(
            "ACTION",
            {"tool_name": tool_name, "tool_args": tool_args, "thought": thought},
        )

        # 2. Execute tool dynamically
        await self._emit(
            EventType.TOOL_STARTED,
            step,
            {"tool": tool_name, "tool_name": tool_name, "arguments": tool_args},
        )

        try:
            if isinstance(tool_args, dict):
                try:
                    tool_result = await self.registry.execute(tool_name, **tool_args)
                except TypeError:
                    tool_result = await self.registry.execute(tool_name, tool_args)
            else:
                tool_result = await self.registry.execute(tool_name, tool_args)
        except Exception as exc:
            # Shield AgentCore from unexpected tool exception
            tool_result = {
                "status": "error",
                "error": f"Tool '{tool_name}' execution failed with {type(exc).__name__}: {str(exc)}",
            }

        await self._emit(
            EventType.TOOL_FINISHED,
            step,
            {"tool": tool_name, "tool_name": tool_name, "result": tool_result},
        )

        # 3. Check for tool error or failure
        is_error = (
            isinstance(tool_result, dict) and tool_result.get("status") == "error"
        ) or (
            isinstance(tool_result, dict) and tool_result.get("exit_code", 0) != 0
        )

        structured_res = StructuredResult(tool_result) if isinstance(tool_result, dict) else tool_result

        if is_error:
            error_msg = (
                tool_result.get("error")
                if isinstance(tool_result, dict)
                else str(tool_result)
            )
            if isinstance(tool_result, dict) and not error_msg:
                error_msg = tool_result.get("stderr") or "Tool returned error status"

            self.memory.add_message(role="tool_error", content=structured_res)
            await self._emit(
                EventType.ERROR_ENCOUNTERED,
                step,
                {"tool": tool_name, "tool_name": tool_name, "error": error_msg, "result": tool_result},
            )
            self.current_plan = self.planner.replan(self.current_plan, str(error_msg))
            self.memory.add_step("REPLAN", self.current_plan)
            await self._emit(
                EventType.REPLAN_TRIGGERED,
                step,
                {"revised_plan": self.current_plan, "reason": str(error_msg)},
            )
        else:
            self.memory.add_message(role="tool_result", content=structured_res)

        await self._emit(
            EventType.OBSERVATION_RECEIVED,
            step,
            {"observation": tool_result},
        )
        return tool_result

    async def _reflect(self, step: int, thought: str = "") -> None:
        """
        REFLECT Phase:
        Evaluates step state and emits trace telemetry before the next cycle.
        """
        if thought:
            self.memory.add_step("REFLECTION", thought)

        reflection_payload = {
            "step": step,
            "thought": thought,
            "status": "in_progress",
        }
        await self._emit(EventType.REFLECTION_COMPLETED, step, reflection_payload)

    async def execute_task(self, task: str) -> Dict[str, Any]:
        """
        Execute the autonomous agent loop for a given user task:
        PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT
        """
        self.status = "running"
        self.step_count = 0
        self.final_answer = None
        self.current_plan = []
        self.memory.clear()

        # 1. Start Task
        await self._emit(EventType.TASK_STARTED, 0, {"task": task})

        # 2. Formulate Initial Plan
        self.current_plan = self.planner.create_initial_plan(task)
        self.memory.add_step("PLAN", self.current_plan)
        await self._emit(EventType.PLAN_CREATED, 0, {"plan": self.current_plan, "task": task})

        for iteration in range(1, self.max_iterations + 1):
            self.step_count = iteration

            # PLAN Phase
            prompt, tools, history = await self._plan(task, iteration)

            # ACT Phase
            try:
                action_decision = await self._act(task, history, tools, iteration)
            except Exception as e:
                error_msg = f"LLM communication error: {str(e)}"
                logger.error(error_msg)
                self.memory.add_step("OBSERVATION", {"status": "error", "error": error_msg})
                await self._emit(
                    EventType.ERROR_ENCOUNTERED,
                    iteration,
                    {"error": error_msg},
                )
                continue

            # Handle format/parser errors gracefully
            if action_decision.get("type") == "error" or action_decision.get("error"):
                parse_err = action_decision.get("error") or "Unknown parsing error"
                obs = {"status": "error", "error": f"Invalid action: {parse_err}"}
                self.memory.add_step("OBSERVATION", obs)
                await self._emit(
                    EventType.ERROR_ENCOUNTERED,
                    iteration,
                    {"error": parse_err},
                )
                continue

            # Check if LLM returned final answer
            if action_decision.get("is_final") or action_decision.get("type") == "final":
                final_answer = (
                    action_decision.get("final_answer")
                    or action_decision.get("answer", "")
                )
                self.final_answer = str(final_answer)
                self.status = "completed"
                self.memory.add_step("REFLECTION", f"Task finalized: {final_answer}")
                self.memory.add_message(role="assistant", content=final_answer)
                await self._emit(
                    EventType.TASK_COMPLETED,
                    iteration,
                    {
                        "final_answer": final_answer,
                        "answer": final_answer,
                        "iterations": iteration,
                    },
                )
                return {
                    "status": "success",
                    "final_answer": self.final_answer,
                    "iterations": iteration,
                    "trajectory": self.memory.get_context(),
                }

            # Validate requested tool name
            tool_name = action_decision.get("tool") or action_decision.get("tool_name")
            tool_args = (
                action_decision.get("arguments")
                if "arguments" in action_decision
                else action_decision.get("tool_args", {})
            )
            thought = action_decision.get("thought", "")

            if not tool_name or not isinstance(tool_name, str):
                err_msg = "LLM response did not specify a valid tool_name."
                self.memory.add_step("OBSERVATION", {"status": "error", "error": err_msg})
                await self._emit(
                    EventType.ERROR_ENCOUNTERED,
                    iteration,
                    {"error": err_msg},
                )
                continue

            # Emit ACTION_SELECTED only for valid action selection
            await self._emit(
                EventType.ACTION_SELECTED,
                iteration,
                {
                    "type": "tool_call",
                    "tool": tool_name,
                    "arguments": tool_args,
                    "tool_name": tool_name,
                    "tool_args": tool_args,
                    "thought": thought,
                },
            )

            # OBSERVE Phase
            await self._observe(action_decision, iteration)

            # REFLECT Phase
            await self._reflect(iteration, thought)

            # REPEAT Phase: continues automatically

        # Max iterations reached without final resolution
        timeout_msg = (
            f"Agent reached maximum execution limit of {self.max_iterations} "
            f"iterations without completing."
        )
        self.final_answer = timeout_msg
        self.status = "failed"
        await self._emit(
            EventType.ERROR_ENCOUNTERED,
            self.max_iterations,
            {"error": timeout_msg},
        )
        await self._emit(
            EventType.TASK_COMPLETED,
            self.max_iterations,
            {"answer": timeout_msg, "status": "max_iterations_reached"},
        )
        return {
            "status": "max_iterations_reached",
            "final_answer": timeout_msg,
            "iterations": self.max_iterations,
            "trajectory": self.memory.get_context(),
        }

    async def run(self, task: str) -> str:
        """
        Execute the autonomous cognitive loop and return the final answer string.
        Sets agent.final_answer, agent.status, and agent.step_count.
        """
        await self.execute_task(task)
        return self.final_answer or ""


# Aliases for core Agent class
Agent = AgentCore
