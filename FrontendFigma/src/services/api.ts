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
        max_steps: max_steps || 15,
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

export interface CodeDebugParams {
  code: string;
  language?: string;
  error_message?: string;
  context?: string;
}

export interface CodeDebugResult {
  status: 'success' | 'error';
  detected_language: string;
  bug_summary: string;
  root_cause: string;
  debugged_code: string;
  diff?: string | null;
  changes_explained: string[];
  tips?: string[];
  error?: string | null;
}

/**
 * Sends a code snippet from ANY language to RepoPilot for instant diagnosis, root-cause
 * analysis, production-ready debugged code, and unified diff output.
 */
export async function debugCodeSnippet({
  code,
  language = 'auto',
  error_message,
  context,
}: CodeDebugParams): Promise<CodeDebugResult> {
  const trimmedCode = code?.trim();
  if (!trimmedCode) {
    throw new Error('Code snippet cannot be empty.');
  }

  let response: Response;
  try {
    response = await fetch('/api/debug/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: trimmedCode,
        language: language || 'auto',
        error_message: error_message?.trim() || null,
        context: context?.trim() || null,
      }),
    });
  } catch (networkErr: any) {
    throw new Error(
      `Network error communicating with RepoPilot backend: ${networkErr?.message || 'Server unreachable'}. Please verify FastAPI is running.`
    );
  }

  let data: any;
  try {
    const text = await response.text();
    data = JSON.parse(text);
  } catch (parseErr) {
    throw new Error(`Failed to parse backend response (HTTP ${response.status})`);
  }

  if (!response.ok || data.status === 'error') {
    throw new Error(data?.detail || data?.error || `Debugging failed with HTTP ${response.status}`);
  }

  return data as CodeDebugResult;
}

export interface UserRepoMetadata {
  id: string;
  name: string;
  path: string;
  branch: string;
  description: string;
  techStack: string;
  badge: string;
  badgeColor: string;
  recommendedPreset: string;
}

/**
 * Upload a .zip repository archive to the backend.
 */
export async function uploadRepositoryArchive(file: File, name?: string): Promise<UserRepoMetadata> {
  const formData = new FormData();
  formData.append('file', file);
  if (name?.trim()) {
    formData.append('name', name.trim());
  }

  let response: Response;
  try {
    response = await fetch('/api/repos/upload', {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    throw new Error(`Failed to upload repository archive: ${err?.message || 'Network error'}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Upload failed (HTTP ${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.detail) msg = parsed.detail;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Upload a repository folder (directory containing multiple files) to the backend.
 */
export async function uploadRepositoryFolder(files: FileList | File[], folderName?: string): Promise<UserRepoMetadata> {
  const formData = new FormData();
  let baseFolder = folderName?.trim() || '';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = (file as any).webkitRelativePath || file.name;
    // Skip massive dependency and cache folders
    if (
      relPath.includes('node_modules/') ||
      relPath.includes('.git/') ||
      relPath.includes('__pycache__/') ||
      relPath.includes('.venv/') ||
      relPath.includes('/venv/')
    ) {
      continue;
    }
    if (!baseFolder && relPath.includes('/')) {
      baseFolder = relPath.split('/')[0];
    }
    formData.append('files', file);
    formData.append('paths', relPath);
  }

  if (baseFolder) {
    formData.append('name', baseFolder);
  }

  let response: Response;
  try {
    response = await fetch('/api/repos/upload-folder', {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    throw new Error(`Failed to upload repository folder: ${err?.message || 'Network error'}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Folder upload failed (HTTP ${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.detail) msg = parsed.detail;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * Connect an existing local directory as a target repository.
 */
export async function connectLocalDirectory(localPath: string, name?: string): Promise<UserRepoMetadata> {
  let response: Response;
  try {
    response = await fetch('/api/repos/connect-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ local_path: localPath.trim(), name: name?.trim() || null }),
    });
  } catch (err: any) {
    throw new Error(`Failed to connect local directory: ${err?.message || 'Network error'}`);
  }

  if (!response.ok) {
    const errText = await response.text();
    let msg = `Connection failed (HTTP ${response.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.detail) msg = parsed.detail;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * List previously uploaded user repositories.
 */
export async function fetchUserRepositories(): Promise<UserRepoMetadata[]> {
  try {
    const response = await fetch('/api/repos/user-repos');
    if (!response.ok) return [];
    const data = await response.json();
    return data.repositories || [];
  } catch {
    return [];
  }
}

