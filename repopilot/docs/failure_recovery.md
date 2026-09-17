# Failure Recovery & Self-Correction

## Core Philosophy: Errors Are Observations

In traditional scripted systems ("puppets"), an unexpected error or non-zero exit code halts execution. In RepoPilot ("the brain"), an error is simply feedback from the environment.

## The Recovery Pipeline

```
[ Tool Execution Fails ] (e.g. Non-zero exit code, timeout, missing file)
           │
           ▼
[ Catch & Encapsulate ] ── Convert exception into structured ErrorObservation
           │
           ▼
[ Memory Injection ] ──── Feed error details into trajectory buffer
           │
           ▼
[ Reflective Analysis ] ── LLM assesses root cause:
                           * Was the command misspelled?
                           * Is a dependency missing?
                           * Is the file located elsewhere?
           │
           ▼
[ Re-plan & Adapt ] ───── Agent modifies strategy and executes alternative tool
```

## Recovery Scenarios Demonstrated

1. **Command Timeout**: Agent notices test process hung, reflects that a server fixture didn't terminate, and reruns tests with isolation flags.
2. **Missing Dependency**: Agent observes `ModuleNotFoundError`, installs or mocks the dependency, and re-executes.
3. **Invalid File Path**: Agent observes `FileNotFoundError`, invokes directory listing to locate the correct file, and resumes inspection.
