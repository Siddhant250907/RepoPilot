/**
 * Navbar Component.
 *
 * Workspace top navigation bar:
 * - Breadcrumbs
 * - Cognitive status indicator
 * - Simulation Scenario selector
 * - Mode indicator (Mock vs Backend API)
 * - Quick run / stop buttons
 * - Mobile sidebar toggle
 */

import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { SCENARIOS } from '../services/mockAgent.js';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Cpu, 
  Layers, 
  Menu, 
  Sparkles, 
  User,
  Radio,
  Sliders
} from 'lucide-react';
import { useAuth } from '../services/authContext.jsx';

export default function Navbar({
  currentStatus,
  isRunning,
  demoScenario,
  setDemoScenario,
  onRunDemo,
  onStop,
  onReset,
  onOpenLogin,
  onToggleSidebar,
  activeTask,
  isApiMode,
  setIsApiMode,
  hasEvents,
  onReturnLanding,
}) {
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="workspace-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-breadcrumbs">
          <span 
            className="breadcrumb-root" 
            onClick={onReturnLanding}
            style={{ cursor: onReturnLanding ? 'pointer' : 'default', fontWeight: 600 }}
            title={onReturnLanding ? 'Return to Landing Page' : undefined}
          >
            RepoPilot
          </span>
          <span className="breadcrumb-separator">•</span>
          <span className="breadcrumb-current">
            Autonomous AI Software Debugging Agent
          </span>
        </div>

        {/* Live status badge */}
        <div className="navbar-status-wrap">
          <StatusBadge status={currentStatus} />
        </div>
      </div>

      <div className="navbar-right">
        {/* Scenario Picker Pill Bar */}
        <div className="scenario-selector-bar">
          <span className="scenario-bar-label">Scenario:</span>
          <select
            className="scenario-select"
            value={demoScenario}
            onChange={(e) => setDemoScenario(e.target.value)}
            disabled={isRunning}
            aria-label="Select simulation scenario"
          >
            <option value={SCENARIOS.FAILURE_RECOVERY}>
              Tool Failure & Recovery (Recommended)
            </option>
            <option value={SCENARIOS.SUCCESSFUL_DEBUG}>
              Direct Successful Debug
            </option>
          </select>
        </div>

        {/* Execution Control Buttons */}
        <div className="navbar-actions">
          {isRunning ? (
            <button
              type="button"
              className="navbar-btn stop-action-btn"
              onClick={onStop}
              title="Abort agent execution"
            >
              <Square size={14} fill="currentColor" />
              <span>Stop Agent</span>
            </button>
          ) : (
            <button
              type="button"
              className="navbar-btn run-demo-action-btn"
              onClick={onRunDemo}
              title="Launch progressive cognitive simulation"
            >
              <Sparkles size={14} />
              <span>Run Demo</span>
            </button>
          )}

          {hasEvents && !isRunning && (
            <button
              type="button"
              className="navbar-btn reset-action-btn"
              onClick={onReset}
              title="Reset dashboard and clear trace"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          {!isAuthenticated && (
            <button
              type="button"
              className="navbar-btn login-action-btn"
              onClick={onOpenLogin}
            >
              <User size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
