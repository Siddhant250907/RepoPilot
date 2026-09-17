/**
 * ToolCall Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Visually display tool name, arguments, and execution status.
 * - Supports tools such as:
 *   FILE READER (Reading app.py)
 *   SHELL (Running pytest)
 *   WEB SEARCH (Searching Flask HTTP 500)
 *   CALCULATOR (Calculating expected value)
 */

import React, { useState } from 'react';

const TOOL_ICONS = {
  'FILE_READER': '📁',
  'FILE READER': '📁',
  'FILE_WRITER': '✏️',
  'FILE WRITER': '✏️',
  'FILE TOOL': '📁',
  'FILE_TOOL': '📁',
  'SHELL': '💻',
  'BASH': '💻',
  'TERMINAL': '💻',
  'WEB SEARCH': '🌐',
  'WEB_SEARCH': '🌐',
  'SEARCH': '🌐',
  'CALCULATOR': '🔢',
  'GIT': '🌿',
  'DIFF': '🔍',
};

function getToolIcon(name = '') {
  const upper = name.toUpperCase();
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (upper.includes(key)) return icon;
  }
  return '⚙️';
}

function formatArguments(args, toolName = '') {
  if (args === null || args === undefined) return '';
  if (typeof args === 'string') return args;
  if (typeof args === 'object') {
    const toolUpper = toolName.toUpperCase();
    if (args.command) {
      return args.command.startsWith('Running') ? args.command : `Running ${args.command}`;
    }
    if (args.path || args.file) {
      const target = args.path || args.file;
      if (toolUpper.includes('WRITE')) {
        return `Writing ${target}${args.patch ? ` (patch: ${args.patch})` : ''}`;
      }
      return `Reading ${target}`;
    }
    if (args.query) return `Searching "${args.query}"`;
    if (args.expression) return `Calculating ${args.expression}`;
    try {
      return JSON.stringify(args, null, 2);
    } catch {
      return String(args);
    }
  }
  return String(args);
}

export default function ToolCall({
  toolName = 'TOOL',
  arguments: toolArgs,
  args,
  status = 'EXECUTING',
  data,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Normalize props
  const rawToolName = data?.tool || data?.toolName || toolName;
  const resolvedToolName = rawToolName.replace(/_/g, ' ').toUpperCase();
  const rawArgs =
    toolArgs !== undefined
      ? toolArgs
      : args !== undefined
      ? args
      : data?.arguments || data?.args;
  const resolvedStatus = (data?.status || status || 'EXECUTING').toUpperCase();
  const icon = getToolIcon(rawToolName);
  const formattedArgs = formatArguments(rawArgs, rawToolName);
  const isComplexJson =
    typeof rawArgs === 'object' &&
    rawArgs !== null &&
    !rawArgs.command &&
    !rawArgs.path &&
    !rawArgs.file;

  return (
    <div className={`tool-call-card tool-status-${resolvedStatus.toLowerCase()}`}>
      <div className="tool-call-header">
        <div className="tool-call-identity">
          <span className="tool-type-icon" aria-hidden="true">
            {icon}
          </span>
          <span className="tool-name-badge">{resolvedToolName}</span>
        </div>
        <div className="tool-call-meta">
          <span className={`tool-status-pill status-${resolvedStatus.toLowerCase()}`}>
            {resolvedStatus}
          </span>
          {isComplexJson && (
            <button
              type="button"
              className="toggle-args-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label="Toggle arguments view"
            >
              {isExpanded ? 'Collapse' : 'Details'}
            </button>
          )}
        </div>
      </div>

      <div className="tool-call-body">
        <div className="tool-args-display">
          <span className="args-label">Arguments:</span>
          {isComplexJson && !isExpanded ? (
            <code className="args-inline-preview">
              {Object.keys(rawArgs)
                .map((k) => `${k}: ${JSON.stringify(rawArgs[k])}`)
                .join(', ')}
            </code>
          ) : (
            <pre className="args-code-block">{formattedArgs}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
