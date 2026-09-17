/**
 * RepoPilot API Service Layer.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Handle HTTP REST and SSE/WebSocket communication with FastAPI backend.
 * - Clean contract for Person 1 (AgentCore) and Person 2 (Tools).
 * - Honest error handling when backend server is offline or unreachable.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Submit a repository debugging task to the backend.
 *
 * @param {Object} params
 * @param {string} params.repository - Target repository path or URL
 * @param {string} params.task - Description of the debugging objective
 * @returns {Promise<{taskId: string, status: string, message: string}>}
 */
export async function submitTask({ repository, task }) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task,
        target_repo_path: repository,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Backend returned error ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (err) {
    console.warn('[API Service] Backend dispatch unreachable:', err.message);
    throw err;
  }
}

/**
 * Poll current task status from the backend.
 *
 * @param {string} taskId
 * @returns {Promise<{taskId: string, status: string, message: string, result?: any}>}
 */
export async function getTaskStatus(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for task ${taskId}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Subscribe to live agent cognitive trace streaming via Server-Sent Events (SSE).
 *
 * @param {string} taskId
 * @param {function(Object): void} onEvent - Callback for each trace event
 * @param {function(Error): void} onError - Callback for stream errors
 * @returns {function(): void} Cleanup unsubscribe function
 */
export function subscribeToTaskEvents(taskId, onEvent, onError) {
  const sseUrl = `${API_BASE_URL}/tasks/${taskId}/events`;
  const eventSource = new EventSource(sseUrl);

  eventSource.onmessage = (e) => {
    try {
      const eventData = JSON.parse(e.data);
      if (onEvent) onEvent(eventData);
    } catch (err) {
      console.error('[API Service] Failed to parse SSE event data:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('[API Service] EventSource encountered an error:', err);
    if (onError) onError(err);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
}
