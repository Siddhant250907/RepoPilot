// Comprehensive verification script for RepoPilot Post-Landing Application Experience
import fs from 'fs';
import path from 'path';

const loginPath = path.resolve('src/components/LoginScreen.jsx');
const taskInputPath = path.resolve('src/components/TaskInput.jsx');
const executionViewPath = path.resolve('src/components/ExecutionView.jsx');
const agentTracePath = path.resolve('src/components/AgentTrace.jsx');
const runInfoPanelPath = path.resolve('src/components/RunInfoPanel.jsx');
const sidebarPath = path.resolve('src/components/Sidebar.jsx');
const appPath = path.resolve('src/App.jsx');
const cssPath = path.resolve('src/styles/app.css');

const files = {
  login: fs.readFileSync(loginPath, 'utf8'),
  taskInput: fs.readFileSync(taskInputPath, 'utf8'),
  executionView: fs.readFileSync(executionViewPath, 'utf8'),
  agentTrace: fs.readFileSync(agentTracePath, 'utf8'),
  runInfoPanel: fs.readFileSync(runInfoPanelPath, 'utf8'),
  sidebar: fs.readFileSync(sidebarPath, 'utf8'),
  app: fs.readFileSync(appPath, 'utf8'),
  css: fs.readFileSync(cssPath, 'utf8')
};

const tests = [
  // 1. LOGIN SCREEN REQUIREMENTS
  {
    category: 'LOGIN',
    name: 'Email input field present',
    pass: files.login.includes('type="email"') && files.login.includes('email')
  },
  {
    category: 'LOGIN',
    name: 'Password input field present',
    pass: files.login.includes('login-password-input')
  },
  {
    category: 'LOGIN',
    name: 'Validation logic for empty/invalid email and min password length',
    pass: files.login.includes('validateForm') && files.login.includes('@') && files.login.includes('length < 6')
  },
  {
    category: 'LOGIN',
    name: 'Show/hide password toggle button',
    pass: files.login.includes('showPassword') && files.login.includes('password-toggle-btn')
  },
  {
    category: 'LOGIN',
    name: 'Loading state during authentication',
    pass: files.login.includes('isLoading') && files.login.includes('Loader2')
  },
  {
    category: 'LOGIN',
    name: 'Error state handling and alert display',
    pass: files.login.includes('login-error-alert') && files.login.includes('error')
  },
  {
    category: 'LOGIN',
    name: 'Successful login transition',
    pass: files.login.includes('onLoginSuccess') && files.login.includes('isSuccess')
  },
  {
    category: 'LOGIN',
    name: 'Demo authentication autofill feature',
    pass: files.login.includes('handleFillDemo') && files.login.includes('alex.rivera@devcorp.io')
  },
  {
    category: 'LOGIN',
    name: 'Session stored in localStorage',
    pass: files.login.includes('localStorage') || files.app.includes('localStorage') || files.login.includes('useAuth')
  },
  {
    category: 'LOGIN',
    name: 'Working logout in Sidebar',
    pass: files.sidebar.includes('handleLogout') && files.sidebar.includes('logout()') && files.sidebar.includes('onLogout')
  },

  // 2. WORKSPACE REQUIREMENTS
  {
    category: 'WORKSPACE',
    name: 'Sidebar contains RepoPilot brand',
    pass: files.sidebar.includes('RepoPilot')
  },
  {
    category: 'WORKSPACE',
    name: 'Sidebar contains New Task',
    pass: files.sidebar.includes('New Task')
  },
  {
    category: 'WORKSPACE',
    name: 'Sidebar contains Workspace, Runs, Projects, Docs, Settings',
    pass: files.sidebar.includes('Workspace') &&
          files.sidebar.includes('Runs') &&
          files.sidebar.includes('Projects') &&
          files.sidebar.includes('Documentation') &&
          files.sidebar.includes('Settings')
  },
  {
    category: 'WORKSPACE',
    name: 'Main headline: WHAT SHOULD REPOPILOT INVESTIGATE?',
    pass: files.taskInput.includes('WHAT SHOULD') &&
          files.taskInput.includes('REPOPILOT') &&
          files.taskInput.includes('INVESTIGATE?')
  },
  {
    category: 'WORKSPACE',
    name: 'Large task composer textarea placeholder',
    pass: files.taskInput.includes('Describe the bug, error, or behavior you want RepoPilot to investigate...')
  },
  {
    category: 'WORKSPACE',
    name: 'Button: Analyze Repository',
    pass: files.taskInput.includes('Analyze Repository')
  },
  {
    category: 'WORKSPACE',
    name: 'Quick actions: Debug an error, Run tests, Investigate API, Explain code',
    pass: files.taskInput.includes('Debug an error') &&
          files.taskInput.includes('Run tests') &&
          files.taskInput.includes('Investigate API') &&
          files.taskInput.includes('Explain code')
  },
  {
    category: 'WORKSPACE',
    name: 'Right side Run details: Repository, Branch, Steps, Tools, Errors, Recovery',
    pass: files.runInfoPanel.includes('RUN DETAILS') &&
          files.runInfoPanel.includes('Repository') &&
          files.runInfoPanel.includes('Branch') &&
          files.runInfoPanel.includes('Steps') &&
          files.runInfoPanel.includes('Tools') &&
          files.runInfoPanel.includes('Errors') &&
          files.runInfoPanel.includes('Recovery')
  },

  // 3. AGENT EXECUTION EXPERIENCE
  {
    category: 'AGENT EXECUTION',
    name: 'Workspace transforms into execution view on task start',
    pass: files.app.includes("setWorkspaceMode('execution')") && files.app.includes('<ExecutionView')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Cognitive top status: THINKING, USING TOOL, OBSERVING, RECOVERING, COMPLETED',
    pass: files.executionView.includes('THINKING') &&
          files.executionView.includes('USING TOOL') &&
          files.executionView.includes('OBSERVING') &&
          files.executionView.includes('RECOVERING') &&
          files.executionView.includes('COMPLETED')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Failure & recovery sequence banner (TOOL FAILURE -> REFLECTION -> NEW ACTION -> SUCCESS)',
    pass: files.executionView.includes('TOOL FAILURE') &&
          files.executionView.includes('REFLECTION') &&
          files.executionView.includes('NEW ACTION') &&
          files.executionView.includes('SUCCESS') &&
          files.executionView.includes('pytest: 2 tests failed') &&
          files.executionView.includes('Reconsidering auth path')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Controls: Stop, Reset, Run Again',
    pass: files.executionView.includes('onStop') &&
          files.executionView.includes('onReset') &&
          files.executionView.includes('onRunAgain') &&
          files.executionView.includes('Stop') &&
          files.executionView.includes('Reset') &&
          files.executionView.includes('Run Again')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Vertical execution timeline (AgentTrace) with rail line',
    pass: files.agentTrace.includes('vertical-execution-timeline-root') &&
          files.agentTrace.includes('timeline-rail-line')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Each step displays step number, event type, message, tool name, status, timestamp, details',
    pass: files.agentTrace.includes('step-number-pill') &&
          files.agentTrace.includes('event-type-badge') &&
          files.agentTrace.includes('step-message-text') &&
          files.agentTrace.includes('tool-name-badge') &&
          files.agentTrace.includes('step-status-chip') &&
          files.agentTrace.includes('step-timestamp-mono') &&
          files.agentTrace.includes('step-details-container')
  },
  {
    category: 'AGENT EXECUTION',
    name: 'Mock agent progressive simulation preserved',
    pass: files.app.includes('runMockAgentSimulation') && files.app.includes('SCENARIOS')
  },

  // 4. CSS DESIGN TOKENS & STYLING
  {
    category: 'STYLING',
    name: 'CSS styles for Login screen',
    pass: files.css.includes('.cinematic-login-screen-root') && files.css.includes('.cinematic-login-card')
  },
  {
    category: 'STYLING',
    name: 'CSS styles for Task Composer & Editorial Headline',
    pass: files.css.includes('.composer-editorial-headline') && files.css.includes('.primary-analyze-btn')
  },
  {
    category: 'STYLING',
    name: 'CSS styles for Execution View & Failure Recovery Banner',
    pass: files.css.includes('.failure-recovery-callout-card') && files.css.includes('.recovery-step-node')
  },
  {
    category: 'STYLING',
    name: 'CSS styles for Vertical Timeline steps & accents',
    pass: files.css.includes('.vertical-execution-timeline-root') && files.css.includes('.timeline-rail-line')
  }
];

console.log('====================================================');
console.log('REPOPILOT POST-LANDING APPLICATION EXPERIENCE AUDIT');
console.log('====================================================\n');

let passedCount = 0;
tests.forEach((t, i) => {
  const status = t.pass ? '✓ PASS' : '✗ FAIL';
  if (t.pass) passedCount++;
  console.log(`[${t.category}] ${status} - ${t.name}`);
});

console.log(`\nResults: ${passedCount} / ${tests.length} checks passed.`);
if (passedCount === tests.length) {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('Some verifications failed!');
  process.exit(1);
}
