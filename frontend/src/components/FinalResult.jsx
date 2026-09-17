/**
 * FinalResult Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Display conclusive resolution, summary of fixes, and modified files list.
 *
 * TODO:
 * - Add diff viewer integration for modified files.
 */

import React from 'react';

export default function FinalResult({ result = {} }) {
  return (
    <div className="final-result-card">
      <h3>Task Resolution</h3>
      <p className="result-summary">{result.summary || 'Task completed successfully.'}</p>
      {result.filesModified?.length > 0 && (
        <div className="modified-files">
          <label>Modified Files:</label>
          <ul>
            {result.filesModified.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
