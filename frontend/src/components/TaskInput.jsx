/**
 * TaskInput Component.
 *
 * Professional AI Developer Workspace Task Composer:
 * - Editorial Headline:
 *   "WHAT SHOULD"
 *   "REPOPILOT"
 *   "INVESTIGATE?"
 * - Quick actions: "Debug an error", "Run tests", "Investigate API", "Explain code"
 * - Large premium task composer textarea with exact placeholder:
 *   "Describe the bug, error, or behavior you want RepoPilot to investigate..."
 * - Keyboard shortcut: Ctrl + Enter (Windows) / Cmd + Enter (Mac)
 * - Below textarea: Repository selector, Branch selector, Small repository metadata
 * - Primary button: "Analyze Repository"
 */

import React, { useState, useRef } from 'react';
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
  Layers,
  ArrowRight
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

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!task.trim() || !repository.trim() || disabled) return;

    if (onRun) {
      onRun({
        repository,
        branch,
        task: task.trim(),
      });
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
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
      {/* 1. Large Editorial Headline: "WHAT SHOULD REPOPILOT INVESTIGATE?" */}
      <div className="composer-headline-block">
        <div className="composer-eyebrow-pill">
          <span className="eyebrow-pulse-dot" />
          <span>AUTONOMOUS COGNITIVE AGENT</span>
        </div>
        <h1 className="composer-editorial-headline">
          WHAT SHOULD<br />
          <span className="headline-gradient-span">REPOPILOT</span><br />
          INVESTIGATE?
        </h1>
        <p className="composer-subheadline">
          Provide an issue description, exception log, or test failure. The agent will formulate a plan,
          dispatch sandbox tools, learn from failures, and verify a solution.
        </p>
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

        {/* Large Textarea Area */}
        <div className="composer-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder="Describe the bug, error, or behavior you want RepoPilot to investigate..."
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={5}
            aria-label="Task description input"
          />

          <div className="composer-textarea-footer-hint">
            <span className="shortcut-hint-pill">
              <CornerDownLeft size={12} />
              <span>Press <strong>{isMac ? 'Cmd + Enter' : 'Ctrl + Enter'}</strong> to run</span>
            </span>
          </div>
        </div>

        {/* Repository & Branch Selectors + Primary Analyze Action */}
        <div className="composer-controls-row">
          <div className="selectors-group">
            {/* Repository Select */}
            <div className="selector-field">
              <span className="selector-label">
                <FolderGit2 size={13} className="selector-icon" />
                <span>Repository</span>
              </span>
              <select
                className="workspace-select"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                disabled={disabled}
                aria-label="Select target repository"
              >
                {REPO_OPTIONS.map((repo) => (
                  <option key={repo.value} value={repo.value}>
                    {repo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch Select */}
            <div className="selector-field">
              <span className="selector-label">
                <GitBranch size={13} className="selector-icon" />
                <span>Branch</span>
              </span>
              <select
                className="workspace-select branch-select"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={disabled}
                aria-label="Select repository branch"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="action-submit-group">
            <button
              type="button"
              className="primary-analyze-btn"
              onClick={handleSubmit}
              disabled={disabled || !task.trim()}
              title="Launch autonomous debugging agent (Analyze Repository)"
            >
              <Terminal size={15} />
              <span>Run Agent</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Repository Metadata Bar */}
        <div className="repo-metadata-bar">
          <div className="meta-item">
            <Cpu size={12} className="meta-icon" />
            <span>Sandbox: Docker Container (Python 3.14 + AST Runner)</span>
          </div>
          <span className="meta-sep">•</span>
          <div className="meta-item">
            <Layers size={12} className="meta-icon" />
            <span>Tools Armed: inspect_ast, search_codebase, run_pytest, apply_diff</span>
          </div>
        </div>
      </div>
    </div>
  );
}
