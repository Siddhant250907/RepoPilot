/**
 * TaskInput Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Accept repository path/input and task description.
 * - Trigger onRun({ repository, task }) callback.
 * - Provide hackathon-friendly quick preset examples.
 */

import React, { useState } from 'react';

const PRESETS = [
  {
    name: 'Broken Login (HTTP 500)',
    repo: 'demo/projects/broken-login',
    task: 'Fix the login API returning HTTP 500 due to unhandled NoneType in JWT payload validation.'
  },
  {
    name: 'Off-By-One Index Bug',
    repo: 'demo/projects/calculator-cli',
    task: 'Resolve IndexError in array token parser during multi-operator expression evaluation.'
  },
  {
    name: 'Memory Leak in Event Loop',
    repo: 'demo/projects/socket-gateway',
    task: 'Investigate unbound connection listeners causing slow memory creep under load.'
  }
];

export default function TaskInput({ onRun, disabled = false }) {
  const [repository, setRepository] = useState('demo/projects/broken-login');
  const [task, setTask] = useState('Fix the login API returning HTTP 500.');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!repository.trim() || !task.trim() || disabled) return;

    if (onRun) {
      onRun({
        repository: repository.trim(),
        task: task.trim(),
      });
    }
  };

  const handleApplyPreset = (preset) => {
    if (disabled) return;
    setRepository(preset.repo);
    setTask(preset.task);
  };

  return (
    <div className="task-input-container">
      <div className="task-input-header">
        <div className="task-input-title">
          <span className="section-icon">🎯</span>
          <h3>Target Repository & Debugging Objective</h3>
        </div>
        <div className="preset-selector">
          <span className="preset-label">Quick Scenarios:</span>
          <div className="preset-buttons">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="preset-btn"
                onClick={() => handleApplyPreset(p)}
                disabled={disabled}
                title={p.task}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form className="task-input-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="repo-input">
            <span className="field-icon">📁</span>
            Target Repository Path
          </label>
          <input
            id="repo-input"
            type="text"
            className="text-input"
            placeholder="e.g. demo/projects/broken-login or https://github.com/org/repo"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="task-textarea">
            <span className="field-icon">📝</span>
            Task Description & Error Symptoms
          </label>
          <textarea
            id="task-textarea"
            rows={3}
            className="textarea-input"
            placeholder="e.g. Fix the login API returning HTTP 500. Run pytest to reproduce and verify the fix."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={disabled}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="run-agent-btn"
            disabled={disabled || !repository.trim() || !task.trim()}
          >
            <span className="btn-icon">⚡</span>
            {disabled ? 'Agent Running...' : 'RUN AGENT'}
          </button>
        </div>
      </form>
    </div>
  );
}
