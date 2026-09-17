"""
API Routes and Endpoints.

Owner: Person 3

Responsibilities:
- Provide HTTP endpoints for task dispatch, status polling, and agent cancellation.
- Provide WebSocket or SSE streaming endpoints for real-time agent trace visualization.
- Translate API requests to AgentCore invocations.

TODO:
- Wire up POST /api/tasks to trigger AgentCore.
- Implement GET /api/tasks/{task_id}/events for SSE streaming trace.
"""

from fastapi import APIRouter, HTTPException
from backend.api.schemas import TaskRequest, TaskResponse, TaskStatus

router = APIRouter()


@router.post("/tasks", response_model=TaskResponse, tags=["Tasks"])
async def submit_task(request: TaskRequest):
    """
    Submit a coding or debugging task to RepoPilot.

    TODO: Person 3 will connect this to AgentCore execution.
    """
    return TaskResponse(
        task_id="task-placeholder-id",
        status=TaskStatus.PENDING,
        message="Task submitted. Agent execution wiring in progress.",
    )


@router.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
async def get_task_status(task_id: str):
    """
    Poll task execution status and summary.

    TODO: Implement task state retrieval.
    """
    return TaskResponse(
        task_id=task_id,
        status=TaskStatus.PENDING,
        message="Status polling endpoint placeholder.",
    )
