# RepoPilot Demo Scenarios & Test Projects

This directory contains test artifacts for demonstrating RepoPilot at the hackathon.

## Test Projects (`projects/`)

1. **`broken-login/`**: A web application project with a broken authentication token flow.
2. **`broken-python/`**: A standalone Python CLI utility with syntax, import, and logic bugs.
3. **`broken-api/`**: A REST API service with route configuration and schema mismatch errors.

## Recorded Trace Scenarios (`scenarios/`)

1. **`successful_debug.json`**: Execution trace of a clean, multi-step debugging workflow where RepoPilot explores files, runs tests, fixes a bug, and validates the resolution.
2. **`tool_failure.json`**: Execution trace highlighting tool-level failure (e.g. shell timeout or invalid path).
3. **`recovery.json`**: Execution trace demonstrating autonomous recovery: RepoPilot observes an error from a tool, reflects on the cause, adapts its plan, and succeeds.
