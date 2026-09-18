/**
 * AgentTrace Component.
 *
 * Premium vertical execution timeline for RepoPilot:
 * - Vertical connecting rail linking each progressive event
 * - Each step displays:
 *   - step number (e.g. "STEP 01")
 *   - event type badge (PLAN, TOOL, OBSERVE, TOOL FAILURE, REFLECTION, NEW ACTION, SUCCESS, FINAL)
 *   - message (AI rationale / cognitive thought)
 *   - tool name with dedicated icon
 *   - status (THINKING, USING TOOL, OBSERVING, RECOVERING, COMPLETED)
 *   - timestamp
 *   - structured details when available (parameters, diff, error summary, test count)
 * - Visually highlights the critical failure & recovery sequence:
 *   TOOL FAILURE -> REFLECTION -> NEW ACTION -> SUCCESS
 * - Avoids exposing raw logs as the primary UI.
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  Brain, 
  Terminal, 
  Eye, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Search,
  FileCode,
  FlaskConical,
  FileDiff,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
  Flame,
  ArrowRight,
  Bug
} from 'lucide-react';

import ToolCall from './ToolCall.jsx';
import ErrorCard from './ErrorCard.jsx';
import FinalResult from './FinalResult.jsx';

export default function AgentTrace({ events = [], onStartNewTask }) {
  const traceBottomRef = useRef(null);
  const [expandedDetails, setExpandedDetails] = useState({});

  // Auto-scroll to newest event
  useEffect(() => {
    if (traceBottomRef.current) {
      traceBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length]);

  const toggleDetails = (stepNum) => {
    setExpandedDetails((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  // Helper to determine semantic tool icon
  const getToolIcon = (toolName) => {
    const t = (toolName || '').toLowerCase();
    if (t.includes('pytest') || t.includes('shell')) return <FlaskConical size={14} />;
    if (t.includes('search')) return <Search size={14} />;
    if (t.includes('file') || t.includes('read')) return <FileCode size={14} />;
    if (t.includes('diff') || t.includes('patch')) return <FileDiff size={14} />;
    return <Terminal size={14} />;
  };

  // Helper to normalize step event type and visual accent matching PLAN, ACT, OBSERVE, ERROR, REFLECTION, REPLAN, SUCCESS
  const resolveStepMeta = (event, index, allEvents) => {
    // Check if tool failure
    if (
      event.type === 'error' ||
      (event.type === 'tool_result' && (Boolean(event.error) || event.status === 'error'))
    ) {
      return {
        typeLabel: 'TOOL RESULT: ERROR',
        accent: 'red',
        icon: <AlertTriangle size={15} />,
        statusLabel: 'FAILED',
        isFailure: true,
      };
    }

    // Check if reflection
    if (event.type === 'reflection') {
      return {
        typeLabel: 'REFLECTION',
        accent: 'amber',
        icon: <Brain size={15} />,
        statusLabel: 'REFLECTING',
        isReflection: true,
      };
    }

    // Check if new action / replanning after reflection
    const prevWasReflection = index > 0 && allEvents[index - 1]?.type === 'reflection';
    if (prevWasReflection && event.type === 'tool_call') {
      return {
        typeLabel: 'TOOL CALL',
        accent: 'purple',
        icon: <Search size={15} />,
        statusLabel: 'RUNNING',
        isNewAction: true,
      };
    }

    // Check if plan
    if (event.type === 'plan') {
      return {
        typeLabel: 'PLAN',
        accent: 'indigo',
        icon: <Brain size={15} />,
        statusLabel: 'PLANNING',
      };
    }

    // Check if standard tool call
    if (event.type === 'tool_call') {
      return {
        typeLabel: 'TOOL CALL',
        accent: 'purple',
        icon: getToolIcon(event.tool),
        statusLabel: 'RUNNING',
      };
    }

    // Check if tool observation / result
    if (event.type === 'tool_result') {
      const isFail = event.status === 'error' || Boolean(event.error);
      if (isFail) {
        return {
          typeLabel: 'TOOL RESULT: ERROR',
          accent: 'red',
          icon: <AlertTriangle size={15} />,
          statusLabel: 'FAILED',
          isFailure: true,
        };
      }
      return {
        typeLabel: 'TOOL RESULT: SUCCESS',
        accent: 'green',
        icon: <CheckCircle2 size={15} />,
        statusLabel: 'SUCCESS',
        isSuccess: true,
      };
    }

    // Check if final
    if (event.type === 'final') {
      return {
        typeLabel: 'FINAL RESULT',
        accent: 'green',
        icon: <ShieldCheck size={15} />,
        statusLabel: 'COMPLETED',
        isFinal: true,
      };
    }

    return {
      typeLabel: (event.type || 'STEP').toUpperCase(),
      accent: 'indigo',
      icon: <Sparkles size={15} />,
      statusLabel: (event.status || 'THINKING').toUpperCase(),
    };
  };

  if (!events || events.length === 0) {
    return (
      <div className="trace-empty-container">
        <div className="trace-empty-icon-wrap">
          <Brain size={36} className="pulse-brain-icon" />
        </div>
        <h3 className="empty-title">Awaiting Agent Dispatch</h3>
        <p className="trace-empty-text">
          Enter an investigation task in the composer or run a demo scenario. The progressive
          autonomous loop will stream live through all 9 stages:
        </p>
        <div className="trace-loop-diagram nine-stage-loop">
          <div className="loop-step">
            <Bug size={13} />
            <span>01 USER TASK</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step">
            <Brain size={13} />
            <span>02 AGENT PLANS</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step">
            <Terminal size={13} />
            <span>03 AGENT USES TOOL</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step">
            <Eye size={13} />
            <span>04 AGENT OBSERVES</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step error">
            <AlertTriangle size={13} />
            <span>05 TOOL FAILS</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step recovery">
            <RotateCcw size={13} />
            <span>06 AGENT REFLECTS</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step action">
            <Search size={13} />
            <span>07 AGENT CHOOSES ACTION</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step success">
            <CheckCircle2 size={13} />
            <span>08 SUCCESS</span>
          </div>
          <span className="loop-arrow">↓</span>
          <div className="loop-step final">
            <ShieldCheck size={13} />
            <span>09 FINAL RESULT</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vertical-execution-timeline-root">
      <div className="timeline-rail-line" />

      <div className="timeline-steps-stack">
        {events.map((event, idx) => {
          const stepNum = event.step || idx + 1;
          const meta = resolveStepMeta(event, idx, events);
          const isExpanded = Boolean(expandedDetails[stepNum]);

          return (
            <div
              key={`event-${stepNum}-${idx}`}
              className={`timeline-step-card accent-${meta.accent} ${meta.isFailure ? 'step-failure-card' : ''} ${meta.isReflection ? 'step-reflection-card' : ''} ${meta.isSuccess ? 'step-success-card' : ''}`}
            >
              {/* Left Timeline Rail Node */}
              <div className="step-rail-node">
                <div className={`node-circle-icon accent-${meta.accent}`}>
                  {meta.icon}
                </div>
              </div>

              {/* Step Card Content */}
              <div className="step-card-main-body">
                {/* Header Row: Step Number, Event Type, Tool Name, Status, Timestamp */}
                <div className="step-card-header-line">
                  <div className="header-meta-left">
                    <span className="step-number-pill">
                      STEP {stepNum.toString().padStart(2, '0')}
                    </span>
                    <span className={`event-type-badge ${meta.accent}`}>
                      {meta.typeLabel}
                    </span>
                    {event.tool && (
                      <span className="tool-name-badge">
                        {getToolIcon(event.tool)}
                        <span>{event.tool}</span>
                      </span>
                    )}
                  </div>

                  <div className="header-meta-right">
                    <span className={`step-status-chip ${meta.accent}`}>
                      {meta.statusLabel}
                    </span>
                    <span className="step-timestamp-mono">
                      <Clock size={11} />
                      <span>{event.timestamp || '00:00:00'}</span>
                    </span>
                  </div>
                </div>

                {/* Primary Message (AI Thought or Action Description) */}
                <div className="step-message-row">
                  {event.message && !meta.isFinal && event.type !== 'tool_call' && (
                    <p className="step-message-text">{event.message}</p>
                  )}

                  {/* Dedicated ToolCall Component */}
                  {event.type === 'tool_call' && (
                    <div className="tool-call-wrap">
                      {event.thought && (
                        <p className="step-thought-text">
                          <em>Thought:</em> {event.thought}
                        </p>
                      )}
                      <ToolCall
                        toolName={event.tool || 'tool'}
                        arguments={event.arguments}
                        status={event.status || 'EXECUTING'}
                        data={event}
                      />
                    </div>
                  )}

                  {/* Dedicated ErrorCard Component for Failures */}
                  {meta.isFailure && (
                    <ErrorCard
                      tool={event.tool || 'tool'}
                      error={event.error || 'The command returned a non-zero exit code.'}
                      data={event}
                    />
                  )}

                  {/* Reflection Block */}
                  {meta.isReflection && (
                    <div className="reflection-alert-box">
                      <div className="reflection-alert-header">
                        <Sparkles size={14} className="reflection-icon" />
                        <strong>Autonomous Reflection & Self-Correction</strong>
                      </div>
                      <p className="reflection-subtext">
                        {event.message || event.hypothesis || 'Reflecting on step outcome and formulating next action.'}
                      </p>
                    </div>
                  )}

                  {event.recoveryPlan && (
                    <div className="recovery-plan-box">
                      <span className="plan-label">RECOVERY PLAN:</span>
                      <p className="plan-text">{event.recoveryPlan}</p>
                    </div>
                  )}

                  {/* Dedicated FinalResult Card */}
                  {meta.isFinal && (
                    <FinalResult
                      response={event.summary || event.message}
                      result={event}
                      onStartNewTask={onStartNewTask}
                    />
                  )}
                </div>

                {/* Details Section (Structured, Not Raw Logs) */}
                {(event.arguments || event.data || event.subgoals) && (
                  <div className="step-details-container">
                    <button
                      type="button"
                      className="details-toggle-btn"
                      onClick={() => toggleDetails(stepNum)}
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      <span>{isExpanded ? 'Hide structured details' : 'View structured details'}</span>
                    </button>

                    {isExpanded && (
                      <div className="step-expanded-details animate-fade">
                        {/* Subgoals */}
                        {event.subgoals && (
                          <div className="details-subgoals-list">
                            <span className="details-subhead">Formulated Sub-Goals:</span>
                            <ul>
                              {event.subgoals.map((g, gi) => (
                                <li key={gi}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Tool Arguments */}
                        {event.arguments && (
                          <div className="details-arguments-block">
                            <span className="details-subhead">Tool Arguments:</span>
                            <pre className="details-code-pre">
                              <code>{JSON.stringify(event.arguments, null, 2)}</code>
                            </pre>
                          </div>
                        )}

                        {/* Output Data */}
                        {event.data && (
                          <div className="details-data-block">
                            <span className="details-subhead">Observation Telemetry:</span>
                            <pre className="details-code-pre">
                              <code>{event.data}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={traceBottomRef} />
      </div>
    </div>
  );
}
