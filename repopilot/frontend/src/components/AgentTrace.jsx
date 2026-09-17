/**
 * AgentTrace Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Render sequential step trace of agent execution: PLAN, ACT, OBSERVE, REFLECT.
 * - Render ToolCall and ErrorCard components for corresponding steps.
 *
 * TODO:
 * - Implement auto-scroll to newest step.
 * - Add filter toggle for verbose tool outputs.
 */

import React from 'react';
import ToolCall from './ToolCall.jsx';
import ErrorCard from './ErrorCard.jsx';

export default function AgentTrace({ events = [] }) {
  if (!events.length) {
    return (
      <div className="trace-empty">
        <p>No active agent trajectory. Submit a task to visualize the cognitive loop in real time.</p>
      </div>
    );
  }

  return (
    <div className="agent-trace-list">
      {events.map((event, idx) => (
        <div key={idx} className={`trace-step stage-${event.stage?.toLowerCase()}`}>
          <div className="step-header">
            <span className="step-number">Step #{event.step || idx + 1}</span>
            <span className="step-stage">{event.stage}</span>
          </div>
          <div className="step-body">
            {event.type === 'tool_call' && <ToolCall data={event.payload} />}
            {event.type === 'error' && <ErrorCard data={event.payload} />}
            {event.type === 'text' && <p>{event.content}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
