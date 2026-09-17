import fs from 'fs';
import path from 'path';

console.log('=== REPOPILOT CINEMATIC MOTION-DESIGN FILM REDESIGN TEST ===\n');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
  }
}

// 1. Check index.html font imports
const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf-8');
assert(indexHtml.includes('family=Anton'), 'Google Fonts Anton imported');
assert(indexHtml.includes('family=Bebas+Neue'), 'Google Fonts Bebas Neue imported');
assert(indexHtml.includes('family=Oswald'), 'Google Fonts Oswald imported');
assert(indexHtml.includes('%23080604'), 'Favicon SVG uses warm dark background #080604');
assert(indexHtml.includes('%23C69255'), 'Favicon SVG uses warm gold accent #C69255');

// 2. Check design-system.css warm palette tokens
const designSystem = fs.readFileSync(path.resolve('src/styles/design-system.css'), 'utf-8');
assert(designSystem.includes('#080604'), 'Canvas background token #080604 defined');
assert(designSystem.includes('#0D0A07'), 'Subtle background token #0D0A07 defined');
assert(designSystem.includes('#15100B'), 'Surface background token #15100B defined');
assert(designSystem.includes('#3A2517'), 'Warm brown token #3A2517 defined');
assert(designSystem.includes('#5A3920'), 'Warm brown token #5A3920 defined');
assert(designSystem.includes('#704722'), 'Warm brown token #704722 defined');
assert(designSystem.includes('#F2E5B8'), 'Cream text token #F2E5B8 defined');
assert(designSystem.includes('#E9D99F'), 'Cream text token #E9D99F defined');
assert(designSystem.includes('#FFF1C7'), 'Cream text token #FFF1C7 defined');
assert(designSystem.includes('#8D8272'), 'Muted warm gray token #8D8272 defined');
assert(designSystem.includes('--rp-font-condensed: \'Anton\''), 'Condensed display font Anton defined');
assert(designSystem.includes('.cinematic-frame'), '.cinematic-frame reusable class defined');

// 3. Check LandingPage.jsx structure
const landingPage = fs.readFileSync(path.resolve('src/components/LandingPage.jsx'), 'utf-8');
assert(landingPage.includes('film-experience-root'), 'Filmic experience root container present');
assert(landingPage.includes('film-navbar'), 'Minimal film navbar present');
assert(landingPage.includes('cinematic-frame'), '.cinematic-frame wrapper present');
assert(landingPage.includes('cinematic-orb-visual'), 'Volumetric celestial orb visual present');
assert(landingPage.includes('BUILD THE BRAIN.'), 'Hero condensed headline "BUILD THE BRAIN." present');
assert(landingPage.includes('DEBUG ON AUTOPILOT.'), 'Hero condensed headline "DEBUG ON AUTOPILOT." present');
assert(landingPage.includes('RepoPilot investigates the codebase'), 'Concise supporting editorial copy present');
assert(landingPage.includes('WHAT CAN YOUR AGENT DO?'), 'First scroll transition question present');
assert(landingPage.includes('YOUR CODEBASE.'), 'Story statement "YOUR CODEBASE." present');
assert(landingPage.includes('ON AUTOPILOT.'), 'Story statement "ON AUTOPILOT." present');
assert(landingPage.includes('CODE INVESTIGATION'), 'Floating artifact 1: CODE INVESTIGATION present');
assert(landingPage.includes('TOOL EXECUTION'), 'Floating artifact 2: TOOL EXECUTION present');
assert(landingPage.includes('FAILURE DETECTED'), 'Floating artifact 3: FAILURE DETECTED present');
assert(landingPage.includes('REFLECTION / REPLAN'), 'Floating artifact 4: REFLECTION / REPLAN present');
assert(landingPage.includes('AGENT_LOOP_FILM_STAGES'), '8-act sequential agent loop story defined');
assert(landingPage.includes('TURNING_POINT_STEPS'), '6-step failure/recovery turning point defined');
assert(landingPage.includes('Tool fails'), 'Turning point step: Tool fails present');
assert(landingPage.includes('Agent notices failure'), 'Turning point step: Agent notices failure present');
assert(landingPage.includes('Agent reflects'), 'Turning point step: Agent reflects present');
assert(landingPage.includes('Agent changes strategy'), 'Turning point step: Agent changes strategy present');
assert(landingPage.includes('Agent selects another action'), 'Turning point step: Agent selects another action present');
assert(landingPage.includes('Task succeeds'), 'Turning point step: Task succeeds present');
assert(landingPage.includes('STOP BABYSITTING'), 'Final climax headline "STOP BABYSITTING" present');
assert(landingPage.includes('YOUR CODE.'), 'Final climax headline "YOUR CODE." present');
assert(landingPage.includes('START DEBUGGING'), 'Primary CTA "START DEBUGGING" present');
assert(landingPage.includes('onStartDebugging'), 'Working workspace routing hook onStartDebugging preserved');
assert(landingPage.includes('onOpenLogin'), 'Working login routing hook onOpenLogin preserved');

console.log(`\nResults: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('ALL CINEMATIC REDESIGN VERIFICATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('SOME CHECKS FAILED');
  process.exit(1);
}
