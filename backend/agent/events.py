"""
Lightweight Agent Event System for RepoPilot.

Owner: Person 1 (Agent Core)

Responsibilities:
- Provide structured trace events for frontend visualization and monitoring.
- Support key lifecycle events: plan, tool_call, tool_result, error, reflection, final.
- Provide a simple EventBus to publish and subscribe to agent execution traces.
"""

from enum import Enum
from datetime import datetime
import inspect
from typing import Dict, Any, Callable, List, Optional, Union


class EventType(str, Enum):
    """Supported agent lifecycle event types."""
    PLAN = "plan"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    ERROR = "error"
    REFLECTION = "reflection"
    FINAL = "final"

    # Specific trace stage types
    TASK_STARTED = "task_started"
    PLAN_CREATED = "plan_created"
    ACTION_SELECTED = "action_selected"
    TOOL_STARTED = "tool_started"
    TOOL_FINISHED = "tool_finished"
    OBSERVATION_RECEIVED = "observation_received"
    REFLECTION_COMPLETED = "reflection_completed"
    ERROR_ENCOUNTERED = "error_encountered"
    REPLAN_TRIGGERED = "replan_triggered"
    TASK_COMPLETED = "task_completed"


class AgentEvent:
    """
    Lightweight structured event model for recording the agent execution trace.
    Easy for the frontend teammate to inspect and render.
    """

    def __init__(
        self,
        event_type: Union[EventType, str],
        step_number: int = 0,
        step: Optional[int] = None,
        message: str = "",
        tool_name: Optional[str] = None,
        status: Optional[str] = None,
        error: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        timestamp: Optional[str] = None,
        **kwargs: Any,
    ):
        actual_step = step if step is not None else step_number
        self.step_number = actual_step
        self.step = actual_step
        self.event_type = event_type
        self.payload = payload or {}
        if kwargs:
            self.payload.update(kwargs)

        # Populate core fields with fallbacks from payload
        self.message = message or str(self.payload.get("message", ""))
        self.tool_name = (
            tool_name
            or self.payload.get("tool")
            or self.payload.get("tool_name")
        )
        self.status = status or self.payload.get("status")
        self.error = error or self.payload.get("error")
        self.timestamp = timestamp or datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert the event to a plain dictionary for JSON/API serialization."""
        event_type_str = (
            self.event_type.value
            if hasattr(self.event_type, "value")
            else str(self.event_type)
        )
        stage_map = {
            "task_started": "plan",
            "plan_created": "plan",
            "replan_triggered": "plan",
            "action_selected": "tool_call",
            "tool_started": "tool_call",
            "tool_finished": "tool_result",
            "observation_received": "tool_result",
            "reflection_completed": "reflection",
            "error_encountered": "error",
            "task_completed": "final",
        }
        frontend_type = stage_map.get(event_type_str, event_type_str)
        return {
            "step_number": self.step_number,
            "event_type": event_type_str,
            "type": frontend_type,
            "message": self.message,
            "tool_name": self.tool_name,
            "status": self.status,
            "error": self.error,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }

    def __repr__(self) -> str:
        return (
            f"AgentEvent(step={self.step_number}, type='{self.event_type}', "
            f"tool='{self.tool_name}', status='{self.status}')"
        )


class EventBus:
    """
    Lightweight publish/subscribe event bus for trace events.
    Decouples AgentCore from API and frontend consumers.
    """

    def __init__(self):
        self._subscribers: List[Callable[[AgentEvent], Any]] = []
        self.history: List[AgentEvent] = []

    def subscribe(self, callback: Callable[[AgentEvent], Any]) -> None:
        """Register a subscriber callback (supports sync or async functions)."""
        self._subscribers.append(callback)

    async def publish(self, event: AgentEvent) -> None:
        """Broadcast an event to all subscribers and append to event history."""
        self.history.append(event)
        for subscriber in self._subscribers:
            try:
                if inspect.iscoroutinefunction(subscriber):
                    await subscriber(event)
                else:
                    res = subscriber(event)
                    if inspect.isawaitable(res):
                        await res
            except Exception:
                pass  # Subscriber errors must never interrupt agent execution

    def get_events(self) -> List[AgentEvent]:
        """Return all events recorded during execution."""
        return list(self.history)

    def get_trace(self) -> List[Dict[str, Any]]:
        """Return all events serialized as dictionaries for frontend consumption."""
        return [event.to_dict() for event in self.history]

    def clear(self) -> None:
        """Reset the recorded event history."""
        self.history.clear()


# Aliases
Event = AgentEvent
