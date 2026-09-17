"""
RepoPilot Backend Application Entry Point.

Owner: Person 3 (API & Integration)
Collaborators: Person 1 (Agent Core), Person 2 (Tools)

Responsibilities:
- Initialize FastAPI application with appropriate middleware (CORS, logging).
- Mount API routes from `backend.api.routes`.
- Provide health-check and startup/shutdown lifecycle event management.

TODO:
- Wire up agent event bus to WebSocket / SSE streaming endpoints.
- Add configuration loading on application lifespan startup.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.api.routes import router as api_router

app = FastAPI(
    title="RepoPilot API",
    description="Autonomous AI coding agent API - 'Build the Brain, Not the Puppet'",
    version="0.1.0",
)

# CORS setup for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router
app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "repopilot-backend",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
