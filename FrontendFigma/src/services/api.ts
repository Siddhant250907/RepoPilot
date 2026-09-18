/**
 * RepoPilot Frontend API Service.
 *
 * Connects the Figma frontend directly to the FastAPI backend
 * via Vite's local dev server proxy (/api -> http://localhost:8000/api).
 *
 * Contract matches backend/api/schemas.py (AgentRunRequest / AgentRunResponse).
 */

export interface AgentRunParams {
  task: string;
  target_repo_path?: string | null;
  max_steps?: number;
}

export interface BackendEvent {
  step: number;
  type: 'plan' | 'tool_call' | 'tool_result' | 'reflection' | 'final' | string;
  tool?: string;
  arguments?: Record<string, any>;
  thought?: string;
  status?: 'success' | 'error' | string;
  error?: string | null;
  data?: string;
  message?: string;
  summary?: string;
  detail?: string;
  timestamp?: string;
}

export interface AgentRunResponse {
  status: 'completed' | 'failed' | string;
  events: BackendEvent[];
  final_answer: string;
  trajectory?: Array<Record<string, any>> | null;
}

export interface HealthResponse {
  status: string;
  service?: string;
  environment?: string;
}

/**
 * Executes a coding/debugging task by sending it to the RepoPilot backend AgentCore.
 * The backend autonomously selects the appropriate tools using Gemini.
 */
export async function runAgentTask({
  task,
  target_repo_path = null,
  max_steps = 15,
}: AgentRunParams): Promise<AgentRunResponse> {

  const trimmedTask = task?.trim();
  if (!trimmedTask) {
    throw new Error('Task description cannot be empty.');
  }

  let response: Response;
  try {
    response = await fetch('/api/agent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: trimmedTask,
        target_repo_path: target_repo_path ?? null,
        max_steps: max_steps ?? 10,
      }),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Network error communicating with RepoPilot backend: ${networkErr?.message || 'Server unreachable'}. Please verify FastAPI is running on port 8000.`
    );
  }

  let responseData: any;
  try {
    const rawText = await response.text();
    responseData = rawText ? JSON.parse(rawText) : {};
  } catch {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        `Backend server unreachable (HTTP ${response.status} Bad Gateway). Please make sure the FastAPI backend is running on port 8000: "python -m uvicorn backend.main:app --port 8000".`
      );
    }
    throw new Error(
      `Invalid response received from backend (HTTP ${response.status} ${response.statusText}).`
    );
  }

  if (!response.ok) {
    if (response.status === 502 || response.status === 504) {
      throw new Error(
        `Backend server unreachable (HTTP ${response.status} Bad Gateway). Please make sure the FastAPI backend is running on port 8000: "python -m uvicorn backend.main:app --port 8000".`
      );
    }
    const errorDetail =
      responseData?.detail ||
      responseData?.message ||
      `Backend error HTTP ${response.status}: ${response.statusText}`;
    throw new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
  }

  return responseData as AgentRunResponse;
}

/**
 * Checks connectivity and health of the FastAPI backend server.
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; data?: HealthResponse; error?: string }> {
  try {
    const response = await fetch('/health', { method: 'GET' });
    if (!response.ok) {
      return { ok: false, error: `Backend returned HTTP ${response.status}: ${response.statusText}` };
    }
    const data = await response.json().catch(() => ({ status: 'unknown' }));
    return { ok: true, data };
  } catch (err: any) {
    return {
      ok: false,
      error: `Cannot connect to backend: ${err?.message || 'Server offline'}.`,
    };
  }
}
