/**
 * TaskInput Component.
 *
 * Professional AI Developer Workspace Task Composer:
 * - Header: "Good evening." / "What should RepoPilot investigate?"
 * - Quick actions: "Debug an error", "Run tests", "Investigate API", "Explain code"
 * - Large premium task composer textarea with placeholder:
 *   "Describe the bug, error, or behavior you want RepoPilot to investigate..."
 * - Keyboard shortcut: Ctrl + Enter (Windows) / Cmd + Enter (Mac)
 * - Below textarea: Repository selector, Branch selector, Small repository metadata
 * - Primary button: "Analyze Repository"
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderGit2, 
  GitBranch,
  Terminal, 
  Sparkles, 
  Play, 
  Bug, 
  FlaskConical, 
  Network, 
  Code2, 
  CornerDownLeft,
  Cpu,
  Layers
} from 'lucide-react';

const REPO_OPTIONS = [
  { value: 'demo/projects/broken-login', label: 'demo/projects/broken-login (Flask Auth)' },
  { value: 'demo/projects/calculator-cli', label: 'demo/projects/calculator-cli (CLI Parser)' },
  { value: 'demo/projects/socket-gateway', label: 'demo/projects/socket-gateway (FastAPI WS)' },
];

const BRANCH_OPTIONS = [
  { value: 'main', label: 'main' },
  { value: 'dev', label: 'dev' },
  { value: 'fix/login-500', label: 'fix/login-500' },
  { value: 'staging', label: 'staging' },
];

const QUICK_ACTIONS = [
  {
    id: 'debug-error',
    label: 'Debug an error',
    icon: <Bug size={14} />,
    repo: 'demo/projects/broken-login',
    branch: 'main',
    taskText: 'Investigate and fix unhandled KeyError in authentication token generation leading to HTTP 500.',
  },
  {
    id: 'run-tests',
    label: 'Run tests',
    icon: <FlaskConical size={14} />,
    repo: 'demo/projects/calculator-cli',
    branch: 'fix/eval-bug',
    taskText: 'Execute pytest reproduction test suite, diagnose failing assertions, and resolve root cause with zero regressions.',
  },
  {
    id: 'investigate-api',
    label: 'Investigate API',
    icon: <Network size={14} />,
    repo: 'demo/projects/socket-gateway',
    branch: 'dev',
    taskText: 'Investigate API endpoint latency timeout and unhandled response parsing in gateway.',
  },
  {
    id: 'explain-code',
    label: 'Explain code',
    icon: <Code2 size={14} />,
    repo: 'demo/projects/broken-login',
    branch: 'main',
    taskText: 'Analyze codebase architecture, trace data flow, and identify potential concurrency edge cases.',
  },
];

export default function TaskInput({ onRun, disabled = false, initialRepo, initialBranch }) {
  const [repository, setRepository] = useState(initialRepo || 'demo/projects/broken-login');
  const [branch, setBranch] = useState(initialBranch || 'main');
  const [task, setTask] = useState('');
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  const textareaRef = useRef(null);

  // Determine dynamic greeting (defaults to "Good evening.")
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!task.trim() || !repository.trim() || disabled) return;

    if (onRun) {
      onRun({
        repository: repository.trim(),
        branch: branch.trim(),
        task: task.trim(),
      });
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickActionClick = (action) => {
    if (disabled) return;
    setActiveQuickAction(action.id);
    setTask(action.taskText);
    setRepository(action.repo);
    setBranch(action.branch);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="workspace-composer-root">
      {/* 1. Header: "Good evening." / "What should RepoPilot investigate?" */}
      <div className="composer-headline-block">
        <h1 className="greeting-headline">{getGreeting()}</h1>
        <p className="greeting-subheadline">What should RepoPilot investigate?</p>
      </div>

      {/* 2. Large Premium Task Composer Card */}
      <div className="task-composer-card">
        {/* Quick Actions Bar */}
        <div className="quick-actions-bar">
          <span className="quick-actions-label">Quick actions:</span>
          <div className="quick-actions-group">
            {QUICK_ACTIONS.map((action) => {
              const isActive = activeQuickAction === action.id;
              return (
                <button
                  key={action.id}
                  type="button"
                  className={`quick-action-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleQuickActionClick(action)}
                  disabled={disabled}
                  title={`Auto-fill task: ${action.label}`}
                >
                  <span className="action-pill-icon">{action.icon}</span>
                  <span className="action-pill-text">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea Form */}
        <form onSubmit={handleSubmit} className="task-form">
          <div className="textarea-container">
            <textarea
              ref={textareaRef}
              id="task-input-textarea"
              rows={4}
              className="premium-task-textarea"
              placeholder="Describe the bug, error, or behavior you want RepoPilot to investigate..."
              value={task}
              onChange={(e) => {
                setTask(e.target.value);
                if (activeQuickAction) setActiveQuickAction(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              required
            />
          </div>

          {/* Controls Bar Below Textarea */}
          <div className="composer-bottom-bar">
            <div className="composer-selectors-group">
              {/* Repository Selector */}
              <div className="selector-item repo-selector-item">
                <FolderGit2 size={14} className="selector-icon" />
                <select
                  id="repository-selector"
                  className="composer-select repo-select"
                  value={repository}
                  onChange={(e) => setRepository(e.target.value)}
                  disabled={disabled}
                  title="Target repository"
                >
                  {REPO_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch Selector */}
              <div className="selector-item branch-selector-item">
                <GitBranch size={13} className="selector-icon" />
                <select
                  id="branch-selector"
                  className="composer-select branch-select"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={disabled}
                  title="Target branch"
                >
                  {BRANCH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* Small Repository Metadata */}
              <div className="repo-metadata-pill" title="Environment runtime & sandbox details">
                <span className="meta-dot"></span>
                <span className="meta-text">Python 3.11 • pytest • sandbox</span>
              </div>
            </div>

            {/* Primary Action Button: "Analyze Repository" */}
            <div className="composer-submit-group">
              <button
                type="submit"
                id="analyze-repository-btn"
                className="analyze-repository-btn"
                disabled={disabled || !task.trim() || !repository.trim()}
              >
                <Play size={15} fill="currentColor" />
                <span>{disabled ? 'Analyzing...' : 'Analyze Repository'}</span>
                <span className="shortcut-badge">
                  {isMac ? '⌘↵' : 'Ctrl+↵'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
