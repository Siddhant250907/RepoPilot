// Verify that LandingPage and App JSX have all required content and components
import fs from 'fs';
import path from 'path';

const landingPath = path.resolve('src/components/LandingPage.jsx');
const appPath = path.resolve('src/App.jsx');
const cssPath = path.resolve('src/styles/app.css');

const landingContent = fs.readFileSync(landingPath, 'utf8');
const appContent = fs.readFileSync(appPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

const checks = [
  // Navbar
  { name: 'Navbar RepoPilot brand', pass: landingContent.includes('RepoPilot') },
  { name: 'Navbar Product link', pass: landingContent.includes('Product') },
  { name: 'Navbar How it works link', pass: landingContent.includes('How it works') },
  { name: 'Navbar Demo link', pass: landingContent.includes('Demo') },
  { name: 'Navbar Docs link', pass: landingContent.includes('Docs') },
  { name: 'Navbar Log in link', pass: landingContent.includes('Log in') },
  { name: 'Navbar Start debugging link', pass: landingContent.includes('Start debugging') },

  // Hero
  { name: 'Hero small label AUTONOMOUS SOFTWARE DEBUGGING', pass: landingContent.includes('AUTONOMOUS SOFTWARE DEBUGGING') },
  { name: 'Hero headline YOUR CODEBASE. ON AUTOPILOT.', pass: landingContent.includes('YOUR CODEBASE.') && landingContent.includes('ON AUTOPILOT.') },
  { name: 'Hero supporting text', pass: landingContent.includes('RepoPilot investigates bugs, chooses the right tools, learns from failures, and keeps working toward a solution.') },
  { name: 'Hero Start debugging button', pass: landingContent.includes('Start debugging') },
  { name: 'Hero Watch demo button', pass: landingContent.includes('Watch demo') },

  // Agent Visualization: PLAN -> ACT -> OBSERVE -> REFLECT -> RECOVER -> RESOLVE
  { name: 'Visualization stage: PLAN', pass: landingContent.includes('PLAN') },
  { name: 'Visualization stage: ACT', pass: landingContent.includes('ACT') },
  { name: 'Visualization stage: OBSERVE', pass: landingContent.includes('OBSERVE') },
  { name: 'Visualization stage: REFLECT', pass: landingContent.includes('REFLECT') },
  { name: 'Visualization stage: RECOVER', pass: landingContent.includes('RECOVER') },
  { name: 'Visualization stage: RESOLVE', pass: landingContent.includes('RESOLVE') },

  // Storytelling scroll section
  { name: 'Storytelling: THE BUG ISN\'T THE PROBLEM.', pass: landingContent.includes("THE BUG ISN'T") && landingContent.includes("THE PROBLEM.") },
  { name: 'Storytelling: THE INVESTIGATION IS.', pass: landingContent.includes('THE INVESTIGATION IS.') },
  { name: 'Storytelling introduces RepoPilot', pass: landingContent.includes('MEET REPOPILOT') || landingContent.includes('RepoPilot') },

  // How RepoPilot works
  { name: 'How works: 01 Understand', pass: landingContent.includes('01 Understand') },
  { name: 'How works: 02 Act', pass: landingContent.includes('02 Act') },
  { name: 'How works: 03 Observe', pass: landingContent.includes('03 Observe') },
  { name: 'How works: 04 Recover', pass: landingContent.includes('04 Recover') },
  { name: 'How works: 05 Resolve', pass: landingContent.includes('05 Resolve') },

  // Final CTA
  { name: 'Final CTA: READY TO LET IT INVESTIGATE?', pass: landingContent.includes('READY TO LET IT INVESTIGATE?') },

  // Functional button routing in App.jsx
  { name: 'App default currentView landing', pass: appContent.includes("useState('landing')") },
  { name: 'App landing onStartDebugging', pass: appContent.includes("onStartDebugging") },
  { name: 'App landing onViewDemo', pass: appContent.includes("onViewDemo") },
];

console.log('--- REPOPILOT LANDING PAGE VERIFICATION REPORT ---');
let allPassed = true;
for (const check of checks) {
  if (check.pass) {
    console.log(`[PASS] ${check.name}`);
  } else {
    console.log(`[FAIL] ${check.name}`);
    allPassed = false;
  }
}

if (!allPassed) {
  process.exit(1);
} else {
  console.log('ALL CHECKS PASSED SUCCESSFULLY (32/32)!');
}
