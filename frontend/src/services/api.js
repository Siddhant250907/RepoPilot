/**
 * RepoPilot API Service Layer.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Handle HTTP REST communication with FastAPI backend.
 * - Call real AgentCore endpoints (POST /api/agent/run, POST /api/tasks).
 * - Clean contract for Person 1 (AgentCore) and Person 2 (Tools).
 * - Honest error handling when backend server is offline or returns error.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Execute real AgentCore with live Gemini model and default tools.
 *
 * @param {Object} params
 * @param {string} params.task - Description of the debugging or investigation task
 * @param {string} [params.repository] - Optional repository path or context
 * @param {number} [params.maxSteps=10] - Maximum cognitive loop steps
 * @returns {Promise<{status: string, events: Array<Object>, final_answer: string, trajectory?: Array<Object>}>}
 */
export async function runAgentTask({ task, repository, maxSteps = 10 }) {
  try {
    const response = await fetch(`${API_BASE_URL}/agent/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task,
        target_repo_path: repository,
        max_steps: maxSteps,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.detail ||
        `Backend API returned HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    return await response.json();
  } catch (err) {
    console.error('[API Service] runAgentTask error:', err.message);
    throw err;
  }
}

/**
 * Submit a repository debugging task to the backend /tasks endpoint.
 *
 * @param {Object} params
 * @param {string} params.repository - Target repository path or URL
 * @param {string} params.task - Description of the debugging objective
 * @returns {Promise<{task_id: string, status: string, message: string, result?: string}>}
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
 * @returns {Promise<{task_id: string, status: string, message: string, result?: any}>}
 */
export async function getTaskStatus(taskId) {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch status for task ${taskId}: ${response.statusText}`);
  }
  return await response.json();
}

/**
 * Check health of backend service.
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
    const res = await fetch(`${rootUrl}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}
