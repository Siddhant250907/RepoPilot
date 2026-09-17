/**
 * ErrorCard Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Visually distinguish failures from normal events.
 * - Clearly show:
 *   TOOL FAILURE
 *   Tool: <tool>
 *   Error: <error>
 * - Show optional agent reflection / recovery plan.
 */

import React from 'react';

export default function ErrorCard({
  tool = 'shell',
  error = 'Execution failed with non-zero exit status',
  recoveryPlan,
  data,
}) {
  // Normalize props from direct props or payload data object
  const resolvedTool = data?.tool || data?.toolName || tool;
  const resolvedError = data?.error || data?.message || data?.output || error;
  const resolvedRecovery = data?.recoveryPlan || data?.recovery || recoveryPlan;

  return (
    <div className="error-card-component" role="alert">
      <div className="error-card-header">
        <div className="error-card-title">
          <span className="error-badge-icon" aria-hidden="true">❌</span>
          <span className="error-badge-text">TOOL FAILURE</span>
        </div>
        <span className="error-severity-tag">FAILURE DETECTED</span>
      </div>

      <div className="error-card-body">
        <div className="error-field">
          <span className="field-label">Tool:</span>
          <span className="field-value tool-name-val">{resolvedTool}</span>
        </div>

        <div className="error-field">
          <span className="field-label">Error:</span>
          <div className="field-value error-message-box">
            <pre className="error-pre">{resolvedError}</pre>
          </div>
        </div>

        {resolvedRecovery && (
          <div className="error-recovery-box">
            <span className="recovery-label">
              <span className="recovery-icon">💡</span>
              Reflective Recovery:
            </span>
            <p className="recovery-text">{resolvedRecovery}</p>
          </div>
        )}
      </div>
    </div>
  );
}
