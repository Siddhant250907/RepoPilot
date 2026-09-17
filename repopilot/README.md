# RepoPilot

> **Hackathon Track**: "BUILD THE BRAIN, NOT THE PUPPET"

RepoPilot is an autonomous AI coding agent designed to diagnose, navigate, and resolve software engineering issues across codebases. Rather than acting as a rigid, scripted puppet, RepoPilot is built around an autonomous cognitive loop capable of reasoning about tool usage, interpreting execution feedback, and recovering from unexpected failures.

---

## Architectural Philosophy: Build the Brain, Not the Puppet

Most traditional agent wrappers rely on hardcoded workflows or bloated multi-agent frameworks. RepoPilot rejects off-the-shelf agent frameworks (e.g., LangChain, CrewAI, AutoGen). The entire cognitive loop, tool registry, memory manager, and execution engine are built from scratch using direct LLM API calls.

### Key Tenets
1. **Autonomous Tool Selection**: The LLM autonomously chooses which tool to invoke based on task state. Tool routing is never hardcoded.
2. **Failure as Observation**: Tool errors, execution timeouts, and non-zero exit codes are treated as first-class observations fed back into the reasoning loop for reflection and replanning.
3. **Transparent Execution**: Every plan, action, observation, and reflection is captured as a structured event for real-time visualization.

---

## Planned Cognitive Agent Loop

RepoPilot executes an iterative, reflective loop:

```
    ┌───────────────────────────┐
    │           PLAN            │
    │  Analyze goal & history   │
    └─────────────┬─────────────┘
                  │
                  ▼
    ┌───────────────────────────┐
    │           ACT             │
    │  Select & execute a tool  │
    └─────────────┬─────────────┘
                  │
                  ▼
    ┌───────────────────────────┐
    │          OBSERVE          │
    │  Inspect tool output/error│
    └─────────────┬─────────────┘
                  │
                  ▼
    ┌───────────────────────────┐
    │          REFLECT          │
    │ Evaluate progress vs goal │
    └─────────────┬─────────────┘
                  │
                  ▼
    ┌───────────────────────────┐
    │          REPEAT           │
    │ Iterate until task solved │
    └───────────────────────────┘
```

---

## Planned Tools

* **File Reader (`file_tool.py`)**: Safe inspection and exploration of codebase files and directory hierarchies.
* **Shell (`shell_tool.py`)**: Sandboxed execution of terminal commands, test suites, and linters with strict timeout handling.
* **Web Search (`search_tool.py`)**: Targeted web searches for error signatures, documentation, and API references.
* **Calculator (`calculator_tool.py`)**: Deterministic mathematical and offset computations.

---

## Team Ownership & Architecture

To enable 3 developers to work simultaneously without cross-interference, responsibilities are cleanly divided across decoupled modular boundaries:

```
USER ──► FRONTEND ──► FASTAPI ──► AGENT CORE ──► LLM
                                      │
                                      ▼
                                TOOL REGISTRY ──► TOOLS
```

### Person 1: Agent Core & Cognitive Loop
* **Directory**: `backend/agent/`
* **Responsibilities**:
  - `AgentCore`: Central orchestration engine.
  - Cognitive loop execution: `PLAN` → `ACT` → `OBSERVE` → `REFLECT` → `REPEAT`.
  - LLM communication interface (direct provider SDK/HTTP).
  - Planner: Goal decomposition and sub-task sequencing.
  - Memory: Short-term trajectory buffer and working context.
  - Parser: Structured thought and tool-call extraction.
  - Tool Registry: Dynamic tool lookup, argument validation, and dispatch.
  - Event System: Streaming trajectory events to listeners.

### Person 2: Tool System & Execution Sandbox
* **Directory**: `backend/tools/`
* **Responsibilities**:
  - `BaseTool` contract and type definitions.
  - Tool implementations: `FileTool`, `ShellTool`, `SearchTool`, `CalculatorTool`.
  - Execution lifecycle and error encapsulation (exceptions converted to observations).
  - Timeout enforcement and process cancellation.
  - Security boundaries, path containment, and command safety.

### Person 3: API, Frontend & Demonstration
* **Directories**: `frontend/`, `backend/api/`, `demo/`
* **Responsibilities**:
  - FastAPI endpoints (`backend/api/`): Task submission, status, and event streaming.
  - Frontend UI (`frontend/`): Real-time agent trace visualization, tool execution inspect cards, error recovery cards, and final status displays.
  - Demo Scenarios (`demo/`): Curated broken codebases (`broken-login`, `broken-python`, `broken-api`) and test scenarios demonstrating debugging, tool failures, and autonomous recovery.

---

## Project Status

> **Notice**: This repository is currently in the initial scaffolding stage. The modular architecture and configurations have been established to allow simultaneous development across all three roles. Full agent logic, tool implementations, and UI components are actively in development.
