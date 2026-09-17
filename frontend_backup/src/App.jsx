/**
 * RepoPilot Main Application Dashboard.
 *
 * Owner: Person 3
 *
 * Responsibilities:
 * - Professional AI-agent dashboard layout.
 * - Progressive timer-based Mock Agent Mode:
 *   PLAN -> TOOL CALL -> TOOL RESULT -> ERROR -> REFLECTION -> NEW TOOL CALL -> SUCCESS -> FINAL
 * - Support demo modes:
 *   1. "Tool Failure Recovery" (Showcases autonomous error recovery)
 *   2. "Successful Debug" (Direct bug resolution)
 * - Transitions status dynamically:
 *   IDLE -> PLANNING -> EXECUTING -> OBSERVING -> RECOVERING -> EXECUTING -> COMPLETED
 * - Auto-scroll, prominent error display, and verified final resolution.
 */

import React, { useState, useRef, useEffect } from 'react';
import TaskInput from './components/TaskInput.jsx';
import AgentTrace from './components/AgentTrace.jsx';
import FinalResult from './components/FinalResult.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import {
  SCENARIOS,
  runMockAgentSimulation,
} from './services/mockAgent.js';

export default function App() {
  const [currentStatus, setCurrentStatus] = useState('IDLE');
  const [traceEvents, setTraceEvents] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [bannerNotice, setBannerNotice] = useState(null);
  const [demoScenario, setDemoScenario] = useState(SCENARIOS.FAILURE_RECOVERY);
  const [isRunningMock, setIsRunningMock] = useState(false);

  const cancelSimulationRef = useRef(null);

  // Cleanup active simulation on unmount
  useEffect(() => {
    return () => {
      if (cancelSimulationRef.current) {
        cancelSimulationRef.current();
      }
    };
  }, []);

  /**
   * onRun callback invoked when "RUN AGENT" button is clicked.
   * Runs the progressive mock agent simulation.
   */
  const handleRunAgent = ({ repository, task }) => {
    // Abort any ongoing run
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
    }

    setActiveTask({ repository, task });
    setIsRunningMock(true);
    setTraceEvents([]);
    setFinalResult(null);
    setCurrentStatus('PLANNING');
    setBannerNotice(
      `Mock Agent running scenario: "${demoScenario}". Watch the progressive cognitive loop unfold...`
    );

    // Launch progressive timer simulation
    cancelSimulationRef.current = runMockAgentSimulation({
      scenario: demoScenario,
      intervalMs: 1000,
      onEvent: (event) => {
        setTraceEvents((prev) => [...prev, event]);
        if (event.type === 'final') {
          setFinalResult({
            response: event.message || event.response || event.content,
            verification: event.verification,
            filesModified: event.filesModified,
          });
        }
      },
      onStatusChange: (status) => {
        setCurrentStatus(status);
      },
      onComplete: () => {
        setIsRunningMock(false);
        setCurrentStatus('COMPLETED');
        setBannerNotice(
          `Agent completed scenario: "${demoScenario}". Autonomous error recovery and fix verified!`
        );
      },
    });
  };

  /**
   * Stop / abort the active simulation
   */
  const handleStopSimulation = () => {
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
      cancelSimulationRef.current = null;
    }
    setIsRunningMock(false);
    setCurrentStatus('IDLE');
    setBannerNotice('Mock agent execution stopped.');
  };

  /**
   * Reset the dashboard to pristine state
   */
  const handleClearAll = () => {
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
      cancelSimulationRef.current = null;
    }
    setIsRunningMock(false);
    setCurrentStatus('IDLE');
    setTraceEvents([]);
    setFinalResult(null);
    setActiveTask(null);
    setBannerNotice(null);
  };

  return (
    <div className="dashboard-container">
      {/* 1. Header */}
      <header className="dashboard-header">
        <div className="header-brand">
          <div className="logo-badge">
            <span className="logo-symbol">⚡</span>
            <div className="brand-text">
              <h1 className="brand-title">REPOPILOT</h1>
              <span className="brand-tagline">Autonomous Software Debugging Agent</span>
            </div>
          </div>
          <div className="hackathon-badge">
            <span className="theme-tag-icon">🧠</span>
            <span className="theme-tag-text">BUILD THE BRAIN, NOT THE PUPPET</span>
          </div>
        </div>

        {/* Presentation & Status Controls */}
        <div className="header-status-area">
          <div className="agent-status-card">
            <span className="status-label">AGENT STATUS</span>
            <StatusBadge status={currentStatus} />
          </div>

          <div className="header-actions">
            {isRunningMock ? (
              <button
                type="button"
                className="stop-btn"
                onClick={handleStopSimulation}
                title="Stop running simulation"
              >
                ⏹ Stop Agent
              </button>
            ) : (
              <button
                type="button"
                className="preview-btn"
                onClick={() =>
                  handleRunAgent({
                    repository: 'demo/projects/broken-login',
                    task: 'Fix the login API returning HTTP 500.',
                  })
                }
                title="Run progressive mock agent demonstration"
              >
                ⚡ Run Demo Simulation
              </button>
            )}

            {(traceEvents.length > 0 || currentStatus !== 'IDLE') && (
              <button
                type="button"
                className="reset-btn"
                onClick={handleClearAll}
                title="Reset dashboard"
                disabled={isRunningMock}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </header>

      {bannerNotice && (
        <div className="dashboard-notice-banner" role="status">
          <span className="notice-icon">ℹ️</span>
          <span className="notice-text">{bannerNotice}</span>
          <button
            type="button"
            className="notice-dismiss"
            onClick={() => setBannerNotice(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <main className="dashboard-main">
        {/* 2. Demo Mode Selector & Task Input Area */}
        <section className="dashboard-section input-panel">
          {/* Demo Mode Switcher Bar */}
          <div className="demo-mode-bar">
            <div className="demo-mode-title">
              <span className="demo-badge">DEMO MODE</span>
              <span className="demo-hint">Select simulation scenario for presentation:</span>
            </div>
            <div className="demo-scenario-pills">
              <button
                type="button"
                className={`demo-pill ${demoScenario === SCENARIOS.FAILURE_RECOVERY ? 'active' : ''}`}
                onClick={() => setDemoScenario(SCENARIOS.FAILURE_RECOVERY)}
                disabled={isRunningMock}
              >
                <span className="pill-dot"></span>
                <strong>Tool Failure Recovery</strong>
                <span className="pill-desc">(SHELL → ERROR → REFLECTION → SUCCESS)</span>
              </button>
              <button
                type="button"
                className={`demo-pill ${demoScenario === SCENARIOS.SUCCESSFUL_DEBUG ? 'active' : ''}`}
                onClick={() => setDemoScenario(SCENARIOS.SUCCESSFUL_DEBUG)}
                disabled={isRunningMock}
              >
                <span className="pill-dot"></span>
                <strong>Successful Debug</strong>
                <span className="pill-desc">(Inspect → Patch → Verify)</span>
              </button>
            </div>
          </div>

          <TaskInput onRun={handleRunAgent} disabled={isRunningMock} />

          {/* Cognitive Loop Stage Reference Bar */}
          <div className="cognitive-flow-bar">
            <span className="flow-title">COGNITIVE ARCHITECTURE:</span>
            <div className="flow-steps">
              <span className={`step-chip ${currentStatus === 'PLANNING' ? 'active' : ''}`}>
                🧠 PLAN
              </span>
              <span className="step-arrow">→</span>
              <span className={`step-chip ${currentStatus === 'EXECUTING' ? 'active' : ''}`}>
                ⚙️ ACT (TOOL)
              </span>
              <span className="step-arrow">→</span>
              <span className={`step-chip ${currentStatus === 'OBSERVING' ? 'active' : ''}`}>
                👁 OBSERVE
              </span>
              <span className="step-arrow">→</span>
              <span
                className={`step-chip recover-chip ${currentStatus === 'RECOVERING' ? 'active' : ''}`}
              >
                🔄 REFLECT & RECOVER
              </span>
              <span className="step-arrow">→</span>
              <span className="step-chip">🔁 REPEAT</span>
              <span className="step-arrow">→</span>
              <span className={`step-chip ${currentStatus === 'COMPLETED' ? 'active' : ''}`}>
                ✅ FINAL
              </span>
            </div>
          </div>
        </section>

        {/* 3. Active Status Ribbon for Presentation View */}
        <section className="status-overview-panel">
          <div className="status-overview-content">
            <span className="status-overview-label">CURRENT COGNITIVE PHASE:</span>
            <strong className="status-overview-value">{currentStatus}</strong>
            {activeTask && (
              <span className="active-task-pill">
                Target: <code>{activeTask.repository}</code>
              </span>
            )}
            {isRunningMock && (
              <span className="running-live-indicator">
                <span className="live-pulse"></span>
                Simulating agent in real time ({traceEvents.length} / 10 steps)
              </span>
            )}
          </div>

          {/* Quick status testing chips for judges */}
          <div className="status-test-strip">
            <span className="test-strip-label">Manual Status Override:</span>
            {[
              'IDLE',
              'PLANNING',
              'EXECUTING',
              'OBSERVING',
              'RECOVERING',
              'COMPLETED',
              'FAILED',
            ].map((st) => (
              <button
                key={st}
                type="button"
                className={`test-st-btn ${currentStatus === st ? 'selected' : ''}`}
                onClick={() => setCurrentStatus(st)}
                disabled={isRunningMock}
              >
                {st}
              </button>
            ))}
          </div>
        </section>

        {/* 4. Critical UX Moment Banner (visible during or after recovery) */}
        {traceEvents.some((e) => e.status === 'RECOVERING' || e.type === 'reflection' || e.error) && (
          <section className="autonomous-recovery-banner">
            <div className="arb-left">
              <span className="arb-icon">⚡</span>
              <div>
                <strong>Autonomous Self-Correction in Action:</strong>
                <span className="arb-text">
                  Agent encountered tool failure (SHELL exit code 1) → paused to reflect → adjusted hypothesis → formulated new tool call → verified resolution!
                </span>
              </div>
            </div>
            <span className="arb-tag">BRAIN, NOT PUPPET</span>
          </section>
        )}

        {/* 5. Agent Execution Trace */}
        <section className="dashboard-section trace-panel">
          <div className="section-title-bar">
            <div className="title-left">
              <span className="section-symbol">🔍</span>
              <h2>AGENT EXECUTION TRACE</h2>
            </div>
            <div className="title-right">
              {isRunningMock && <span className="trace-live-badge">STREAMING PROGRESSIVELY...</span>}
              <span className="section-meta">Sequential Cognitive Trajectory</span>
            </div>
          </div>

          <AgentTrace events={traceEvents} />
        </section>

        {/* 6. Final Result */}
        {finalResult && (
          <section className="dashboard-section final-panel">
            <div className="section-title-bar">
              <div className="title-left">
                <span className="section-symbol">🏁</span>
                <h2>FINAL RESULT</h2>
              </div>
              <span className="section-meta">Autonomous Resolution Complete</span>
            </div>

            <FinalResult result={finalResult} />
          </section>
        )}
      </main>

      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>RepoPilot Autonomous AI Debugging Agent • Mock Agent Mode Active</span>
        </div>
        <div className="footer-right">
          <span>Track: "Build the Brain, Not the Puppet"</span>
        </div>
      </footer>
    </div>
  );
}
