"""
Pydantic API Schemas.

Owner: Person 3

Responsibilities:
- Define request and response schemas for REST and WebSocket contracts.
- Ensure strict type safety and data validation between frontend and backend.
"""

from enum import Enum
from typing import Optional, List, Dict, Any

try:
    from pydantic import BaseModel
except ImportError:
    class BaseModel:  # type: ignore
        """Fallback stub when dependencies in requirements.txt are not yet installed."""
        def __init__(self, **data):
            for k, v in data.items():
                setattr(self, k, v)


class TaskStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TaskRequest(BaseModel):
    """Request payload to initiate an agent task."""
    task: str
    target_repo_path: Optional[str] = None
    max_steps: Optional[int] = 20


class TaskResponse(BaseModel):
    """Response payload for task creation and status."""
    task_id: str
    status: TaskStatus
    message: str = ""
    result: Optional[str] = None


class TraceStepSchema(BaseModel):
    """Structured event step for frontend trace visualization."""
    step: int
    stage: str  # PLAN, ACT, OBSERVE, REFLECT
    content: Dict[str, Any]
    timestamp: str
