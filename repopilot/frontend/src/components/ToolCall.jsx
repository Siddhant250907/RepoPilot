/**
 * ToolCall Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Display tool name, input arguments, and output preview.
 *
 * TODO:
 * - Add collapsible view for large outputs.
 */

import React from 'react';

export default function ToolCall({ data = {} }) {
  return (
    <div className="tool-call-card">
      <div className="tool-header">
        <span className="tool-badge">TOOL</span>
        <strong>{data.toolName || 'Unknown Tool'}</strong>
      </div>
      <div className="tool-args">
        <pre>{JSON.stringify(data.args || {}, null, 2)}</pre>
      </div>
      {data.output && (
        <div className="tool-output">
          <label>Observation:</label>
          <pre>{data.output}</pre>
        </div>
      )}
    </div>
  );
}
