# RepoPilot Architecture

## High-Level System Architecture

RepoPilot is designed around a decoupled, modular architecture enabling 3 developers to work independently without merge conflicts or overlapping concerns:

```
+-------------------------------------------------------------+
|                         USER                                |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                      FRONTEND (React)                       |
|  - TaskInput: Goal dispatch                                 |
|  - AgentTrace: Real-time visualization of PLAN/ACT/OBSERVE  |
|  - ErrorCard: Failure analysis & recovery presentation      |
+------------------------------+------------------------------+
                               | (HTTP / SSE / WebSocket)
                               v
+-------------------------------------------------------------+
|                     FASTAPI BACKEND                         |
|  - POST /api/tasks (Submit task)                            |
|  - GET /api/tasks/{id}/events (Stream cognitive events)     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                   AGENT CORE ("The Brain")                  |
|  - PLAN -> ACT -> OBSERVE -> REFLECT -> REPEAT loop         |
|  - LLM Interface: Direct provider API calls                 |
|  - Planner: Goal decomposition & adaptive replanning        |
|  - Memory: Short-term trajectory buffer                     |
|  - EventBus: Pub/sub streaming trace events                 |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                       TOOL REGISTRY                         |
|  - Dynamic tool discovery & schema generation               |
|  - Autonomous tool dispatch (never hardcoded routing)       |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    SANDBOXED TOOLS                          |
|  - FileTool: Codebase exploration & inspection              |
|  - ShellTool: Test & linter execution with timeout guards   |
|  - SearchTool: Error and documentation lookup               |
|  - CalculatorTool: Arithmetic computation                   |
+-------------------------------------------------------------+
```

## Architectural Decoupling

| Role | Domain | Primary Packages | Key Interfaces |
|------|--------|------------------|----------------|
| **Person 1** | Agent Core | `backend/agent/` | `AgentCore`, `Planner`, `ToolRegistry`, `EventBus` |
| **Person 2** | Tool System | `backend/tools/` | `BaseTool`, `FileTool`, `ShellTool`, `Security` |
| **Person 3** | Frontend & API | `frontend/`, `backend/api/`, `demo/` | `FastAPI Routes`, `React Components`, `Scenarios` |
