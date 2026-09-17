"""
Agent Event System.

Owner: Person 1

Responsibilities:
- Define event types for each stage of agent execution (PLAN, ACT, OBSERVE, REFLECT, ERROR, COMPLETE).
- Provide an EventBus for pub/sub decoupling between AgentCore and API/Frontend consumers.
- Enable streaming traces in real-time over WebSocket / SSE.

TODO:
- Implement async event publishing and subscriber subscription logic.
"""

from enum import Enum
from typing import Dict, Any, Callable, List, Optional

try:
    from pydantic import BaseModel
except ImportError:
    class BaseModel:  # type: ignore
        """Fallback stub when dependencies in requirements.txt are not yet installed."""
        def __init__(self, **data):
            for k, v in data.items():
                setattr(self, k, v)


class EventType(str, Enum):
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


class AgentEvent(BaseModel):
    """Structured event model for agent trace."""
    event_type: EventType
    step: int = 0
    payload: Dict[str, Any] = {}
    timestamp: Optional[str] = None


class EventBus:
    """Simple pub/sub event bus for trace events."""

    def __init__(self):
        self._subscribers: List[Callable[[AgentEvent], Any]] = []

    def subscribe(self, callback: Callable[[AgentEvent], Any]):
        self._subscribers.append(callback)

    async def publish(self, event: AgentEvent):
        for sub in self._subscribers:
            try:
                sub(event)
            except Exception:
                pass
