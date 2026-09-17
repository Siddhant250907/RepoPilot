/**
 * ExecutionView Component.
 *
 * Immersive AI Agent Execution Dashboard:
 * - Top status banner: THINKING | USING TOOL | OBSERVING | RECOVERING | COMPLETED
 * - Controls: Stop | Reset | Run Again | Task Composer
 * - Failure & Self-Correction Callout Banner (highlighting the critical hackathon concept:
 *   TOOL FAILURE -> REFLECTION -> NEW ACTION -> SUCCESS)
 * - Premium vertical execution timeline (AgentTrace)
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
  Eye, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Check, 
  Flame, 
  ArrowRight, 
  ShieldCheck, 
  Cpu,
  Bug
} from 'lucide-react';

const NINE_STEP_PIPELINE = [
  { id: 'task', number: '01', label: 'USER TASK', short: 'USER TASK', icon: Bug },
  { id: 'plan', number: '02', label: 'AGENT PLANS', short: 'AGENT PLANS', icon: Brain },
  { id: 'tool', number: '03', label: 'AGENT USES TOOL', short: 'USES TOOL', icon: Terminal },
  { id: 'observe', number: '04', label: 'AGENT OBSERVES', short: 'OBSERVES', icon: Eye },
  { id: 'fail', number: '05', label: 'TOOL FAILS', short: 'TOOL FAILS', icon: AlertTriangle, isError: true },
  { id: 'reflect', number: '06', label: 'AGENT REFLECTS', short: 'REFLECTS', icon: RotateCcw, isRecovery: true },
  { id: 'action', number: '07', label: 'AGENT CHOOSES ANOTHER ACTION', short: 'CHOOSES ACTION', icon: Search, isRecovery: true },
  { id: 'success', number: '08', label: 'SUCCESS', short: 'SUCCESS', icon: CheckCircle2, isSuccess: true },
  { id: 'final', number: '09', label: 'FINAL RESULT', short: 'FINAL RESULT', icon: ShieldCheck, isSuccess: true },
];

export default function ExecutionView({
  activeTask,
  currentStatus,
  traceEvents = [],
  isRunning,
  onStop,
  onReset,
  onRunAgain,
  onBackToComposer,
}) {
  // Normalize top status into one of: THINKING, USING TOOL, OBSERVING, RECOVERING, COMPLETED
  const getNormalizedStatus = () => {
    const s = (currentStatus || 'IDLE').toUpperCase();
    if (s === 'PLANNING') return 'THINKING';
    if (s === 'EXECUTING') return 'USING TOOL';
    if (s === 'OBSERVING') return 'OBSERVING';
    if (s === 'RECOVERING' || s === 'REFLECTING') return 'RECOVERING';
    if (s === 'COMPLETED') return 'COMPLETED';
    return s;
  };

  const topStatus = getNormalizedStatus();

  // Detect whether the failure & recovery sequence has been triggered
  const hasFailureMoment = traceEvents.some(
    (e) =>
      e.status === 'RECOVERING' ||
      e.type === 'reflection' ||
      e.type === 'error' ||
      (e.type === 'tool_result' && Boolean(e.error))
  );

  const hasRecoverySuccess = traceEvents.some(
    (e) => e.type === 'final' || (e.type === 'tool_result' && e.data && e.data.includes('passed'))
  );

  // Compute states for the 9-step pipeline
  const hasPlan = traceEvents.some((e) => e.type === 'plan');
  const hasToolCall = traceEvents.some((e) => e.type === 'tool_call');
  const hasObservation = traceEvents.some((e) => e.type === 'tool_result' && !e.error);
  const hasFailure = traceEvents.some(
    (e) => e.type === 'error' || (e.type === 'tool_result' && Boolean(e.error)) || e.status === 'RECOVERING'
  );
  const hasReflection = traceEvents.some((e) => e.type === 'reflection');
  const hasNewAction = traceEvents.some(
    (e, i) => i > 0 && traceEvents[i - 1]?.type === 'reflection' && e.type === 'tool_call'
  );
  const isFinal = traceEvents.some((e) => e.type === 'final') || currentStatus === 'COMPLETED';

  const getPipelineStepState = (stepId) => {
    switch (stepId) {
      case 'task':
        return 'completed';
      case 'plan':
        if (hasPlan) return 'completed';
        if (currentStatus === 'PLANNING') return 'active';
        return 'pending';
      case 'tool':
        if (hasToolCall) return 'completed';
        if (currentStatus === 'EXECUTING' && !hasFailure) return 'active';
        return 'pending';
      case 'observe':
        if (hasObservation) return 'completed';
        if (currentStatus === 'OBSERVING' && !hasFailure) return 'active';
        return 'pending';
      case 'fail':
        if (hasFailure) return 'completed-alert';
        if (currentStatus === 'RECOVERING' && !hasReflection) return 'active-alert';
        return 'pending';
      case 'reflect':
        if (hasReflection) return 'completed-recovery';
        if (currentStatus === 'RECOVERING' && hasFailure) return 'active-recovery';
        return 'pending';
      case 'action':
        if (hasNewAction) return 'completed-action';
        if (currentStatus === 'EXECUTING' && hasReflection) return 'active-action';
        return 'pending';
      case 'success':
        if (hasRecoverySuccess) return 'completed-success';
        if (currentStatus === 'OBSERVING' && hasNewAction) return 'active-success';
        return 'pending';
      case 'final':
        if (isFinal) return 'completed-success';
        if (currentStatus === 'COMPLETED') return 'active-success';
        return 'pending';
      default:
        return 'pending';
    }
  };

  return (
    <div className="execution-view-container">
      {/* 1. Top Execution View Header Bar */}
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
              <FolderGit2 size={14} className="repo-icon" />
              <span className="repo-text">{activeTask?.repository || 'demo/projects/broken-login'}</span>
              <span className="repo-branch-sep">•</span>
              <GitBranch size={13} className="branch-icon" />
              <span className="branch-text">{activeTask?.branch || 'main'}</span>
            </div>
            <h2 className="exec-objective-title">
              {activeTask?.task || 'Investigate and resolve repository issue'}
            </h2>
          </div>
        </div>

        <div className="exec-header-right">
          {/* Top Status Indicator */}
          <div className="exec-status-col">
            <span className="status-caption">COGNITIVE STATUS</span>
            <div className={`exec-top-status-badge status-${topStatus.toLowerCase().replace(/\s+/g, '-')}`}>
              {topStatus === 'THINKING' && <Brain size={14} className="status-icon pulse" />}
              {topStatus === 'USING TOOL' && <Terminal size={14} className="status-icon pulse" />}
              {topStatus === 'OBSERVING' && <Eye size={14} className="status-icon pulse" />}
              {topStatus === 'RECOVERING' && <RotateCcw size={14} className="status-icon pulse amber" />}
              {topStatus === 'COMPLETED' && <CheckCircle2 size={14} className="status-icon green" />}
              {topStatus === 'IDLE' && <Sparkles size={14} className="status-icon" />}
              <span className="status-text-label">{topStatus}</span>
            </div>
          </div>

          {/* Action Controls: Stop, Reset, Run Again */}
          <div className="exec-control-buttons">
            {isRunning && (
              <button
                type="button"
                className="exec-action-btn stop-btn"
                onClick={onStop}
                title="Stop simulation"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            )}

            <button
              type="button"
              className="exec-action-btn reset-btn"
              onClick={onReset}
              title="Reset to initial state"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="exec-action-btn rerun-btn"
              onClick={onRunAgain}
              disabled={isRunning}
              title="Re-run this scenario"
            >
              <RefreshCw size={13} className={isRunning ? 'spin-icon' : ''} />
              <span>Run Again</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Autonomous Investigation Lifecycle (The 9-Step OODA Pipeline) */}
      <div className="autonomous-nine-step-tracker">
        <div className="pipeline-header-row">
          <div className="pipeline-title-left">
            <span className="pipeline-dot" />
            <span className="pipeline-title">AUTONOMOUS INVESTIGATION LIFECYCLE</span>
            <span className="pipeline-tag-badge">9 STAGES</span>
          </div>
          <span className="pipeline-subtitle">
            USER TASK → PLAN → TOOL → OBSERVE → FAILURE → REFLECTION → NEW ACTION → SUCCESS → FINAL
          </span>
        </div>

        <div className="pipeline-steps-strip">
          {NINE_STEP_PIPELINE.map((step, idx) => {
            const state = getPipelineStepState(step.id);
            const Icon = step.icon;
            return (
              <React.Fragment key={step.id}>
                <div
                  className={`pipeline-step-node state-${state} ${step.isError ? 'is-error-node' : ''} ${step.isRecovery ? 'is-recovery-node' : ''} ${step.isSuccess ? 'is-success-node' : ''}`}
                  title={`${step.number}. ${step.label} (${state.replace('-', ' ')})`}
                >
                  <div className="node-icon-wrapper">
                    <Icon size={12} className="node-icon" />
                    {state.startsWith('completed') && (
                      <span className="node-check-pip">✓</span>
                    )}
                  </div>
                  <div className="node-label-col">
                    <span className="node-step-num">{step.number}</span>
                    <span className="node-step-text">{step.short}</span>
                  </div>
                </div>

                {idx < NINE_STEP_PIPELINE.length - 1 && (
                  <div className={`pipeline-connector-line ${state.startsWith('completed') ? 'filled' : ''}`}>
                    <ArrowRight size={10} className="connector-arrow-icon" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 3. Failure & Recovery Sequence Tracker (Crucial Hackathon Showcase) */}
      {hasFailureMoment && (
        <div className="failure-recovery-callout-card animate-slide-down">
          <div className="callout-header-row">
            <div className="callout-badge-left">
              <Flame size={15} className="flame-icon" />
              <span className="callout-title">AUTONOMOUS COGNITIVE RECOVERY IN PROGRESS</span>
            </div>
            <span className="callout-concept-tag">CORE AGENT CAPABILITY</span>
          </div>

          <p className="callout-explanation">
            When a tool fails or an unexpected exception occurs, RepoPilot does not crash or ask for help.
            It reflects on the failure, falsifies its faulty hypothesis, and dispatches a smarter recovery tool.
          </p>

          {/* The 4-Step Failure -> Recovery Flow */}
          <div className="failure-recovery-steps-row">
            <div className="recovery-step-node fault">
              <div className="step-node-header">
                <AlertTriangle size={13} />
                <span>TOOL FAILURE</span>
              </div>
              <span className="node-detail-mono">pytest: 2 tests failed</span>
            </div>

            <div className="step-node-arrow">
              <ArrowRight size={14} />
            </div>

            <div className="recovery-step-node reflect">
              <div className="step-node-header">
                <RotateCcw size={13} />
                <span>REFLECTION</span>
              </div>
              <span className="node-detail-mono">Reconsidering auth path</span>
            </div>

            <div className="step-node-arrow">
              <ArrowRight size={14} />
            </div>

            <div className="recovery-step-node action">
              <div className="step-node-header">
                <Search size={13} />
                <span>NEW ACTION</span>
              </div>
              <span className="node-detail-mono">search_codebase config</span>
            </div>

            <div className="step-node-arrow">
              <ArrowRight size={14} />
            </div>

            <div className={`recovery-step-node ${hasRecoverySuccess ? 'success' : 'pending'}`}>
              <div className="step-node-header">
                <CheckCircle2 size={13} />
                <span>SUCCESS</span>
              </div>
              <span className="node-detail-mono">
                {hasRecoverySuccess ? 'Root cause identified & fixed' : 'Synthesizing patch...'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Working Memory Dashboard: Current PLAN, TOOL, OBSERVATION, ERRORS, REFLECTION, FINAL RESULT */}
      <div className="active-working-memory-grid">
        <div className="memory-card plan-card">
          <div className="memory-card-header">
            <Brain size={13} className="card-icon indigo" />
            <span className="card-title">CURRENT PLAN</span>
          </div>
          <p className="memory-card-content">
            {([...traceEvents].reverse().find(e => e.type === 'plan')?.message) || 'Formulating hypothesis...'}
          </p>
        </div>

        <div className="memory-card tool-card">
          <div className="memory-card-header">
            <Terminal size={13} className="card-icon purple" />
            <span className="card-title">CURRENT TOOL</span>
          </div>
          <div className="memory-card-content">
            {(() => {
              const tc = [...traceEvents].reverse().find(e => e.type === 'tool_call');
              return tc ? <code className="tool-call-code">{tc.tool}</code> : <span className="text-muted">Awaiting tool</span>;
            })()}
          </div>
        </div>

        <div className="memory-card obs-card">
          <div className="memory-card-header">
            <Eye size={13} className="card-icon blue" />
            <span className="card-title">OBSERVATION</span>
          </div>
          <p className="memory-card-content">
            {([...traceEvents].reverse().find(e => e.type === 'tool_result' && !e.error)?.data?.slice(0, 80) || 'Awaiting stdout')}
          </p>
        </div>

        <div className={`memory-card error-card ${traceEvents.some(e => e.error) ? 'has-error' : ''}`}>
          <div className="memory-card-header">
            <AlertTriangle size={13} className="card-icon red" />
            <span className="card-title">FAILURES / ERRORS</span>
          </div>
          <p className="memory-card-content">
            {([...traceEvents].reverse().find(e => e.error)?.error?.slice(0, 80) || '0 active faults')}
          </p>
        </div>

        <div className={`memory-card reflect-card ${traceEvents.some(e => e.type === 'reflection') ? 'has-reflection' : ''}`}>
          <div className="memory-card-header">
            <RotateCcw size={13} className="card-icon amber" />
            <span className="card-title">REFLECTION / REPLANNING</span>
          </div>
          <p className="memory-card-content">
            {([...traceEvents].reverse().find(e => e.type === 'reflection')?.message?.slice(0, 80) || 'Ready')}
          </p>
        </div>

        <div className={`memory-card result-card ${traceEvents.some(e => e.type === 'final') ? 'has-result' : ''}`}>
          <div className="memory-card-header">
            <ShieldCheck size={13} className="card-icon green" />
            <span className="card-title">FINAL RESULT</span>
          </div>
          <p className="memory-card-content">
            {([...traceEvents].reverse().find(e => e.type === 'final')?.message || 'Executing investigation')}
          </p>
        </div>
      </div>

      {/* 5. Premium Vertical Execution Timeline */}
      <div className="execution-timeline-scroll-wrap">
        <AgentTrace events={traceEvents} onStartNewTask={onBackToComposer} />
      </div>
    </div>
  );
}
