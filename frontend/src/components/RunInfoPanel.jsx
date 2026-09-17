/**
 * RunInfoPanel Component (RIGHT PANEL).
 *
 * Professional AI Developer Workspace Run Details Panel:
 *
 * When a run is active:
 * - RUN DETAILS Header
 * - Repository
 * - Branch
 * - Agent
 * - Steps
 * - Tools used (with call counts & icons)
 * - Errors
 * - Recovery attempts
 * - Duration (live seconds timer formatted as mm:ss)
 *
 * When no run exists:
 * - Useful empty state displaying sandbox environment, tool registry, and readiness
 */

import React from 'react';
import { 
  FolderGit2, 
  GitBranch, 
  Bot, 
  Layers, 
  Wrench, 
  AlertTriangle, 
  RotateCcw, 
  Clock, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  CheckCircle, 
  Cpu, 
  Activity,
  Code2,
  Search,
  FlaskConical,
  FileDiff
} from 'lucide-react';

const REGISTERED_TOOLS = [
  { name: 'inspect_ast', desc: 'AST Syntax Tree & Symbol Parser', icon: <Code2 size={13} /> },
  { name: 'search_codebase', desc: 'Ripgrep Pattern & Regex Engine', icon: <Search size={13} /> },
  { name: 'run_pytest', desc: 'Test Runner & Assertion Suite', icon: <FlaskConical size={13} /> },
  { name: 'apply_diff', desc: 'Unified AST-Safe Patch Engine', icon: <FileDiff size={13} /> },
];

export default function RunInfoPanel({
  activeTask,
  events = [],
  currentStatus = 'IDLE',
  isRunning = false,
  duration = 0,
}) {
  // Check whether a run is currently active or has past run data
  const hasRun = Boolean(activeTask || isRunning || events.length > 0);

  // Format duration in mm:ss or seconds
  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Compute tools used from trace events
  const toolCalls = events.filter((e) => e.type === 'tool_call');
  const toolCounts = toolCalls.reduce((acc, curr) => {
    const name = (curr.tool || curr.toolName || 'tool').toLowerCase();
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // Fallback for activeTask tools if events are empty (e.g. from recent runs)
  if (Object.keys(toolCounts).length === 0 && activeTask?.toolsUsed) {
    activeTask.toolsUsed.forEach((t) => {
      toolCounts[t] = (toolCounts[t] || 0) + 1;
    });
  }

  // Calculate Errors & Recovery attempts
  const errorCount =
    activeTask?.errors !== undefined
      ? activeTask.errors
      : events.filter(
          (e) =>
            e.type === 'error' ||
            (e.type === 'tool_result' && Boolean(e.error)) ||
            e.status === 'RECOVERING'
        ).length;

  const recoveryCount =
    activeTask?.recoveries !== undefined
      ? activeTask.recoveries
      : events.filter(
          (e) => e.type === 'reflection' || (e.type === 'tool_result' && Boolean(e.recoveryPlan))
        ).length;

  // Step count
  const stepCount = events.length > 0 ? events.length : activeTask?.steps || '0 steps';

  return (
    <aside className="run-details-panel">
      {hasRun ? (
        /* ==================================================================
           ACTIVE RUN STATE: RUN DETAILS
           ================================================================== */
        <div className="run-details-content">
          {/* Header */}
          <div className="panel-header-block">
            <div className="panel-title-group">
              <span className={`run-status-pulse-dot ${isRunning ? 'running' : 'completed'}`} />
              <h3 className="panel-main-heading">RUN DETAILS</h3>
            </div>
            <span className={`run-state-pill ${isRunning ? 'running' : 'completed'}`}>
              {isRunning ? 'RUNNING' : 'COMPLETED'}
            </span>
          </div>

          <div className="panel-scroll-body">
            {/* 1. Repository & Branch */}
            <div className="metric-detail-group">
              <span className="metric-group-title">Target Repository</span>
              <div className="detail-row">
                <div className="detail-item-left">
                  <FolderGit2 size={14} className="detail-icon" />
                  <span className="detail-key">Repository</span>
                </div>
                <code className="detail-val-mono">
                  {activeTask?.repository || 'demo/projects/broken-login'}
                </code>
              </div>

              <div className="detail-row">
                <div className="detail-item-left">
                  <GitBranch size={14} className="detail-icon" />
                  <span className="detail-key">Branch</span>
                </div>
                <span className="detail-val-badge">
                  {activeTask?.branch || 'main'}
                </span>
              </div>
            </div>

            {/* 2. Agent & Steps */}
            <div className="metric-detail-group">
              <span className="metric-group-title">Agent Telemetry</span>
              <div className="detail-row">
                <div className="detail-item-left">
                  <Bot size={14} className="detail-icon accent-indigo" />
                  <span className="detail-key">Agent</span>
                </div>
                <span className="detail-val-text">RepoPilot Core (OODA Loop v0.1)</span>
              </div>

              <div className="detail-row">
                <div className="detail-item-left">
                  <Layers size={14} className="detail-icon" />
                  <span className="detail-key">Steps</span>
                </div>
                <span className="detail-val-pill steps-pill">
                  {typeof stepCount === 'number' ? `${stepCount} steps` : stepCount}
                </span>
              </div>

              <div className="detail-row">
                <div className="detail-item-left">
                  <Clock size={14} className="detail-icon accent-blue" />
                  <span className="detail-key">Duration</span>
                </div>
                <span className="detail-val-mono duration-mono">
                  {formatDuration(duration || activeTask?.duration || 14)}
                </span>
              </div>
            </div>

            {/* 3. Errors & Recovery Attempts */}
            <div className="metric-detail-group highlight-box">
              <span className="metric-group-title">Self-Correction Metrics</span>
              
              <div className="detail-row">
                <div className="detail-item-left">
                  <AlertTriangle size={14} className="detail-icon accent-amber" />
                  <span className="detail-key">Errors</span>
                </div>
                <span className={`detail-val-pill ${errorCount > 0 ? 'error-pill' : 'neutral-pill'}`}>
                  {errorCount > 0 ? `${errorCount} tool fault` : '0 faults'}
                </span>
              </div>

              <div className="detail-row">
                <div className="detail-item-left">
                  <RotateCcw size={14} className="detail-icon accent-purple" />
                  <span className="detail-key">Recovery attempts</span>
                </div>
                <span className={`detail-val-pill ${recoveryCount > 0 ? 'recovery-pill' : 'neutral-pill'}`}>
                  {recoveryCount > 0 ? `${recoveryCount} self-correction` : '0 needed'}
                </span>
              </div>

              {recoveryCount > 0 && (
                <div className="recovery-notice-banner">
                  <Sparkles size={12} />
                  <span>Agent recovered from failure autonomously</span>
                </div>
              )}
            </div>

            {/* 4. Tools Used */}
            <div className="metric-detail-group">
              <span className="metric-group-title">Tools Used</span>
              {Object.keys(toolCounts).length === 0 ? (
                <span className="empty-tools-note">No tools dispatched yet</span>
              ) : (
                <div className="tools-used-list">
                  {Object.entries(toolCounts).map(([tool, count]) => (
                    <div key={tool} className="tool-used-row">
                      <div className="tool-left-col">
                        <Terminal size={13} className="tool-icon" />
                        <span className="tool-name-code">{tool}</span>
                      </div>
                      <span className="tool-count-pill">{count} calls</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================================================================
           EMPTY STATE: USEFUL SYSTEM STATUS & READINESS
           ================================================================== */
        <div className="run-details-empty-state">
          {/* Header */}
          <div className="panel-header-block">
            <div className="panel-title-group">
              <span className="idle-pulse-dot" />
              <h3 className="panel-main-heading">RUN DETAILS</h3>
            </div>
            <span className="run-state-pill idle">IDLE • READY</span>
          </div>

          <div className="panel-scroll-body">
            {/* Readiness Banner */}
            <div className="empty-ready-card">
              <div className="empty-card-top">
                <Activity size={16} className="activity-icon" />
                <span className="empty-card-heading">Cognitive Engine Online</span>
              </div>
              <p className="empty-card-desc">
                RepoPilot is armed and ready to investigate repository bugs, analyze stack traces, and run test suites.
              </p>
            </div>

            {/* Sandbox Context */}
            <div className="metric-detail-group">
              <span className="metric-group-title">Isolated Sandbox</span>
              <div className="detail-row">
                <span className="detail-key">Runtime</span>
                <span className="detail-val-text">Python 3.11.8 (virtualenv)</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Test Runner</span>
                <span className="detail-val-text">pytest 8.1.1</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Isolation</span>
                <span className="detail-val-badge">Docker Container #01</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Git Tree</span>
                <span className="detail-val-mono clean-mono">HEAD (Clean)</span>
              </div>
            </div>

            {/* Available Tool Registry */}
            <div className="metric-detail-group">
              <span className="metric-group-title">Available Tools</span>
              <div className="registry-tools-list">
                {REGISTERED_TOOLS.map((tool) => (
                  <div key={tool.name} className="registry-tool-item">
                    <div className="tool-item-icon-box">{tool.icon}</div>
                    <div className="tool-item-text">
                      <span className="tool-item-name">{tool.name}</span>
                      <span className="tool-item-desc">{tool.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hint Box */}
            <div className="empty-help-box">
              <span className="empty-help-title">Getting Started:</span>
              <p className="empty-help-text">
                Pick a quick action in the task composer or describe an error to start an autonomous debugging trajectory.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
