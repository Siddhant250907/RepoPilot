/**
 * TaskInput Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Accept user task description and repository path.
 * - Dispatch submission to parent component.
 *
 * TODO:
 * - Implement form validation and quick scenario selector presets.
 */

import React, { useState } from 'react';

export default function TaskInput({ onSubmit, disabled }) {
  const [task, setTask] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (task.trim() && !disabled) {
      onSubmit(task);
    }
  };

  return (
    <form className="task-input-form" onSubmit={handleSubmit}>
      <label htmlFor="task-input">Describe Repository Debugging Goal:</label>
      <textarea
        id="task-input"
        rows={3}
        placeholder="e.g. Investigate broken login handler in auth service and fix the token expiration bug..."
        value={task}
        onChange={(e) => setTask(e.target.value)}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !task.trim()}>
        {disabled ? 'Agent Running...' : 'Deploy RepoPilot'}
      </button>
    </form>
  );
}
