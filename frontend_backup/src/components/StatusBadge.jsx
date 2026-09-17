/**
 * StatusBadge Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Display agent cognitive execution status.
 * - Support statuses:
 *   IDLE, PLANNING, EXECUTING, OBSERVING, RECOVERING, COMPLETED, FAILED.
 */

import React from 'react';

const STATUS_CONFIGS = {
  IDLE: {
    label: 'IDLE',
    icon: '⚪',
    className: 'status-idle',
    description: 'Awaiting task input',
  },
  PLANNING: {
    label: 'PLANNING',
    icon: '🧠',
    className: 'status-planning',
    description: 'Decomposing task into sub-goals',
    pulsing: true,
  },
  EXECUTING: {
    label: 'EXECUTING',
    icon: '⚙️',
    className: 'status-executing',
    description: 'Dispatching tool invocation',
    pulsing: true,
  },
  OBSERVING: {
    label: 'OBSERVING',
    icon: '👁',
    className: 'status-observing',
    description: 'Analyzing tool execution feedback',
    pulsing: true,
  },
  RECOVERING: {
    label: 'RECOVERING',
    icon: '🔄',
    className: 'status-recovering',
    description: 'Reflecting on failure & adjusting plan',
    pulsing: true,
  },
  REFLECTING: {
    label: 'REFLECTING',
    icon: '🧠',
    className: 'status-recovering',
    description: 'Reflecting on cognitive outcome',
    pulsing: true,
  },
  COMPLETED: {
    label: 'COMPLETED',
    icon: '✅',
    className: 'status-completed',
    description: 'Task verified & completed',
  },
  FAILED: {
    label: 'FAILED',
    icon: '❌',
    className: 'status-failed',
    description: 'Agent reached unrecoverable state',
  },
};

export default function StatusBadge({ status = 'IDLE' }) {
  const normalizedKey = (status || 'IDLE').toUpperCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: normalizedKey,
    icon: '🔹',
    className: 'status-default',
    description: 'Unknown state',
  };

  return (
    <div
      className={`status-badge-container ${config.className}`}
      title={config.description}
    >
      <span className="status-indicator">
        {config.pulsing && <span className="status-pulse-ring"></span>}
        <span className="status-dot"></span>
      </span>
      <span className="status-icon" aria-hidden="true">{config.icon}</span>
      <span className="status-text">{config.label}</span>
    </div>
  );
}
