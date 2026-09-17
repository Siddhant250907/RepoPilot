/**
 * ExecutionView Component.
 *
 * Dedicated AI agent execution dashboard view:
 * - Active Run Header with status, repository, and controls
 * - Cognitive Loop Pipeline tracker (Plan -> Act -> Observe -> Reflect -> Recover -> Final)
 * - Prominent Failure & Self-Correction Banner
 * - Sequential trace stream (AgentTrace)
 */

import React from 'react';
import AgentTrace from './AgentTrace.jsx';
import StatusBadge from './StatusBadge.jsx';
import { 
  FolderGit2, 
  GitBranch,
  Terminal, 
  RotateCcw, 
  Sparkles, 
  ArrowLeft, 
  Square, 
  CheckCircle2, 
  Brain,
  Eye
} from 'lucide-react';

export default function ExecutionView({
  activeTask,
  currentStatus,
  traceEvents = [],
  isRunning,
  onStop,
  onRunAgain,
  onBackToComposer,
}) {
  const hasFailureMoment = traceEvents.some(
    (e) =>
      e.status === 'RECOVERING' ||
      e.type === 'reflection' ||
      e.type === 'error' ||
      (e.type === 'tool_result' && Boolean(e.error))
  );

  return (
    <div className="execution-view-container">
      {/* 1. Execution View Header */}
      <div className="execution-header-card">
        <div className="exec-header-left">
          <button
            type="button"
            className="back-to-composer-btn"
            onClick={onBackToComposer}
            title="Return to Task Composer"
          >
            <ArrowLeft size={16} />
            <span>Task Composer</span>
          </button>

          <div className="exec-title-meta">
            <div className="exec-task-badge">
              <FolderGit2 size={15} />
              <span className="repo-text">{activeTask?.repository || 'Target Repository'}</span>
              <span className="repo-branch-sep">•</span>
              <GitBranch size={13} />
              <span className="branch-text">{activeTask?.branch || 'main'}</span>
            </div>
            <h2 className="exec-objective-title">
              {activeTask?.task || 'Autonomous Debugging Task'}
            </h2>
          </div>
        </div>

        <div className="exec-header-right">
          <div className="exec-status-col">
            <span className="status-caption">COGNITIVE STATUS</span>
            <StatusBadge status={currentStatus} />
          </div>

          <div className="exec-control-buttons">
            {isRunning ? (
              <button
                type="button"
                className="exec-action-btn stop-btn"
                onClick={onStop}
                title="Stop simulation"
              >
                <Square size={14} fill="currentColor" />
                <span>Stop Agent</span>
              </button>
            ) : (
              <button
                type="button"
                className="exec-action-btn rerun-btn"
                onClick={onRunAgain}
                title="Re-run this scenario"
              >
                <RotateCcw size={14} />
                <span>Re-run Trace</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Cognitive Loop Phase Pipeline */}
      <div className="cognitive-flow-pipeline">
        <span className="pipeline-title">COGNITIVE ARCHITECTURE:</span>
        <div className="pipeline-steps">
          <div className={`pipeline-step ${currentStatus === 'PLANNING' ? 'active pulse' : ''}`}>
            <Brain size={14} />
            <span>PLAN</span>
          </div>
          <span className="pipeline-arrow">→</span>

          <div className={`pipeline-step ${currentStatus === 'EXECUTING' ? 'active pulse' : ''}`}>
            <Terminal size={14} />
            <span>ACT (TOOL)</span>
          </div>
          <span className="pipeline-arrow">→</span>

          <div className={`pipeline-step ${currentStatus === 'OBSERVING' ? 'active pulse' : ''}`}>
            <Eye size={14} />
            <span>OBSERVE</span>
          </div>
          <span className="pipeline-arrow">→</span>

          <div
            className={`pipeline-step recover-step ${
              currentStatus === 'RECOVERING' ? 'active pulse' : ''
            }`}
          >
            <RotateCcw size={14} />
            <span>REFLECT & RECOVER</span>
          </div>
          <span className="pipeline-arrow">→</span>

          <div className={`pipeline-step ${currentStatus === 'COMPLETED' ? 'active success' : ''}`}>
            <CheckCircle2 size={14} />
            <span>FINAL FIX</span>
          </div>
        </div>
      </div>

      {/* 3. Autonomous Self-Correction Banner (Prominent during failure or recovery) */}
      {hasFailureMoment && (
        <div className="autonomous-recovery-banner" role="alert">
          <div className="arb-content">
            <div className="arb-icon-pill">
              <Sparkles size={18} />
            </div>
            <div className="arb-text-block">
              <strong>Autonomous Self-Correction in Action:</strong>
              <p>
                Agent encountered tool fault (test assertion failure) → paused to reflect →
                formulated revised hypothesis → applied configuration fallback → verified 5 passed tests!
              </p>
            </div>
          </div>
          <span className="arb-badge">BRAIN, NOT PUPPET</span>
        </div>
      )}

      {/* 4. Trace Main Stream */}
      <div className="execution-content-layout">
        <div className="execution-trace-main">
          <AgentTrace events={traceEvents} onStartNewTask={onBackToComposer} />
        </div>
      </div>
    </div>
  );
}
