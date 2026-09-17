# Hackathon Demonstration Flow

## Track: "BUILD THE BRAIN, NOT THE PUPPET"

The demo showcases RepoPilot resolving real-world bugs autonomously without hardcoded scripts.

## Demonstration Phases

### 1. The Broken Repository
- Introduce one of the curated demo repositories (e.g. `demo/projects/broken-python/` or `broken-login/`).
- Demonstrate the bug by running `pytest` or `npm test` from the terminal (observe failure).

### 2. Launching RepoPilot
- Open the RepoPilot UI (`frontend/`).
- Enter the debugging prompt: *"Investigate why tests are failing and fix the root cause."*
- Click **Deploy RepoPilot**.

### 3. Visualizing the Cognitive Trace
- Watch the live stream of events in the **Agent Cognitive Trace**:
  - **PLAN**: Agent plans initial investigation.
  - **ACT**: Agent invokes `shell_tool` to run the test suite.
  - **OBSERVE**: Agent inspects the test failure stack trace.
  - **REFLECT**: Agent identifies the offending file and line.
  - **ACT**: Agent inspects the code with `file_tool`.
  - **ACT**: Agent repairs the code.
  - **ACT**: Agent reruns tests to verify the fix passes.

### 4. Demonstrating Failure Recovery
- Trigger a scenario where an initial tool fails (e.g. `demo/scenarios/recovery.json`).
- Highlight how RepoPilot does not crash, but reflects on the error card and adapts its plan autonomously.

### 5. Final Resolution
- Review the **FinalResult** card displaying the summary of changes, verified passing test output, and list of modified files.
