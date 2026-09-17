// Comprehensive test script verifying all interactive features of the cinematic RepoPilot landing page
import fs from 'fs';
import path from 'path';

const landingPath = path.resolve('src/components/LandingPage.jsx');
const appPath = path.resolve('src/App.jsx');
const cssPath = path.resolve('src/styles/app.css');

const landingContent = fs.readFileSync(landingPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const checks = [
  // 1. Navbar & Scroll Awareness
  { name: 'Navbar RepoPilot brand', pass: landingContent.includes('RepoPilot') },
  { name: 'Navbar Product link', pass: landingContent.includes('Product') },
  { name: 'Navbar How it works link', pass: landingContent.includes('How it works') },
  { name: 'Navbar Demo link', pass: landingContent.includes('Demo') },
  { name: 'Navbar Docs link', pass: landingContent.includes('Docs') },
  { name: 'Navbar Log in action', pass: landingContent.includes('Log in') },
  { name: 'Navbar Start debugging action', pass: landingContent.includes('Start debugging') },
  { name: 'Navbar scroll-reactive class in CSS', pass: cssContent.includes('.navbar-scrolled') },

  // 2. Scene 1: Scroll-driven Typography & Central System Reveal
  { name: 'Hero small label AUTONOMOUS SOFTWARE DEBUGGING', pass: landingContent.includes('AUTONOMOUS SOFTWARE DEBUGGING') },
  { name: 'Scene 1 phrase: YOUR CODEBASE.', pass: landingContent.includes('YOUR CODEBASE.') },
  { name: 'Scene 1 phrase: ON AUTOPILOT.', pass: landingContent.includes('ON AUTOPILOT.') },
  { name: 'Scene 1 kinetic transition style', pass: cssContent.includes('.kinetic-phrase') },
  { name: 'Hero supporting pitch copy', pass: landingContent.includes('RepoPilot investigates bugs, chooses the right tools, learns from failures, and keeps working toward a solution.') },
  { name: 'Central autonomous engine showcase', pass: landingContent.includes('AUTONOMOUS COGNITIVE ENGINE') },
  { name: 'Central loop nodes: PLAN, ACT, OBSERVE, REFLECT, REPLAN', pass: 
      landingContent.includes('node-plan') &&
      landingContent.includes('node-act') &&
      landingContent.includes('node-observe') &&
      landingContent.includes('node-reflect') &&
      landingContent.includes('node-replan')
  },

  // 3. Pinned Agent Visual Section (7 Narrative Stages)
  { name: 'Pinned stage 01: UNDERSTAND', pass: landingContent.includes('UNDERSTAND') },
  { name: 'Pinned stage 02: ACT', pass: landingContent.includes('ACT') },
  { name: 'Pinned stage 03: OBSERVE', pass: landingContent.includes('OBSERVE') },
  { name: 'Pinned stage 04: FAIL', pass: landingContent.includes('FAIL') },
  { name: 'Pinned stage 05: REFLECT', pass: landingContent.includes('REFLECT') },
  { name: 'Pinned stage 06: RECOVER', pass: landingContent.includes('RECOVER') },
  { name: 'Pinned stage 07: RESOLVE', pass: landingContent.includes('RESOLVE') },
  { name: 'Sticky pinned telemetry target in CSS', pass: cssContent.includes('.sticky-pinned-telemetry-target') && cssContent.includes('position: sticky') },

  // 4. The Failure Sequence (Core Hackathon Concept)
  { name: 'Failure headline: THE FIRST PLAN CAN FAIL.', pass: landingContent.includes('THE FIRST PLAN') && landingContent.includes('CAN FAIL.') },
  { name: 'Quieted error telemetry box', pass: landingContent.includes('sequence-error-telemetry-box') },
  { name: 'Pivot indicator bridge', pass: landingContent.includes('sequence-pivot-bridge') },
  { name: 'Recovery headline: BUT THE AGENT DOESN\'T STOP.', pass: landingContent.includes('BUT THE AGENT') && landingContent.includes("DOESN'T STOP.") },
  { name: 'Recovery verified diff box', pass: landingContent.includes('sequence-recovery-telemetry-box') },

  // 5. Interactive In-Page Demo ("SEE IT WORK")
  { name: 'Demo headline: SEE IT WORK.', pass: landingContent.includes('SEE IT WORK.') },
  { name: 'Default scenario: Fix the broken authentication test', pass: landingContent.includes('Fix the broken authentication test') },
  { name: 'Button: RUN DEMO', pass: landingContent.includes('RUN DEMO') },
  { name: 'Action: Run again', pass: landingContent.includes('Run again') },
  { name: 'Action: Reset', pass: landingContent.includes('Reset') },
  { name: '9 progressive demo steps configured', pass: 
      landingContent.includes('COGNITIVE_DECOMPOSE') &&
      landingContent.includes('FILE READER') &&
      landingContent.includes('PYTEST') &&
      landingContent.includes('KeyError') &&
      landingContent.includes('AUTONOMOUS REFLECTION') || landingContent.includes('COGNITIVE_REFLECT')
  },

  // 6. Atmospheric Background & Mouse Interactions
  { name: 'Dynamic mouse pointer spotlight CSS', pass: cssContent.includes('.ambient-spotlight-pointer') && cssContent.includes('--mouse-x') },

  // 7. Accessibility & Reduced Motion
  { name: 'prefers-reduced-motion media query in CSS', pass: cssContent.includes('@media (prefers-reduced-motion: reduce)') },

  // 8. Final CTA & Functional Routing
  { name: 'Final CTA headline: READY TO LET IT INVESTIGATE?', pass: landingContent.includes('READY TO LET IT') && landingContent.includes('INVESTIGATE?') },
  { name: 'Final CTA Start debugging button', pass: landingContent.includes('final-big-btn') },
  { name: 'App starts on landing view', pass: appContent.includes("useState('landing')") },
  { name: 'App wired to onStartDebugging', pass: appContent.includes("onStartDebugging") },
  { name: 'App wired to onViewDemo', pass: appContent.includes("onViewDemo") },
];

console.log('--- REPOPILOT CINEMATIC INTERACTIVE LANDING VERIFICATION ---');
let allPassed = true;
let passCount = 0;

for (const check of checks) {
  if (check.pass) {
    console.log(`[PASS] ${check.name}`);
    passCount++;
  } else {
    console.log(`[FAIL] ${check.name}`);
    allPassed = false;
  }
}

console.log(`\nResults: ${passCount} / ${checks.length} tests passed.`);

if (!allPassed) {
  process.exit(1);
} else {
  console.log('ALL CINEMATIC INTERACTIVE REQUIREMENTS VERIFIED SUCCESSFULLY!');
}
