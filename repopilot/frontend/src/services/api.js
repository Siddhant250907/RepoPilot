/**
 * API Service for Backend Communication.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Send task submission requests to FastAPI.
 * - Establish EventSource or WebSocket connection for live agent trace streaming.
 *
 * TODO:
 * - Implement reconnect logic for streaming traces.
 */

const API_BASE = '/api';

export async function submitTask(taskDescription) {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: taskDescription }),
  });
  if (!response.ok) {
    throw new Error(`Failed to submit task: ${response.statusText}`);
  }
  return response.json();
}

export function subscribeToTaskEvents(taskId, onEvent, onError) {
  // TODO: Person 3 will wire up SSE / WebSocket stream
  const eventSource = new EventSource(`${API_BASE}/tasks/${taskId}/events`);
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch (err) {
      console.error('Failed to parse event data:', err);
    }
  };
  eventSource.onerror = (err) => {
    if (onError) onError(err);
    eventSource.close();
  };
  return () => eventSource.close();
}
