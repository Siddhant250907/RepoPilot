/**
 * RepoPilot Main Application.
 *
 * Professional AI Developer Workspace:
 * - Desktop Layout: LEFT SIDEBAR | MAIN WORKSPACE | RIGHT RUN DETAILS
 * - Left Sidebar: RepoPilot branding, + New Task, Workspace, Runs, Projects,
 *   dividers, Documentation, Settings, and User Profile.
 * - Main Area: Dynamic Header ("Good evening." / "What should RepoPilot investigate?"),
 *   Large Task Composer with quick actions & keyboard shortcut (Ctrl+Enter / Cmd+Enter),
 *   and Recent Runs table.
 * - Right Panel: Active Run Details with Repository, Branch, Agent, Steps, Tools used,
 *   Errors, Recovery attempts, Duration timer, and useful empty state when idle.
 * - 100% preservation of mock agent progressive simulation.
 */

import React, { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext.jsx';
import { ToastProvider, useToast } from './services/ToastContext.jsx';
import LandingPage from './components/LandingPage.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import Navbar from './components/Navbar.jsx';
import TaskInput from './components/TaskInput.jsx';
import ExecutionView from './components/ExecutionView.jsx';
import RunInfoPanel from './components/RunInfoPanel.jsx';
import LoginModal from './components/LoginModal.jsx';
import DocsModal from './components/DocsModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import ToastContainer from './components/Toast.jsx';
import { SCENARIOS, runMockAgentSimulation } from './services/mockAgent.js';
import { 
  History, 
  CheckCircle2, 
  ArrowRight, 
  FolderGit2, 
  GitBranch,
  Play,
  RotateCcw,
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';

const INITIAL_RECENT_RUNS = [
  {
    id: 'run-auth-failure',
    title: 'Fix authentication failure',
    repository: 'demo/projects/broken-login',
    branch: 'main',
    task: 'Fix the login API returning HTTP 500 due to unhandled KeyError in JWT configuration payload.',
    timestamp: '10m ago',
    status: 'Completed',
    steps: '7 steps',
    toolsUsed: ['search_codebase', 'inspect_ast', 'run_pytest', 'apply_diff'],
    errors: 1,
    recoveries: 1,
    duration: 14,
    scenario: SCENARIOS.FAILURE_RECOVERY,
  },
  {
    id: 'run-api-timeout',
    title: 'Investigate API timeout',
    repository: 'demo/projects/socket-gateway',
    branch: 'dev',
    task: 'Investigate API endpoint latency timeout and unhandled response parsing in gateway.',
    timestamp: '42m ago',
    status: 'Completed',
    steps: '9 steps',
    toolsUsed: ['search_codebase', 'run_pytest', 'apply_diff'],
    errors: 1,
    recoveries: 1,
    duration: 18,
    scenario: SCENARIOS.FAILURE_RECOVERY,
  },
  {
    id: 'run-broken-tests',
    title: 'Repair broken tests',
    repository: 'demo/projects/calculator-cli',
    branch: 'fix/eval-bug',
    task: 'Resolve IndexError in array token parser during multi-operator expression evaluation.',
    timestamp: '2h ago',
    status: 'Completed',
    steps: '5 steps',
    toolsUsed: ['inspect_ast', 'run_pytest', 'apply_diff'],
    errors: 0,
    recoveries: 0,
    duration: 9,
    scenario: SCENARIOS.SUCCESSFUL_DEBUG,
  },
  {
    id: 'run-db-error',
    title: 'Explain database error',
    repository: 'demo/projects/broken-login',
    branch: 'main',
    task: 'Analyze SQL query transaction deadlock and explain potential edge-case race conditions.',
    timestamp: 'Yesterday',
    status: 'Completed',
    steps: '6 steps',
    toolsUsed: ['inspect_ast', 'search_codebase'],
    errors: 0,
    recoveries: 0,
    duration: 12,
    scenario: SCENARIOS.SUCCESSFUL_DEBUG,
  },
];

function AppContent() {
  const { user } = useAuth();
  const { toast } = useToast();

  // App Views: 'landing' | 'workspace'
  const [currentView, setCurrentView] = useState('landing');
  // Workspace Mode: 'composer' | 'execution'
  const [workspaceMode, setWorkspaceMode] = useState('composer');

  // Agent State
  const [currentStatus, setCurrentStatus] = useState('IDLE');
  const [traceEvents, setTraceEvents] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [demoScenario, setDemoScenario] = useState(SCENARIOS.FAILURE_RECOVERY);
  const [isRunningMock, setIsRunningMock] = useState(false);

  // Live Running Duration (in seconds)
  const [durationSeconds, setDurationSeconds] = useState(0);
  const durationTimerRef = useRef(null);

  // Configuration
  const [simulationSpeed, setSimulationSpeed] = useState(1000);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:8000/api');

  // UI Drawer / Panel Toggles
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Recent Runs List
  const [recentRuns, setRecentRuns] = useState(INITIAL_RECENT_RUNS);

  const cancelSimulationRef = useRef(null);

  // Handle duration timer while running
  useEffect(() => {
    if (isRunningMock) {
      const startTime = Date.now();
      durationTimerRef.current = setInterval(() => {
        setDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [isRunningMock]);

  // Cleanup simulation timer on unmount
  useEffect(() => {
    return () => {
      if (cancelSimulationRef.current) {
        cancelSimulationRef.current();
      }
    };
  }, []);

  /**
   * Launch progressive mock agent execution.
   */
  const handleRunAgent = ({ repository, branch, task, scenario }) => {
    // Abort active run if any
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
    }

    const resolvedScenario = scenario || demoScenario;
    const taskData = {
      repository: repository || 'demo/projects/broken-login',
      branch: branch || 'main',
      task: task || 'Fix the login API returning HTTP 500.',
      scenario: resolvedScenario,
    };

    setActiveTask(taskData);
    setIsRunningMock(true);
    setTraceEvents([]);
    setDurationSeconds(0);
    setCurrentStatus('PLANNING');
    setWorkspaceMode('execution');
    if (currentView !== 'workspace') {
      setCurrentView('workspace');
    }

    toast.info(`Agent analyzing repository on branch: ${taskData.branch}`);

    // Progressive timer simulation
    cancelSimulationRef.current = runMockAgentSimulation({
      scenario: resolvedScenario,
      intervalMs: simulationSpeed,
      onEvent: (event) => {
        setTraceEvents((prev) => [...prev, event]);
      },
      onStatusChange: (status) => {
        setCurrentStatus(status);
      },
      onComplete: (finalEvent) => {
        setIsRunningMock(false);
        setCurrentStatus('COMPLETED');
        toast.success('Agent verified resolution with zero regressions!');

        // Append to recent runs
        const newRunItem = {
          id: `run_${Date.now()}`,
          title: taskData.task.slice(0, 36) + (taskData.task.length > 36 ? '...' : ''),
          repository: taskData.repository,
          branch: taskData.branch,
          task: taskData.task,
          scenario: resolvedScenario,
          status: 'Completed',
          timestamp: 'Just now',
          steps: `${resolvedScenario === SCENARIOS.FAILURE_RECOVERY ? 7 : 5} steps`,
          toolsUsed: ['search_codebase', 'inspect_ast', 'run_pytest', 'apply_diff'],
          errors: resolvedScenario === SCENARIOS.FAILURE_RECOVERY ? 1 : 0,
          recoveries: resolvedScenario === SCENARIOS.FAILURE_RECOVERY ? 1 : 0,
          duration: durationSeconds || 14,
        };

        setRecentRuns((prev) => [newRunItem, ...prev.slice(0, 9)]);
      },
    });
  };

  /**
   * Stop ongoing simulation
   */
  const handleStopSimulation = () => {
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
      cancelSimulationRef.current = null;
    }
    setIsRunningMock(false);
    setCurrentStatus('IDLE');
    toast.warning('Agent simulation aborted by user');
  };

  /**
   * Reset workspace to composer & clean state
   */
  const handleReset = () => {
    if (cancelSimulationRef.current) {
      cancelSimulationRef.current();
      cancelSimulationRef.current = null;
    }
    setIsRunningMock(false);
    setCurrentStatus('IDLE');
    setTraceEvents([]);
    setActiveTask(null);
    setDurationSeconds(0);
    setWorkspaceMode('composer');
    toast.info('Workspace reset to initial state');
  };

  /**
   * Replay a specific run from Recent Runs
   */
  const handleReplayRun = (run) => {
    setDemoScenario(run.scenario);
    handleRunAgent({
      repository: run.repository,
      branch: run.branch,
      task: run.task,
      scenario: run.scenario,
    });
  };

  /**
   * Select a run to view in Right Panel details
   */
  const handleSelectRun = (run) => {
    setActiveTask({
      repository: run.repository,
      branch: run.branch,
      task: run.task,
      scenario: run.scenario,
      steps: run.steps,
      errors: run.errors,
      recoveries: run.recoveries,
      duration: run.duration,
      toolsUsed: run.toolsUsed,
    });
    setDurationSeconds(run.duration);
    toast.info(`Inspecting run: "${run.title}"`);
  };

  /**
   * New Task action from sidebar
   */
  const handleNewTask = () => {
    if (isRunningMock) {
      handleStopSimulation();
    }
    setWorkspaceMode('composer');
    if (currentView !== 'workspace') {
      setCurrentView('workspace');
    }
    setActiveTask(null);
    setTraceEvents([]);
    setDurationSeconds(0);
    setCurrentStatus('IDLE');
    // Focus textarea if on screen
    setTimeout(() => {
      const textarea = document.getElementById('task-input-textarea');
      if (textarea) textarea.focus();
    }, 50);
  };

  return (
    <div className="app-root">
      {/* 1. Global Toast Notifications */}
      <ToastContainer />

      {/* 2. Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        simulationSpeed={simulationSpeed}
        setSimulationSpeed={setSimulationSpeed}
        apiEndpoint={apiEndpoint}
        setApiEndpoint={setApiEndpoint}
      />

      {/* 3. Conditional View: Landing vs Login Screen vs 3-Column Workspace */}
      {currentView === 'landing' ? (
        <LandingPage
          onStartDebugging={() => {
            setCurrentView('workspace');
            setWorkspaceMode('composer');
          }}
          onViewDemo={() => {
            setCurrentView('workspace');
            handleRunAgent({
              repository: 'demo/projects/broken-login',
              branch: 'main',
              task: 'Fix the login API returning HTTP 500 due to unhandled KeyError in JWT configuration payload.',
              scenario: SCENARIOS.FAILURE_RECOVERY,
            });
          }}
          onOpenLogin={() => setCurrentView('login')}
          onOpenDocs={() => setIsDocsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : currentView === 'login' ? (
        <LoginScreen
          onLoginSuccess={() => {
            setCurrentView('workspace');
            setWorkspaceMode('composer');
          }}
          onBackToLanding={() => setCurrentView('landing')}
        />
      ) : (
        /* ==================================================================
           MAIN WORKSPACE 3-COLUMN DESKTOP LAYOUT:
           [ LEFT SIDEBAR ] [ MAIN WORKSPACE ] [ RIGHT RUN DETAILS ]
           ================================================================== */
        <div className="workspace-layout">
          {/* COLUMN 1: LEFT SIDEBAR */}
          <Sidebar
            activeView={currentView}
            setActiveView={(view) => {
              if (view === 'landing') setCurrentView('landing');
              if (view === 'login') setCurrentView('login');
              if (view === 'workspace') setCurrentView('workspace');
            }}
            onNewTask={handleNewTask}
            onOpenDocs={() => setIsDocsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenLogin={() => setCurrentView('login')}
            onLogout={() => setCurrentView('landing')}
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            recentRunsCount={recentRuns.length}
          />

          {/* COLUMN 2: MAIN WORKSPACE */}
          <div className="workspace-main-stage">
            {/* Top Workspace Navbar */}
            <Navbar
              currentStatus={currentStatus}
              isRunning={isRunningMock}
              demoScenario={demoScenario}
              setDemoScenario={setDemoScenario}
              onRunDemo={() =>
                handleRunAgent({
                  repository: 'demo/projects/broken-login',
                  branch: 'main',
                  task: 'Fix the login API returning HTTP 500.',
                  scenario: demoScenario,
                })
              }
              onStop={handleStopSimulation}
              onReset={handleReset}
              onOpenLogin={() => setCurrentView('login')}
              onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              onReturnLanding={() => setCurrentView('landing')}
              activeTask={activeTask}
              hasEvents={traceEvents.length > 0}
            />

            {/* Dynamic Content Area: Composer & Recent Runs vs Live Execution */}
            <div className="workspace-body-scroll">
              {workspaceMode === 'composer' ? (
                <div className="composer-workspace-container">
                  {/* Task Composer with Header, Quick Actions, and Input */}
                  <TaskInput onRun={handleRunAgent} disabled={isRunningMock} />

                  {/* RECENT RUNS SECTION */}
                  <div id="recent-runs-section" className="recent-runs-container">
                    <div className="recent-runs-header-row">
                      <div className="runs-heading-group">
                        <History size={16} className="runs-header-icon" />
                        <h2 className="recent-runs-title">Recent Runs</h2>
                      </div>
                      <span className="runs-subtitle-hint">
                        Select a past run to view telemetry or click replay
                      </span>
                    </div>

                    {/* Table-like clean list with hierarchy, whitespace, subtle borders */}
                    <div className="recent-runs-table">
                      <div className="runs-table-head">
                        <span className="col-head col-title">TITLE</span>
                        <span className="col-head col-repo">REPOSITORY / BRANCH</span>
                        <span className="col-head col-time">TIMESTAMP</span>
                        <span className="col-head col-steps">STEPS</span>
                        <span className="col-head col-status">STATUS</span>
                        <span className="col-head col-action">ACTION</span>
                      </div>

                      <div className="runs-table-body">
                        {recentRuns.map((run) => (
                          <div
                            key={run.id}
                            className={`run-table-row ${
                              activeTask?.repository === run.repository &&
                              activeTask?.task === run.task
                                ? 'selected'
                                : ''
                            }`}
                            onClick={() => handleSelectRun(run)}
                            title="Click to view run details in the right panel"
                          >
                            {/* Title with subtle icon */}
                            <div className="col-cell col-title">
                              <span className="run-status-bullet" />
                              <span className="run-title-text">{run.title}</span>
                            </div>

                            {/* Repo & Branch */}
                            <div className="col-cell col-repo">
                              <code className="repo-badge-mono">
                                {run.repository}
                                <span className="branch-sep">:</span>
                                {run.branch}
                              </code>
                            </div>

                            {/* Timestamp */}
                            <div className="col-cell col-time">
                              <span className="cell-muted-text">{run.timestamp}</span>
                            </div>

                            {/* Steps */}
                            <div className="col-cell col-steps">
                              <span className="cell-steps-pill">{run.steps}</span>
                            </div>

                            {/* Status */}
                            <div className="col-cell col-status">
                              <span className="status-pill-completed">
                                <CheckCircle2 size={12} />
                                <span>{run.status}</span>
                              </span>
                            </div>

                            {/* Action Button */}
                            <div className="col-cell col-action">
                              <button
                                type="button"
                                className="row-replay-action-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReplayRun(run);
                                }}
                                title="Replay this run"
                              >
                                <span>Replay</span>
                                <ArrowRight size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* LIVE EXECUTION VIEW */
                <ExecutionView
                  activeTask={activeTask}
                  currentStatus={currentStatus}
                  traceEvents={traceEvents}
                  isRunning={isRunningMock}
                  onStop={handleStopSimulation}
                  onReset={handleReset}
                  onRunAgain={() =>
                    handleRunAgent({
                      repository: activeTask?.repository,
                      branch: activeTask?.branch,
                      task: activeTask?.task,
                      scenario: activeTask?.scenario || demoScenario,
                    })
                  }
                  onBackToComposer={() => setWorkspaceMode('composer')}
                  demoScenario={demoScenario}
                />
              )}
            </div>
          </div>

          {/* COLUMN 3: RIGHT RUN DETAILS */}
          <RunInfoPanel
            activeTask={activeTask}
            events={traceEvents}
            currentStatus={currentStatus}
            isRunning={isRunningMock}
            duration={durationSeconds}
          />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
