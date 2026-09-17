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
from typing import Optional, Dict, Any, List, Tuple

from backend.agent.memory import AgentMemory
from backend.agent.planner import Planner
from backend.agent.llm import LLMInterface
from backend.agent.registry import ToolRegistry
from backend.agent.parser import OutputParser
from backend.agent.events import EventBus, AgentEvent, EventType


class AgentCore:
    """
    Autonomous Agent orchestrator driving the cognitive loop for RepoPilot.
    Executes tasks using LLM-directed tool invocations and structured reflection.
    """

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

        self.status: str = "idle"
        self.step_count: int = 0
        self.final_answer: Optional[str] = None

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
            except Exception:
                pass

    async def _plan(self, task: str, step: int) -> Tuple[str, List[Any], List[Dict[str, Any]]]:
        """
        PLAN Phase:
        Gathers available tools and previous history, then builds the LLM prompt context.
        """
        tools = self.registry.get_all()
        history = self.memory.get_history()
        prompt = self.planner.build_prompt(task=task, history=history, tools=tools)

        await self._emit(
            EventType.PLAN_CREATED,
            step,
            {"task": task, "available_tools_count": len(tools), "history_length": len(history)},
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
        raw_response = await self.llm.generate(task=task, history=history, tools=tools)
        parsed = OutputParser.parse(raw_response)

        thought = parsed.get("thought", "")
        action_payload = {
            "type": parsed.get("type"),
            "tool": parsed.get("tool"),
            "arguments": parsed.get("arguments", {}),
            "thought": thought,
        }
        await self._emit(EventType.ACTION_SELECTED, step, action_payload)

        # Record action in memory
        self.memory.add_message(
            role="action",
            content=action_payload,
        )
        return parsed

    async def _observe(self, action_decision: Dict[str, Any], step: int) -> str:
        """
        OBSERVE Phase:
        Executes the tool requested by the LLM, capturing outputs or error observations.
        Unknown tools and execution exceptions are converted into observations so the LLM
        can autonomously recover in the next iteration.
        """
        tool_name = action_decision.get("tool")
        tool_args = action_decision.get("arguments", {})

        # 1. Retrieve the requested tool from registry
        tool = self.registry.get(tool_name)
        if tool is None:
            available_tools = [getattr(t, "name", str(t)) for t in self.registry.get_all()]
            observation = (
                f"Error: Tool '{tool_name}' is not registered. "
                f"Available tools: {available_tools}. Please select an existing tool."
            )
            self.memory.add_message(role="tool_error", content=observation)
            await self._emit(
                EventType.ERROR_ENCOUNTERED,
                step,
                {"tool": tool_name, "error": observation},
            )
            return observation

        # 2. Execute tool
        await self._emit(EventType.TOOL_STARTED, step, {"tool": tool_name, "arguments": tool_args})

        try:
            # Primary contract: tool.execute(tool_args) where tool_args is a dictionary.
            # Signature-aware dispatch ensures seamless compatibility with both contracts.
            sig = inspect.signature(tool.execute)
            params = [p for p in sig.parameters.values() if p.name != "self"]
            is_single_dict_contract = bool(params) and (
                params[0].name in ("arguments", "tool_args", "args")
                or (
                    len(params) == 1
                    and params[0].kind not in (inspect.Parameter.VAR_KEYWORD, inspect.Parameter.VAR_POSITIONAL)
                )
            )

            if is_single_dict_contract:
                try:
                    if inspect.iscoroutinefunction(tool.execute):
                        result = await tool.execute(tool_args)
                    else:
                        res = tool.execute(tool_args)
                        result = await res if inspect.isawaitable(res) else res
                except TypeError:
                    if inspect.iscoroutinefunction(tool.execute):
                        result = await tool.execute(**tool_args)
                    else:
                        res = tool.execute(**tool_args)
                        result = await res if inspect.isawaitable(res) else res
            else:
                try:
                    if inspect.iscoroutinefunction(tool.execute):
                        result = await tool.execute(**tool_args)
                    else:
                        res = tool.execute(**tool_args)
                        result = await res if inspect.isawaitable(res) else res
                except TypeError:
                    if inspect.iscoroutinefunction(tool.execute):
                        result = await tool.execute(tool_args)
                    else:
                        res = tool.execute(tool_args)
                        result = await res if inspect.isawaitable(res) else res

            # FIX 2: Check if tool returned a structured error
            if isinstance(result, dict) and result.get("status") == "error":
                error_msg = result.get("error", "Unknown tool error")
                observation = f"Tool '{tool_name}' returned error: {error_msg}"
                self.memory.add_message(role="tool_error", content=observation)
                await self._emit(
                    EventType.ERROR_ENCOUNTERED,
                    step,
                    {"tool": tool_name, "error": error_msg, "result": result},
                )
            else:
                # Successful observation
                if isinstance(result, dict) and result.get("status") == "success":
                    data = result.get("data", result)
                    observation = str(data)
                else:
                    observation = str(result)

                self.memory.add_message(role="tool_result", content=observation)
                await self._emit(
                    EventType.TOOL_FINISHED,
                    step,
                    {"tool": tool_name, "result": observation},
                )
        except Exception as exc:
            # Tool failure must NOT terminate the agent; LLM receives failure as observation
            observation = f"Tool '{tool_name}' execution failed with {type(exc).__name__}: {str(exc)}"
            self.memory.add_message(role="tool_error", content=observation)
            await self._emit(
                EventType.ERROR_ENCOUNTERED,
                step,
                {"tool": tool_name, "error": str(exc)},
            )

        await self._emit(EventType.OBSERVATION_RECEIVED, step, {"observation": observation})
        return observation

    async def _reflect(self, step: int, thought: str = "") -> None:
        """
        REFLECT Phase:
        Evaluates step state and emits trace telemetry before the next cycle.
        """
        reflection_payload = {
            "step": step,
            "thought": thought,
            "status": "in_progress",
        }
        if thought:
            self.memory.add_message(role="reflection", content=thought)

        await self._emit(EventType.REFLECTION_COMPLETED, step, reflection_payload)

    async def run(self, task: str) -> str:
        """
        Execute the autonomous cognitive loop:
        PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT
        """
        self.status = "running"
        self.step_count = 0
        self.final_answer = None

        # 1. Receive user task and store in memory
        self.memory.add_message(role="user", content=task)
        await self._emit(EventType.TASK_STARTED, 0, {"task": task})

        # Autonomous reasoning loop
        for iteration in range(1, self.max_iterations + 1):
            self.step_count = iteration

            # 1. PLAN: Prepare context with task, history, available tools
            prompt, tools, history = await self._plan(task, iteration)

            # 2. ACT: Ask LLM what action should be taken and parse response
            action_decision = await self._act(task, history, tools, iteration)

            # Check if LLM returned final answer
            if action_decision.get("type") == "final":
                final_answer = action_decision.get("answer", "")
                self.final_answer = final_answer
                self.status = "completed"
                self.memory.add_message(role="assistant", content=final_answer)
                await self._emit(EventType.TASK_COMPLETED, iteration, {"answer": final_answer})
                return final_answer

            # Handle format/parser errors gracefully
            if action_decision.get("type") == "error":
                err_msg = action_decision.get("error", "Unknown parsing error")
                observation = f"Invalid response format: {err_msg}. Please return a valid JSON object."
                self.memory.add_message(role="tool_error", content=observation)
                await self._emit(EventType.ERROR_ENCOUNTERED, iteration, {"error": err_msg})
                continue

            # 3. OBSERVE: Execute tool requested by LLM and capture result
            await self._observe(action_decision, iteration)

            # 4. REFLECT: Note thoughts and update trace
            await self._reflect(iteration, action_decision.get("thought", ""))

            # 5. REPEAT: Loop continues automatically with updated memory context

        # If iteration limit reached without final response
        timeout_msg = (
            f"Agent reached maximum iteration limit ({self.max_iterations}) "
            f"without completing the task."
        )
        self.final_answer = timeout_msg
        self.status = "failed"
        await self._emit(
            EventType.TASK_COMPLETED,
            self.max_iterations,
            {"answer": timeout_msg, "status": "max_iterations_reached"},
        )
        return timeout_msg

    async def execute_task(self, task: str) -> str:
        """Convenience alias for run()."""
        return await self.run(task)


# Aliases for core Agent class
Agent = AgentCore
