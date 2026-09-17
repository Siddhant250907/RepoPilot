# Cognitive Agent Loop

## The 5-Stage Reasoning Cycle

RepoPilot implements an autonomous cognitive loop built from scratch:

```
      [ USER TASK ]
            │
            ▼
     ┌─────────────┐
 ┌───►    PLAN     │ ── Formulate or adjust tactical sub-goals
 │   └──────┬──────┘
 │          │
 │          ▼
 │   ┌─────────────┐
 │   │     ACT     │ ── Autonomous LLM tool selection & argument generation
 │   └──────┬──────┘
 │          │
 │          ▼
 │   ┌─────────────┐
 │   │   OBSERVE   │ ── Capture raw output or execution error as observation
 │   └──────┬──────┘
 │          │
 │          ▼
 │   ┌─────────────┐
 │   │   REFLECT   │ ── Evaluate progress against goal; determine if replanning is needed
 │   └──────┬──────┘
 │          │
 │          ▼
 └─── [ REPEAT / DONE ] ── Continue until task solved or terminal condition met
```

### 1. PLAN
The agent analyzes the overall user goal alongside the trajectory history in memory. It maintains an active sub-task plan and decides whether the current step requires gathering information, executing a test, or making a code modification.

### 2. ACT
Based on the plan, the LLM autonomously determines the next tool to execute. Tool routing is never hardcoded. The agent emits a structured tool invocation containing the target tool name and validated arguments.

### 3. OBSERVE
The selected tool executes within its sandboxed boundary. Any resulting stdout, stderr, exception, or timeout is captured into a structured `Observation`. Crucially, tool failures never crash the agent; they become informative observations.

### 4. REFLECT
The agent critically reflects on the observation:
- Did the tool produce the expected outcome?
- Did an error occur, and what does it reveal about the system state?
- Does the active plan need adjustment (adaptive replanning)?

### 5. REPEAT
If the goal is achieved, the agent transitions to final answer synthesis. Otherwise, it updates memory and proceeds to the next cycle.
