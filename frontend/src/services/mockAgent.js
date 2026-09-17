/**
 * RepoPilot Mock Agent Service.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Progressive timer-based simulation of RepoPilot autonomous cognitive loop.
 * - Supports scenarios:
 *   1. "Tool Failure Recovery" (PLAN -> TOOL -> RESULT -> ERROR -> REFLECT -> TOOL -> SUCCESS -> FINAL)
 *   2. "Successful Debug" (Direct resolution without tool failure)
 * - Transitions through states: IDLE -> PLANNING -> EXECUTING -> OBSERVING -> RECOVERING -> EXECUTING -> COMPLETED
 * - Clean cancellation support to prevent leaks or orphaned timers.
 */

export const SCENARIOS = {
  FAILURE_RECOVERY: 'Tool Failure Recovery',
  SUCCESSFUL_DEBUG: 'Successful Debug',
};

export const MOCK_SCENARIO_EVENTS = {
  [SCENARIOS.FAILURE_RECOVERY]: [
    {
      step: 1,
      type: 'plan',
      status: 'PLANNING',
      message: 'I need to inspect the repository before reproducing the issue.',
      subgoals: [
        'Inspect entrypoint app.py for login route handler',
        'Execute reproduction test suite via pytest',
        'Identify root cause of unexpected HTTP 500 error',
      ],
      timestamp: '00:00:00',
    },
    {
      step: 2,
      type: 'tool_call',
      tool: 'file_reader',
      arguments: {
        path: 'app.py',
      },
      status: 'EXECUTING',
      timestamp: '00:00:01',
    },
    {
      step: 3,
      type: 'tool_result',
      tool: 'file_reader',
      status: 'OBSERVING',
      data: 'Found login endpoint in app.py:\n  @app.route("/login", methods=["POST"])\n  def login():\n      token = auth_service.generate_token(request.json)\n      return jsonify(token=token)',
      timestamp: '00:00:02',
    },
    {
      step: 4,
      type: 'tool_call',
      tool: 'shell',
      arguments: {
        command: 'pytest',
      },
      status: 'EXECUTING',
      timestamp: '00:00:03',
    },
    {
      step: 5,
      type: 'tool_result',
      tool: 'shell',
      status: 'RECOVERING', // triggers recovering cognitive phase
      error: '2 tests failed\nFAILED tests/test_auth.py::test_jwt_login - KeyError: \'secret_key\'\nFAILED tests/test_auth.py::test_invalid_token - AssertionError: Expected 401, got 500',
      recoveryPlan: 'The tests failed because secret_key is missing from the active config. I will inspect config.py and provide default configuration fallback.',
      timestamp: '00:00:04',
    },
    {
      step: 6,
      type: 'reflection',
      status: 'RECOVERING',
      message: 'The tests indicate an authentication problem. I will inspect the relevant configuration.',
      hypothesis: 'Missing default configuration in config.py is causing KeyError in auth_service.',
      timestamp: '00:00:05',
    },
    {
      step: 7,
      type: 'tool_call',
      tool: 'file_reader',
      arguments: {
        path: 'config.py',
      },
      status: 'EXECUTING',
      timestamp: '00:00:06',
    },
    {
      step: 8,
      type: 'tool_call',
      tool: 'shell',
      arguments: {
        command: 'pytest',
      },
      status: 'EXECUTING',
      timestamp: '00:00:07',
    },
    {
      step: 9,
      type: 'tool_result',
      tool: 'shell',
      status: 'OBSERVING',
      data: '============================= 5 passed in 0.18s =============================\ntests/test_auth.py::test_jwt_login PASSED                           [ 20%]\ntests/test_auth.py::test_invalid_token PASSED                        [ 40%]\ntests/test_auth.py::test_token_expiry PASSED                         [ 60%]\ntests/test_user.py::test_user_lookup PASSED                          [ 80%]\ntests/test_api.py::test_healthcheck PASSED                           [100%]',
      timestamp: '00:00:08',
    },
    {
      step: 10,
      type: 'final',
      status: 'COMPLETED',
      message: 'The login API bug was fixed and all tests pass.',
      verification: {
        command: 'pytest',
        status: '5 PASSED',
        testsPassed: 5,
        notes: 'Root cause resolved by adding configuration fallback in config.py. 0 regressions.',
      },
      filesModified: [
        { path: 'config.py', changes: '+4 -1 lines' },
        { path: 'app.py', changes: '+2 -0 lines' },
      ],
      timestamp: '00:00:09',
    },
  ],

  [SCENARIOS.SUCCESSFUL_DEBUG]: [
    {
      step: 1,
      type: 'plan',
      status: 'PLANNING',
      message: 'Analyze off-by-one boundary bug in calculator CLI tokenizer.',
      subgoals: [
        'Inspect parser.py token scanning loop',
        'Run expression evaluation tests to verify fix',
      ],
      timestamp: '00:00:00',
    },
    {
      step: 2,
      type: 'tool_call',
      tool: 'file_reader',
      arguments: {
        path: 'parser.py',
      },
      status: 'EXECUTING',
      timestamp: '00:00:01',
    },
    {
      step: 3,
      type: 'tool_result',
      tool: 'file_reader',
      status: 'OBSERVING',
      data: 'Found token scanning loop:\n  for i in range(len(tokens) - 1):  # BUG: skips terminal token',
      timestamp: '00:00:02',
    },
    {
      step: 4,
      type: 'tool_call',
      tool: 'file_writer',
      arguments: {
        path: 'parser.py',
        patch: 'for i in range(len(tokens)):',
      },
      status: 'EXECUTING',
      timestamp: '00:00:03',
    },
    {
      step: 5,
      type: 'tool_result',
      tool: 'file_writer',
      status: 'OBSERVING',
      data: 'Patch successfully applied to parser.py line 42.',
      timestamp: '00:00:04',
    },
    {
      step: 6,
      type: 'tool_call',
      tool: 'shell',
      arguments: {
        command: 'pytest tests/test_parser.py',
      },
      status: 'EXECUTING',
      timestamp: '00:00:05',
    },
    {
      step: 7,
      type: 'tool_result',
      tool: 'shell',
      status: 'OBSERVING',
      data: '============================= 4 passed in 0.08s =============================\ntests/test_parser.py::test_simple_expression PASSED                  [ 25%]\ntests/test_parser.py::test_multi_operator PASSED                      [ 50%]\ntests/test_parser.py::test_parentheses PASSED                         [ 75%]\ntests/test_parser.py::test_boundary_conditions PASSED                [100%]',
      timestamp: '00:00:06',
    },
    {
      step: 8,
      type: 'final',
      status: 'COMPLETED',
      message: 'Off-by-one token boundary issue resolved. All expression evaluation tests pass.',
      verification: {
        command: 'pytest tests/test_parser.py',
        status: '4 PASSED',
        testsPassed: 4,
        notes: 'Terminal token now evaluated properly without IndexError.',
      },
      filesModified: [
        { path: 'parser.py', changes: '+1 -1 lines' },
      ],
      timestamp: '00:00:07',
    },
  ],
};

/**
 * Run progressive timer-based mock simulation.
 *
 * @param {Object} options
 * @param {string} options.scenario - Key from SCENARIOS
 * @param {number} [options.intervalMs=1000] - Delay between events in milliseconds
 * @param {function(Object): void} options.onEvent - Called when a new event arrives
 * @param {function(string): void} options.onStatusChange - Called when status transitions
 * @param {function(Object): void} options.onComplete - Called when final event is reached
 * @returns {function(): void} Cancel function to abort running simulation
 */
export function runMockAgentSimulation({
  scenario = SCENARIOS.FAILURE_RECOVERY,
  intervalMs = 1000,
  onEvent,
  onStatusChange,
  onComplete,
}) {
  const events = MOCK_SCENARIO_EVENTS[scenario] || MOCK_SCENARIO_EVENTS[SCENARIOS.FAILURE_RECOVERY];
  let currentIndex = 0;
  let timerId = null;
  let isCancelled = false;

  // Initial step at 0s:
  const firstEvent = events[0];
  if (firstEvent) {
    if (onStatusChange) onStatusChange(firstEvent.status || 'PLANNING');
    if (onEvent) onEvent(firstEvent);
    currentIndex = 1;
  }

  function scheduleNext() {
    if (isCancelled) return;
    if (currentIndex >= events.length) {
      if (onStatusChange) onStatusChange('COMPLETED');
      const finalEvent = events[events.length - 1];
      if (onComplete) onComplete(finalEvent);
      return;
    }

    timerId = setTimeout(() => {
      if (isCancelled) return;
      const event = events[currentIndex];

      // Update status corresponding to current cognitive step
      if (onStatusChange && event.status) {
        onStatusChange(event.status);
      }

      // Dispatch event
      if (onEvent) {
        onEvent(event);
      }

      currentIndex += 1;

      // If this was the final step, complete
      if (currentIndex >= events.length) {
        if (onStatusChange) onStatusChange('COMPLETED');
        if (onComplete) onComplete(event);
      } else {
        scheduleNext();
      }
    }, intervalMs);
  }

  scheduleNext();

  return () => {
    isCancelled = true;
    if (timerId) clearTimeout(timerId);
  };
}
