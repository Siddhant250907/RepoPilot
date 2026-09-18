# RepoPilot: Comprehensive Project Report & Judge Presentation Guide

> **Track**: *"Build the Brain, Not the Puppet"*  
> **Core Identity**: An Autonomous, Self-Correcting AI Software Engineering Agent  
> **Test Status**: 100% Passing (129 Unit, Adversarial, and Integration Tests)

---

## 1. Executive Summary

Modern AI coding assistants are frequently built as **"puppets"**—rigid workflows hardwired with brittle `if/else` logic, heavily dependent on third-party frameworks like LangChain or CrewAI. When a command times out, a file path is slightly inaccurate, or a tool throws an unexpected exception, these brittle systems crash or get stuck in repetitive loops.

**RepoPilot** represents a shift to **"Building the Brain"**:
- **Zero Framework Bloat**: Built from first principles in native Python (FastAPI + Asyncio) using direct LLM API calls.
- **Autonomous Tool Routing**: The model independently selects tools based strictly on dynamic schemas published by our `ToolRegistry`. No routing is hardcoded.
- **Failures Treated as Observations**: A non-zero exit code, timeout, or missing file is never treated as a fatal crash. It is captured as an observation, injected into the agent's short-term memory, and used to trigger self-reflection and dynamic replanning.
- **Transparent Execution Trace**: Every plan, action, tool execution, reflection, and recovery is streamed in real time to an interactive developer workspace.

---

## 2. High-Level System Architecture

RepoPilot is architected with clear boundaries between the **Cognitive Brain**, the **Sandboxed Tools**, and the **Interactive Presentation Layer**.

```
                           ┌───────────────────────────────┐
                           │      USER / DEVELOPER         │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND WORKSPACE                                       │
│  - Task Composer: Natural language goal input with keyboard shortcuts                  │
│  - Real-Time Execution Trace: Step-by-step display of Plan, Action, Observe, Reflect   │
│  - Tool Call & Error Cards: Deep inspection into inputs, outputs, and recoveries       │
│  - Run Info Panel: Active repository metadata, branch, latency, and duration timer     │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ (HTTP REST / SSE Event Stream)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI BACKEND & BUS                                     │
│  - Task Dispatcher: Validates requests and spawns agent runtime                        │
│  - EventBus: Asynchronous pub/sub stream delivering live execution telemetry           │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            AGENT CORE ("The Brain")                                    │
│  - Cognitive Loop: PLAN ──► ACT ──► OBSERVE ──► REFLECT ──► REPEAT                     │
│  - LLM Interface: Direct REST calls (Google Gemini 2.5) with mock fallback             │
│  - Dynamic Planner: Initial goal decomposition + active replanning on failure          │
│  - Working Memory: Sliding-window trajectory buffer preserving context                │
│  - Resilient Parser: Multi-format extractor (JSON, Markdown codeblocks, ReAct)        │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              DYNAMIC TOOL REGISTRY                                     │
│  - Dynamic tool discovery and schema export into LLM system prompt                     │
│  - Asynchronous execution dispatcher                                                   │
└──────────────────┬───────────────────┬───────────────────┬─────────────────────────────┘
                   │                   │                   │
                   ▼                   ▼                   ▼
          ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐
          │    FileTool     │ │    ShellTool    │ │   SearchTool    │ │ CalculatorTool   │
          │ Path-sandboxed  │ │ Timeout-guarded │ │ Filtered grep   │ │ AST-evaluated    │
          │ read, list, find│ │ terminal runner │ │ code & doc scan │ │ safe arithmetic  │
          └─────────────────┘ └─────────────────┘ └─────────────────┘ └──────────────────┘
```

---

## 3. The Cognitive Loop: How the Brain Works

Rather than following a pre-scripted sequence, RepoPilot operates via a 5-stage continuous reasoning cycle:

```
    ┌─────────────────────────────────────────────────────────┐
    │ 1. PLAN                                                 │
    │    Analyze user task, review execution history, and      │
    │    formulate or adjust the step-by-step roadmap.        │
    └────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 2. ACT                                                  │
    │    Prompt the LLM with available tool schemas and history│
    │    LLM autonomously selects the next tool and arguments.│
    └────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 3. OBSERVE                                              │
    │    Execute the chosen tool in a secure sandbox. Catch   │
    │    stdout, stderr, exit codes, or exceptions as data.   │
    └────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 4. REFLECT                                              │
    │    Evaluate the observation against the plan. If an      │
    │    error occurred, trigger self-correction & replanning.│
    └────────────────────────────┬────────────────────────────┘
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────────────┐
    │ 5. REPEAT                                               │
    │    Iterate until task objective is completed or         │
    │    definitive final resolution is reached.              │
    └─────────────────────────────────────────────────────────┘
```

### Detailed Breakdown of the 5 Phases:
1. **PLAN Phase (`_plan`)**: Gathers the current task, active tool schemas, and recent trajectory from memory. Emits a `PLAN_CREATED` or `REPLAN_TRIGGERED` event.
2. **ACT Phase (`_act`)**: Constructs a clean system prompt describing all registered tools, their parameters, and required response formats. The LLM generates a structured JSON decision (`thought`, `tool`, `arguments`).
3. **OBSERVE Phase (`_observe`)**: Dispatches the action to `ToolRegistry`. The tool runs inside a safety sandbox. If the tool errors or returns a non-zero exit code, it is wrapped in an `ErrorObservation` rather than terminating the agent.
4. **REFLECT Phase (`_reflect`)**: Analyzes the observation. If the tool failed, the agent updates its internal plan, records the failure explanation in memory, and formulates an alternative approach.
5. **REPEAT / TERMINATE**: When the LLM issues a `"type": "final"` or `"answer"` response, the agent compiles the final summary and emits `TASK_COMPLETED`. A safety ceiling (`max_iterations = 15`) prevents infinite loops.

---

## 4. The Sandboxed Tool Suite

All tools inherit from an abstract `BaseTool` class, guaranteeing a uniform contract: `name`, `description`, `input_schema`, and `execute()`. Tools are completely passive; they do not contain agent logic or decision-making.

| Tool | Core Capability | Security & Guardrails |
| :--- | :--- | :--- |
| **`FileTool`** | Reads file contents, lists directory entries, and searches text across project files. | **Path Traversal Shield**: Strictly verifies all target paths resolve within the permitted workspace directory using `resolve_safe_path()`. Rejects `../../` traversal attempts. Gracefully handles unreadable or binary files. |
| **`ShellTool`** | Executes test suites (`pytest`, `npm test`), linters, and scripts in the workspace. | **Timeout Guard**: Strict timeout (default 30s) prevents hung processes or infinite loops.<br>**Command Blocklist**: Automatically rejects destructive commands (e.g. `rm -rf /`, `format`, forkbombs).<br>**Exit Code Capture**: Captures stdout, stderr, and non-zero exit codes as structured output. |
| **`SearchTool`** | Fast recursive code & documentation search across workspace files. | **Scan Boundaries**: Automatically ignores noisy directories (`.git`, `.venv`, `node_modules`, `__pycache__`). Limits file sizes to 5MB and results to 100 entries to prevent memory exhaustion. |
| **`CalculatorTool`**| Evaluates mathematical expressions and offset calculations deterministically. | **AST Security Isolation**: Evaluates expressions using Python's Abstract Syntax Tree (`ast.parse`) restricted purely to arithmetic nodes. Prohibits all imports, `eval()`, attribute access (`__class__`), functions, and file access. Guards against division by zero and exponential overflow. |

---

## 5. Autonomous Failure Recovery (Self-Correction in Action)

The defining differentiator between a simple AI script and an autonomous agent is **how it behaves when things go wrong**.

### The Failure Recovery Lifecycle
```
[ Tool Execution Returns Error / Non-Zero Code ]
                       │
                       ▼
[ Encapsulation ]: Captured as structured dict {"status": "error", "error": "..."}
                       │
                       ▼
[ Memory Injection ]: Added to conversation history as a "tool_error"
                       │
                       ▼
[ Dynamic Re-planning ]: Planner triggers replan(), analyzing error context
                       │
                       ▼
[ Next ACT Cycle ]: LLM inspects what failed, corrects parameters, or switches tools
```

### Real Scenarios RepoPilot Recovers From:
1. **Misspelled File / Missing Path**:
   - *Failure*: Agent attempts to read `src/authen.py` $\rightarrow$ `FileNotFoundError`.
   - *Self-Correction*: Instead of failing, the agent catches the error, calls `file_tool` with `action: "list"` on `src/`, discovers `src/auth.py`, and inspects the correct file.
2. **Failing Test Suite**:
   - *Failure*: Agent runs `pytest tests/test_auth.py` $\rightarrow$ returns exit code 1 with an `AssertionError: KeyError: 'JWT_SECRET'`.
   - *Self-Correction*: The agent reads the traceback from `stderr`, uses `search_tool` to locate where `JWT_SECRET` is defined in `.env.example`, spots the missing configuration key, and explains the required fix.
3. **Command Timeout / Unresponsive Process**:
   - *Failure*: A command hangs waiting for interactive user input $\rightarrow$ `ShellTool` hits the 30-second timeout and safely terminates the subprocess.
   - *Self-Correction*: The agent observes `"Command timed out after 30 seconds"`, understands the command was waiting for input, and re-executes with non-interactive flags (e.g., `-y` or `--non-interactive`).

---

## 6. Short-Term Memory & Output Parsing

### Bounded Trajectory Memory (`AgentMemory`)
- Maintains a clean chronological record of `PLAN`, `ACTION`, `OBSERVATION`, `REFLECTION`, and `REPLAN`.
- Implements a bounded sliding window (`max_trajectory_steps = 50`) to prevent context window explosion and excessive token consumption.
- Converts observations into formatted strings for easy LLM comprehension across turns.

### Resilient Multi-Format Parser (`OutputParser`)
LLMs in real-world environments occasionally format their outputs slightly differently. `OutputParser` was built to be completely fault-tolerant:
- **Direct JSON Objects**: Extracts `{ "thought": "...", "tool": "...", "arguments": { ... } }`.
- **Markdown Code Fences**: Strips surrounding ` ```json ... ``` ` blocks.
- **ReAct Syntax**: Parses standard `Thought: ... / Action: ... / Action Input: ...` blocks.
- **Graceful Degradation**: Never raises unhandled parsing exceptions; returns structured error feedback back to the agent loop to ask for re-formatting.

---

## 7. Frontend Developer Workspace

The frontend is designed as a modern, high-grade developer workspace providing complete visibility into the agent's internal thought process.

### Key Workspace Features:
- **Dynamic Task Composer**: Clean input field supporting natural language instructions and instant shortcut dispatch (`Ctrl + Enter`).
- **Interactive Execution Trace**:
  - Live progression indicator across `PLAN`, `ACT`, `OBSERVE`, and `REFLECT`.
  - Expandable Tool Call cards showing exact JSON arguments sent and outputs received.
  - Dedicated **Error & Recovery Indicators**: Highlighted in amber/red when an error happens, followed immediately by an emerald recovery card when the agent adapts.
- **Run Info Panel**: Displays active repository path, branch name, total step count, tools used breakdown, error count, and an active duration timer.
- **Recent Runs History**: Quick-load table allowing reviewers to replay past debugging sessions.
- **Apple Studio Aesthetic**: Subtle dark palette (`#000000` / `#1C1C1E`), fluid typography, tactile cursor physics, and responsive status badges.

---

## 8. Curated Demo Scenarios & Test Projects

The repository includes pre-packaged demo scenarios in `demo/` to demonstrate RepoPilot's autonomy live:

1. **`demo/projects/broken-login`**: A Python microservice where authentication fails due to a missing environment variable in JWT decoding. Demonstrates diagnosis, test execution, and code inspection.
2. **`demo/projects/broken-python`**: A calculation and syntax error scenario demonstrating AST validation and safe computation.
3. **`demo/projects/broken-api`**: An API gateway simulation with route timeout issues, demonstrating error capture and recovery.
4. **Pre-recorded Traces (`demo/scenarios/`)**:
   - `successful_debug.json`: Standard end-to-end bug fix.
   - `tool_failure.json`: Demonstration of tool parameter errors.
   - `recovery.json`: End-to-end demonstration of tool failure followed by autonomous self-correction.

---

## 9. Verification & Test Suite

The entire system is thoroughly tested using an automated test suite comprising **129 individual unit, adversarial, and integration tests**:

```bash
.venv\Scripts\pytest -v
# Result: 129 passed in 3.86 seconds
```

### Coverage Highlights:
- **Adversarial Security Tests**: Verified that path traversal attacks (`../../`), forbidden shell patterns (`rm -rf`, forkbombs), and malicious calculator injections (`__import__('os').system('ls')`) are strictly blocked.
- **Fault-Tolerance Tests**: Verified that unreadable files, missing parameters, division by zero, and non-zero exit codes produce clean observations and never crash the process.
- **Agent Loop Tests**: Verified multi-step cognitive execution, tool registry dispatch, memory trajectory preservation, and proper termination conditions.

---

## 10. Judge Presentation Cheat Sheet & FAQ

Use this section during your live demo to address questions with confidence:

### The 2-Minute Elevator Pitch:
> *"Judges, most AI coding assistants today are rigid wrappers—when a script hits a non-zero exit code or an unexpected file path, it crashes. We built RepoPilot under the motto **'Build the Brain, Not the Puppet'**.*  
> *We wrote our cognitive loop from scratch without heavy frameworks like LangChain. RepoPilot plans tasks, selects sandboxed tools autonomously, and when a tool fails or tests break, it treats that failure as an observation. It reflects on what happened, adjusts its plan, and tries another angle—just like an experienced human engineer. Everything is streamed live to an interactive developer UI with complete transparency."*

### Key Judge Questions & Confident Answers:

**Q: Why didn't you use LangChain, CrewAI, or AutoGen?**  
*Answer:*  
*"Third-party frameworks add unnecessary abstractions, bloated dependency trees, and rigid chaining patterns. By implementing our cognitive loop, memory buffer, and tool registry from first principles, we have full control over error encapsulation, token efficiency, and predictable async streaming to our UI."*

**Q: What happens if the agent enters an infinite loop trying to fix a bug?**  
*Answer:*  
*"We have two layers of protection: First, a hard max iteration ceiling (`max_iterations = 15`) prevents infinite cognitive cycles. Second, every tool invocation like `ShellTool` has a strict timeout (30 seconds), preventing hung processes or frozen servers."*

**Q: How do you prevent the agent from deleting files or running malicious commands?**  
*Answer:*  
*"All tools are strictly sandboxed. `FileTool` and `SearchTool` enforce path resolution strictly within the project root, rejecting any path traversal attempts (`../`). `ShellTool` features an explicit blocklist of destructive commands (`rm -rf`, formatting, forkbombs), and `CalculatorTool` parses Python AST strictly for numbers and operators, blocking arbitrary code execution or imports."*

**Q: How does the agent recover from a tool failure?**  
*Answer:*  
*"Instead of raising an unhandled exception, our tools catch errors and return a structured dictionary. The `AgentCore` recognizes the error status, writes it into memory, and triggers the `Planner.replan()` method. On the next cycle, the LLM reads the error message in its history and chooses an alternative tool or parameter."*
