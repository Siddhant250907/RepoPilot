/**
 * FinalResult Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Display conclusive completion state.
 * - Prominently display:
 *   TASK COMPLETED
 *   Final response / fix summary
 *   Verification information if available.
 */

import React from 'react';

export default function FinalResult({
  response,
  summary,
  verification,
  filesModified,
  result,
}) {
  // Normalize props from direct props or result object
  const resolvedResponse =
    response ||
    summary ||
    result?.response ||
    result?.summary ||
    result?.message ||
    'Task resolved successfully by autonomous agent.';

  const resolvedVerification =
    verification ||
    result?.verification ||
    result?.verificationInfo ||
    null;

  const resolvedFiles =
    filesModified ||
    result?.filesModified ||
    result?.files ||
    [];

  return (
    <div className="final-result-container">
      <div className="final-result-header">
        <div className="final-result-title">
          <span className="success-badge-icon">✅</span>
          <div>
            <h3>TASK COMPLETED</h3>
            <span className="subtitle">Agent cognitive cycle finished with verified solution</span>
          </div>
        </div>
        <span className="status-pill-completed">VERIFIED RESOLUTION</span>
      </div>

      <div className="final-result-body">
        <div className="resolution-section">
          <h4 className="section-heading">
            <span className="heading-icon">📋</span>
            Final Agent Resolution
          </h4>
          <div className="resolution-content">
            <p>{resolvedResponse}</p>
          </div>
        </div>

        {resolvedVerification && (
          <div className="verification-section">
            <h4 className="section-heading">
              <span className="heading-icon">🛡️</span>
              Verification & Validation
            </h4>
            <div className="verification-details">
              {typeof resolvedVerification === 'string' ? (
                <pre className="verification-pre">{resolvedVerification}</pre>
              ) : (
                <div className="verification-grid">
                  {resolvedVerification.command && (
                    <div className="v-item">
                      <span className="v-label">Verification Command:</span>
                      <code>{resolvedVerification.command}</code>
                    </div>
                  )}
                  {resolvedVerification.status && (
                    <div className="v-item">
                      <span className="v-label">Suite Status:</span>
                      <span className="v-status-pass">{resolvedVerification.status}</span>
                    </div>
                  )}
                  {resolvedVerification.testsPassed !== undefined && (
                    <div className="v-item">
                      <span className="v-label">Tests Passed:</span>
                      <strong>{resolvedVerification.testsPassed} passed</strong>
                    </div>
                  )}
                  {resolvedVerification.notes && (
                    <div className="v-item full-width">
                      <span className="v-label">Verification Notes:</span>
                      <p>{resolvedVerification.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {resolvedFiles.length > 0 && (
          <div className="modified-files-section">
            <h4 className="section-heading">
              <span className="heading-icon">📝</span>
              Modified Files ({resolvedFiles.length})
            </h4>
            <ul className="modified-files-list">
              {resolvedFiles.map((file, idx) => (
                <li key={idx} className="file-item">
                  <span className="file-icon">📄</span>
                  <span className="file-path">{typeof file === 'string' ? file : file.path}</span>
                  {file.changes && <span className="file-changes">{file.changes}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
