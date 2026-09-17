// Verification script for the substantial visual redesign of RepoPilot
import fs from 'fs';
import path from 'path';

const landing = fs.readFileSync(path.resolve('src/components/LandingPage.jsx'), 'utf8');
const taskInput = fs.readFileSync(path.resolve('src/components/TaskInput.jsx'), 'utf8');
const execution = fs.readFileSync(path.resolve('src/components/ExecutionView.jsx'), 'utf8');
const trace = fs.readFileSync(path.resolve('src/components/AgentTrace.jsx'), 'utf8');
const login = fs.readFileSync(path.resolve('src/components/LoginScreen.jsx'), 'utf8');
const css = fs.readFileSync(path.resolve('src/styles/app.css'), 'utf8');

const tests = [
  // 1. Navigation
  { name: 'Nav brand: RepoPilot', pass: landing.includes('RepoPilot') },
  { name: 'Nav links: Product, How It Works, Demo', pass: landing.includes('Product') && landing.includes('How It Works') && landing.includes('Demo') },
  { name: 'Nav actions: Sign In, Start Debugging', pass: landing.includes('Sign In') && landing.includes('Start Debugging') },

  // 2. Hero section
  { name: 'Hero Eyebrow: REPOPILOT', pass: landing.includes('REPOPILOT') },
  { name: 'Hero Headline: Autonomous debugging, without the babysitting.', pass: landing.includes('Autonomous debugging,') && landing.includes('without the babysitting.') },
  { name: 'Hero Primary CTA: Start Debugging', pass: landing.includes('Start Debugging') },
  { name: 'Hero Secondary CTA: See How It Works', pass: landing.includes('See How It Works') },
  { name: 'Hero visual flow: TASK -> PLAN -> ACT -> OBSERVE -> REFLECT -> REPLAN -> SUCCESS', pass:
      landing.includes('node-task') &&
      landing.includes('node-plan') &&
      landing.includes('node-act') &&
      landing.includes('node-observe') &&
      landing.includes('node-reflect') &&
      landing.includes('node-replan') &&
      landing.includes('node-success')
  },
  { name: 'Hero live runtime preview box', pass: landing.includes('hero-runtime-preview-terminal') },

  // 3. Interactive section showing USER TASK -> PLAN -> TOOL -> RESULT -> FAILURE -> REFLECT -> NEW PLAN -> SUCCESS
  { name: '8-stage strip in failure section', pass: landing.includes('sequence-eight-stage-strip') },
  { name: '6-step failure recovery: Tool fails -> Agent notices failure -> Agent reflects -> Agent changes strategy -> Agent selects another action -> Task succeeds', pass:
      landing.includes('Tool fails') &&
      landing.includes('Agent notices failure') &&
      landing.includes('Agent reflects') &&
      landing.includes('Agent changes strategy') &&
      landing.includes('Agent selects another action') &&
      landing.includes('Task succeeds')
  },

  // 4. Workspace & Composer
  { name: 'Workspace button: Run Agent', pass: taskInput.includes('Run Agent') },
  { name: 'Execution view: Stop button', pass: execution.includes('onStop') && execution.includes('Stop') },
  { name: 'Execution view: current PLAN', pass: execution.includes('CURRENT PLAN') },
  { name: 'Execution view: current TOOL', pass: execution.includes('CURRENT TOOL') },
  { name: 'Execution view: OBSERVATION', pass: execution.includes('OBSERVATION') },
  { name: 'Execution view: failures/errors', pass: execution.includes('FAILURES / ERRORS') },
  { name: 'Execution view: reflection/replanning', pass: execution.includes('REFLECTION / REPLANNING') },
  { name: 'Execution view: final result', pass: execution.includes('FINAL RESULT') },

  // 5. Trace distinguishes PLAN, ACT, OBSERVE, ERROR, REFLECTION, REPLAN, SUCCESS
  { name: 'Trace badge: PLAN', pass: trace.includes("typeLabel: 'PLAN'") },
  { name: 'Trace badge: ACT', pass: trace.includes("typeLabel: 'ACT'") },
  { name: 'Trace badge: OBSERVE', pass: trace.includes("typeLabel: 'OBSERVE'") },
  { name: 'Trace badge: ERROR', pass: trace.includes("typeLabel: 'ERROR'") },
  { name: 'Trace badge: REFLECTION', pass: trace.includes("typeLabel: 'REFLECTION'") },
  { name: 'Trace badge: REPLAN', pass: trace.includes("typeLabel: 'REPLAN'") },
  { name: 'Trace badge: SUCCESS', pass: trace.includes("typeLabel: 'SUCCESS'") },

  // 6. Login screen
  { name: 'Login screen exists and routes to workspace', pass: login.includes('onLoginSuccess') && login.includes('alex.rivera@devcorp.io') }
];

console.log('--- REPOPILOT SUBSTANTIAL REDESIGN VERIFICATION ---');
let passed = 0;
tests.forEach(t => {
  const symbol = t.pass ? '✓' : '✗';
  if (t.pass) passed++;
  console.log(`${symbol} ${t.name}`);
});

console.log(`\nTotal: ${passed} / ${tests.length} passed.`);
if (passed === tests.length) {
  console.log('ALL VERIFICATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('Some checks failed!');
  process.exit(1);
}
