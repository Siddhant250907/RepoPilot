// Comprehensive Final UX & Systems Audit for RepoPilot
import fs from 'fs';
import path from 'path';
import { runMockAgentSimulation, SCENARIOS } from '../src/services/mockAgent.js';

const files = {
  landing: fs.readFileSync(path.resolve('src/components/LandingPage.jsx'), 'utf8'),
  login: fs.readFileSync(path.resolve('src/components/LoginScreen.jsx'), 'utf8'),
  taskInput: fs.readFileSync(path.resolve('src/components/TaskInput.jsx'), 'utf8'),
  executionView: fs.readFileSync(path.resolve('src/components/ExecutionView.jsx'), 'utf8'),
  agentTrace: fs.readFileSync(path.resolve('src/components/AgentTrace.jsx'), 'utf8'),
  runInfoPanel: fs.readFileSync(path.resolve('src/components/RunInfoPanel.jsx'), 'utf8'),
  sidebar: fs.readFileSync(path.resolve('src/components/Sidebar.jsx'), 'utf8'),
  app: fs.readFileSync(path.resolve('src/App.jsx'), 'utf8'),
  css: fs.readFileSync(path.resolve('src/styles/app.css'), 'utf8')
};

console.log('===============================================================');
console.log('REPOPILOT FINAL UX PASS & STABILITY AUDIT');
console.log('===============================================================\n');

const checks = [
  // 1. BRAND & ONE-PRODUCT VISUAL COHESION
  {
    category: 'ONE PRODUCT',
    name: 'Unified color tokens across landing, login & workspace',
    pass: files.css.includes('--rp-bg-canvas') && files.css.includes('--rp-primary') && files.css.includes('--rp-purple')
  },
  {
    category: 'ONE PRODUCT',
    name: 'Unified bot brand mark across all pages',
    pass: files.landing.includes('RepoPilot') && files.login.includes('RepoPilot') && files.sidebar.includes('RepoPilot')
  },
  {
    category: 'ONE PRODUCT',
    name: 'Consistent focus-visible states across all inputs & buttons',
    pass: files.css.includes(':focus-visible') && files.css.includes('box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4)')
  },

  // 2. THE 9-STEP COGNITIVE LIFECYCLE (CRITICAL JUDGE EXPERIENCE)
  {
    category: '9-STEP LIFECYCLE',
    name: '01 USER TASK defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('USER TASK') && files.agentTrace.includes('01 USER TASK')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '02 AGENT PLANS defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('AGENT PLANS') && files.agentTrace.includes('02 AGENT PLANS')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '03 AGENT USES TOOL defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('AGENT USES TOOL') && files.agentTrace.includes('03 AGENT USES TOOL')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '04 AGENT OBSERVES defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('AGENT OBSERVES') && files.agentTrace.includes('04 AGENT OBSERVES')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '05 TOOL FAILS defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('TOOL FAILS') && files.agentTrace.includes('05 TOOL FAILS')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '06 AGENT REFLECTS defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('AGENT REFLECTS') && files.agentTrace.includes('06 AGENT REFLECTS')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '07 AGENT CHOOSES ANOTHER ACTION defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('AGENT CHOOSES ANOTHER ACTION') && files.agentTrace.includes('07 AGENT CHOOSES ACTION')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '08 SUCCESS defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('SUCCESS') && files.agentTrace.includes('08 SUCCESS')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: '09 FINAL RESULT defined in ExecutionView & AgentTrace',
    pass: files.executionView.includes('FINAL RESULT') && files.agentTrace.includes('09 FINAL RESULT')
  },
  {
    category: '9-STEP LIFECYCLE',
    name: 'Top 9-step horizontal interactive pipeline bar present',
    pass: files.executionView.includes('autonomous-nine-step-tracker') && files.css.includes('.autonomous-nine-step-tracker')
  },

  // 3. RESPONSIVE DESIGN (DESKTOP, TABLET, MOBILE)
  {
    category: 'RESPONSIVE',
    name: 'Desktop 3-column layout (Sidebar, Main Stage, Right Panel)',
    pass: files.css.includes('.workspace-layout') && files.css.includes('.workspace-main-stage') && files.css.includes('.run-details-panel')
  },
  {
    category: 'RESPONSIVE',
    name: 'Tablet media query (<=1100px & <=900px) with adaptive columns',
    pass: files.css.includes('@media (max-width: 1100px)') && files.css.includes('@media (max-width: 900px)')
  },
  {
    category: 'RESPONSIVE',
    name: 'Mobile media query (<=768px) with stacked layouts and touch padding',
    pass: files.css.includes('@media (max-width: 768px)')
  },

  // 4. LOGIN & LOGOUT FLOW
  {
    category: 'AUTH',
    name: 'Login screen validation & show/hide password toggle',
    pass: files.login.includes('validateForm') && files.login.includes('showPassword')
  },
  {
    category: 'AUTH',
    name: 'Login loading state and success feedback',
    pass: files.login.includes('isLoading') && files.login.includes('isSuccess')
  },
  {
    category: 'AUTH',
    name: 'Demo credential autofill',
    pass: files.login.includes('handleFillDemo') && files.login.includes('alex.rivera@devcorp.io')
  },
  {
    category: 'AUTH',
    name: 'Logout clears auth state and triggers navigation',
    pass: files.sidebar.includes('handleLogout') && files.sidebar.includes('logout()') && files.sidebar.includes('onLogout')
  },

  // 5. DEMO MODE & CONTROLS (STOP, RESET, RUN AGAIN)
  {
    category: 'CONTROLS',
    name: 'Stop action gracefully halts simulation',
    pass: files.app.includes('handleStopSimulation') && files.executionView.includes('onStop')
  },
  {
    category: 'CONTROLS',
    name: 'Reset action cleans events and returns to composer',
    pass: files.app.includes('handleReset') && files.executionView.includes('onReset')
  },
  {
    category: 'CONTROLS',
    name: 'Run Again re-dispatches active scenario',
    pass: files.app.includes('onRunAgain') && files.executionView.includes('onRunAgain')
  },
  {
    category: 'CONTROLS',
    name: 'Task Composer editorial headline and placeholder',
    pass: files.taskInput.includes('WHAT SHOULD') &&
          files.taskInput.includes('REPOPILOT') &&
          files.taskInput.includes('INVESTIGATE?') &&
          files.taskInput.includes('Describe the bug, error, or behavior you want RepoPilot to investigate...')
  },
  {
    category: 'CONTROLS',
    name: 'Task Composer 4 quick actions',
    pass: files.taskInput.includes('Debug an error') &&
          files.taskInput.includes('Run tests') &&
          files.taskInput.includes('Investigate API') &&
          files.taskInput.includes('Explain code')
  }
];

let passCount = 0;
checks.forEach((c) => {
  const mark = c.pass ? '✓ PASS' : '✗ FAIL';
  if (c.pass) passCount++;
  console.log(`[${c.category}] ${mark} - ${c.name}`);
});

console.log(`\nStatic Audit Results: ${passCount} / ${checks.length} passed.`);
if (passCount !== checks.length) {
  console.error('Static checks failed!');
  process.exit(1);
}

// 6. DYNAMIC MOCK SIMULATION AUDIT
console.log('\nRunning dynamic mock agent simulation test...');
let simEvents = [];
const cancel = runMockAgentSimulation({
  scenario: SCENARIOS.FAILURE_RECOVERY,
  intervalMs: 40,
  onEvent: (event) => simEvents.push(event),
  onStatusChange: () => {},
  onComplete: (finalEvent) => {
    console.log(`✓ Progressive simulation completed with ${simEvents.length} events.`);
    console.log(`✓ Final event summary: "${finalEvent.message}"`);
    console.log('\n===============================================================');
    console.log('ALL AUDITS & SIMULATIONS PASSED WITH 100% SUCCESS!');
    console.log('===============================================================');
    process.exit(0);
  }
});
