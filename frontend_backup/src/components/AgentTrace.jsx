/**
 * AgentTrace Component.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Chronological rendering of the agent cognitive trajectory:
 *   PLAN -> TOOL CALL -> TOOL RESULT -> ERROR -> REFLECTION -> NEW TOOL CALL -> SUCCESS -> FINAL
 * - Auto-scroll to newest event as events arrive progressively.
 * - Prominent error display and failure-recovery loop highlighting.
 * - Reusable across real API stream and mock simulation.
 */

import React, { useEffect, useRef } from 'react';
import ToolCall from './ToolCall.jsx';
import ErrorCard from './ErrorCard.jsx';
import FinalResult from './FinalResult.jsx';

const EVENT_CONFIG = {
  plan: {
    icon: '🧠',
    label: 'PLAN',
    className: 'event-plan',
  },
  tool_call: {
    icon: '⚙️',
    label: 'TOOL CALL',
    className: 'event-tool-call',
  },
  tool_result: {
    icon: '👁',
    label: 'OBSERVATION',
    className: 'event-observation',
  },
  observation: {
    icon: '👁',
    label: 'OBSERVATION',
    className: 'event-observation',
  },
  reflection: {
    icon: '🧠',
    label: 'REFLECTION',
    className: 'event-reflection',
  },
  error: {
    icon: '❌',
    label: 'TOOL FAILURE',
    className: 'event-error',
  },
  final: {
    icon: '✅',
    label: 'FINAL',
    className: 'event-final',
  },
};

export default function AgentTrace({ events = [] }) {
  const traceBottomRef = useRef(null);

  // Automatically scroll trace to the newest event as it arrives
  useEffect(() => {
    if (traceBottomRef.current) {
      traceBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events.length]);

  if (!events || events.length === 0) {
    return (
      <div className="trace-empty-container">
        <div className="trace-empty-icon">🧠</div>
        <h3>No Cognitive Events Yet</h3>
        <p className="trace-empty-text">
          Select a demo scenario or enter your repository objective above, then click <strong>RUN AGENT</strong>.
          The progressive cognitive trajectory will unfold in real time:
        </p>
        <div className="trace-loop-diagram">
          <span className="loop-step">🧠 PLAN</span>
          <span className="loop-arrow">→</span>
          <span className="loop-step">⚙️ ACT</span>
          <span className="loop-arrow">→</span>
          <span className="loop-step">👁 OBSERVE</span>
          <span className="loop-arrow">→</span>
          <span className="loop-step highlight-recover">🔄 REFLECT</span>
          <span className="loop-arrow">→</span>
          <span className="loop-step">⚙️ NEW ACT</span>
          <span className="loop-arrow">→</span>
          <span className="loop-step highlight-success">✅ FINAL</span>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-trace-timeline">
      <div className="timeline-header">
        <div className="timeline-title-wrap">
          <span className="trace-count-badge">{events.length} Events Logged</span>
          <span className="trace-subtitle">Autonomous Cognitive Loop Trajectory</span>
        </div>
      </div>

      <div className="trace-timeline-stream">
        {events.map((event, index) => {
          const rawType = (event.type || 'plan').toLowerCase();

          // Check if event represents a failure / error
          const isFailure =
            rawType === 'error' ||
            (rawType === 'tool_result' && event.status === 'error') ||
            (rawType === 'tool_result' && !!event.error);

          const type = isFailure ? 'error' : rawType;

          const config = EVENT_CONFIG[type] || {
            icon: '🔹',
            label: type.toUpperCase(),
            className: 'event-generic',
          };

          const stepNumber = event.step || index + 1;
          const timestamp = event.timestamp || '';
          const isRecoveryMoment = type === 'reflection' || (isFailure && !!event.recoveryPlan);

          return (
            <div
              key={event.id || event.step || index}
              className={`trace-node ${config.className} ${isFailure ? 'node-is-failure' : ''} ${isRecoveryMoment ? 'node-is-recovery' : ''}`}
            >
              {/* Timeline spine and node marker */}
              <div className="node-marker-col">
                <div
                  className={`node-marker ${isFailure ? 'marker-failure' : ''} ${type === 'reflection' ? 'marker-reflection' : ''}`}
                  title={`Step ${stepNumber}: ${config.label}`}
                >
                  <span className="marker-icon">{config.icon}</span>
                </div>
                {index < events.length - 1 && <div className="timeline-connector"></div>}
              </div>

              {/* Node Card Content */}
              <div className={`node-content-card ${isFailure ? 'content-card-failure' : ''}`}>
                <div className="node-header">
                  <div className="node-title-group">
                    <span className="node-step-tag">Step #{stepNumber}</span>
                    <span className={`node-type-badge type-${type}`}>
                      {config.icon} {config.label}
                    </span>
                    {isFailure && (
                      <span className="critical-moment-pill">⚠️ FAILURE ENCOUNTERED</span>
                    )}
                    {type === 'reflection' && (
                      <span className="cognitive-pivot-pill">🧠 AUTONOMOUS ADAPTATION</span>
                    )}
                    {event.title && <span className="node-custom-title">{event.title}</span>}
                  </div>
                  {timestamp && <span className="node-timestamp">{timestamp}</span>}
                </div>

                <div className="node-body">
                  {/* PLAN EVENT */}
                  {type === 'plan' && (
                    <div className="plan-content">
                      <p className="plan-text">{event.message || event.content || event.plan}</p>
                      {event.subgoals && (
                        <div className="plan-subgoals">
                          <span className="subgoals-label">Cognitive Sub-goals:</span>
                          <ul>
                            {event.subgoals.map((g, gi) => (
                              <li key={gi}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TOOL CALL EVENT */}
                  {type === 'tool_call' && (
                    <ToolCall
                      toolName={event.tool || event.toolName}
                      arguments={event.arguments || event.args}
                      status={event.status || 'EXECUTING'}
                      data={event.payload || event}
                    />
                  )}

                  {/* TOOL RESULT / OBSERVATION EVENT */}
                  {type === 'tool_result' && !isFailure && (
                    <div className="observation-content">
                      <div className="observation-header">
                        <span className="obs-label">
                          👁 Tool Output ({event.tool || 'system'}):
                        </span>
                        {event.exitCode !== undefined && (
                          <span className={`exit-code-tag code-${event.exitCode === 0 ? '0' : 'err'}`}>
                            exit {event.exitCode}
                          </span>
                        )}
                      </div>
                      <pre className="observation-pre">
                        {event.data ||
                          (typeof event.output === 'string'
                            ? event.output
                            : event.content || JSON.stringify(event, null, 2))}
                      </pre>
                    </div>
                  )}

                  {/* ERROR CARD EVENT (Prominent Tool Failure) */}
                  {isFailure && (
                    <ErrorCard
                      tool={event.tool || 'shell'}
                      error={event.error || event.message || event.data || 'Command failed with non-zero exit'}
                      recoveryPlan={event.recoveryPlan || event.recovery}
                      data={event}
                    />
                  )}

                  {/* REFLECTION EVENT */}
                  {type === 'reflection' && (
                    <div className="reflection-content">
                      <div className="reflection-quote-border">
                        <span className="reflection-heading">Self-Correction & Diagnostic Reasoning:</span>
                        <p className="reflection-text">
                          {event.message || event.content || event.reflection}
                        </p>
                      </div>
                      {event.hypothesis && (
                        <div className="hypothesis-box">
                          <span className="hypo-label">New Hypothesis:</span> {event.hypothesis}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FINAL RESULT EVENT */}
                  {type === 'final' && (
                    <FinalResult
                      response={event.message || event.response || event.content || event.summary}
                      verification={event.verification}
                      filesModified={event.filesModified || event.files}
                      result={event.result || event.payload}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {/* Invisible anchor for automatic scrolling */}
        <div ref={traceBottomRef} style={{ height: 1 }} />
      </div>
    </div>
  );
}
