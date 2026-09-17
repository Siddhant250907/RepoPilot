/**
 * ErrorCard Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Highlight tool execution errors, timeouts, or exceptions.
 * - Display agent reflection and recovery reasoning.
 *
 * TODO:
 * - Distinguish between transient tool errors and fatal task errors.
 */

import React from 'react';

export default function ErrorCard({ data = {} }) {
  return (
    <div className="error-card">
      <div className="error-header">
        <span className="error-badge">OBSERVATION / ERROR</span>
        <strong>{data.errorType || 'Tool Execution Error'}</strong>
      </div>
      <p className="error-message">{data.message || 'An unexpected failure occurred during tool execution.'}</p>
      {data.recoveryPlan && (
        <div className="error-recovery">
          <label>Reflection & Recovery Action:</label>
          <p>{data.recoveryPlan}</p>
        </div>
      )}
    </div>
  );
}
