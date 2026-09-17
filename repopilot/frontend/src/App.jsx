/**
 * RepoPilot Main Application Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Render top-level layout, task submission form, and live agent execution trace.
 * - Manage active task state and streaming event connection.
 *
 * TODO:
 * - Connect to backend SSE / WebSocket API.
 * - Integrate child components (TaskInput, AgentTrace, FinalResult).
 */

import React, { useState } from 'react';
import TaskInput from './components/TaskInput.jsx';
import AgentTrace from './components/AgentTrace.jsx';
import FinalResult from './components/FinalResult.jsx';
import StatusBadge from './components/StatusBadge.jsx';

export default function App() {
  const [taskStatus, setTaskStatus] = useState('idle'); // idle, running, completed, error
  const [traceEvents, setTraceEvents] = useState([]);
  const [finalResult, setFinalResult] = useState(null);

  const handleTaskSubmit = (taskDescription) => {
    // TODO: Person 3 will wire this to backend API
    console.log('Submitting task:', taskDescription);
    setTaskStatus('running');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-brand">
          <h1>RepoPilot</h1>
          <span className="track-tag">Track: Build the Brain, Not the Puppet</span>
        </div>
        <StatusBadge status={taskStatus} />
      </header>

      <main className="app-main">
        <section className="input-section">
          <TaskInput onSubmit={handleTaskSubmit} disabled={taskStatus === 'running'} />
        </section>

        <section className="trace-section">
          <h2>Agent Cognitive Trace</h2>
          <AgentTrace events={traceEvents} />
        </section>

        {finalResult && (
          <section className="result-section">
            <FinalResult result={finalResult} />
          </section>
        )}
      </main>
    </div>
  );
}
