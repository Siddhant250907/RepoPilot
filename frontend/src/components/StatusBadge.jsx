/**
 * StatusBadge Component.
 *
 * Displays cognitive execution state with Lucide icons, pulsing indicator,
 * and semantic color accents.
 */

import React from 'react';
import { 
  Brain, 
  Terminal, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  CircleDot,
  Loader2
} from 'lucide-react';

const STATUS_CONFIGS = {
  READY: {
    label: 'READY',
    icon: <CircleDot size={13} />,
    className: 'status-idle',
    description: 'Ready for investigation task',
  },
  RUNNING: {
    label: 'RUNNING',
    icon: <Loader2 size={13} className="spin" />,
    className: 'status-executing',
    description: 'Autonomous AgentCore execution running',
    pulsing: true,
  },
  IDLE: {
    label: 'READY',
    icon: <CircleDot size={13} />,
    className: 'status-idle',
    description: 'Awaiting task input',
  },
  PLANNING: {
    label: 'PLANNING',
    icon: <Brain size={13} />,
    className: 'status-planning',
    description: 'Decomposing task into sub-goals',
    pulsing: true,
  },
  EXECUTING: {
    label: 'EXECUTING',
    icon: <Terminal size={13} />,
    className: 'status-executing',
    description: 'Dispatching tool invocation',
    pulsing: true,
  },
  OBSERVING: {
    label: 'OBSERVING',
    icon: <Eye size={13} />,
    className: 'status-observing',
    description: 'Analyzing tool execution output',
    pulsing: true,
  },
  RECOVERING: {
    label: 'RECOVERING',
    icon: <RotateCcw size={13} />,
    className: 'status-recovering',
    description: 'Reflecting on failure & adjusting plan',
    pulsing: true,
  },
  REFLECTING: {
    label: 'REFLECTING',
    icon: <Brain size={13} />,
    className: 'status-recovering',
    description: 'Reflecting on cognitive outcome',
    pulsing: true,
  },
  COMPLETED: {
    label: 'COMPLETED',
    icon: <CheckCircle2 size={13} />,
    className: 'status-completed',
    description: 'Task verified & completed',
  },
  FAILED: {
    label: 'FAILED',
    icon: <XCircle size={13} />,
    className: 'status-failed',
    description: 'Agent reached unrecoverable state',
  },
};

export default function StatusBadge({ status = 'IDLE' }) {
  const normalizedKey = (status || 'IDLE').toUpperCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: normalizedKey,
    icon: <CircleDot size={13} />,
    className: 'status-default',
    description: 'Current agent state',
  };

  return (
    <div
      className={`status-badge-container ${config.className}`}
      title={config.description}
      role="status"
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
