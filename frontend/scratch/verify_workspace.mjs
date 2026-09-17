import { SCENARIOS, runMockAgentSimulation } from '../src/services/mockAgent.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runTests() {
  console.log('--- TEST 1: Mock Agent Simulation ---');
  let eventsReceived = [];
  let statusChanges = [];
  let completed = false;

  await new Promise((resolve) => {
    runMockAgentSimulation({
      scenario: SCENARIOS.FAILURE_RECOVERY,
      intervalMs: 10, // Fast execution for test
      onEvent: (event) => eventsReceived.push(event),
      onStatusChange: (status) => statusChanges.push(status),
      onComplete: (finalEvent) => {
        completed = true;
        resolve();
      },
    });
  });

  console.log(`✓ Simulation completed: ${completed}`);
  console.log(`✓ Total events emitted: ${eventsReceived.length}`);
  console.log(`✓ Status lifecycle: ${statusChanges.join(' -> ')}`);
  if (eventsReceived.length !== 10) {
    throw new Error(`Expected 10 events, got ${eventsReceived.length}`);
  }

  console.log('\n--- TEST 2: TaskInput Component Verification ---');
  const taskInputCode = fs.readFileSync(path.join(__dirname, '../src/components/TaskInput.jsx'), 'utf-8');
  
  const expectedQuickActions = [
    'Debug an error',
    'Run tests',
    'Investigate API',
    'Explain code'
  ];
  expectedQuickActions.forEach(qa => {
    if (!taskInputCode.includes(qa)) throw new Error(`Missing quick action: ${qa}`);
    console.log(`✓ Found quick action: "${qa}"`);
  });

  if (!taskInputCode.includes('Describe the bug, error, or behavior you want RepoPilot to investigate...')) {
    throw new Error('Missing exact textarea placeholder');
  }
  console.log('✓ Textarea placeholder verified');

  if (!taskInputCode.includes('Analyze Repository')) {
    throw new Error('Missing "Analyze Repository" primary button');
  }
  console.log('✓ "Analyze Repository" button verified');

  if (!taskInputCode.includes('repository-selector') || !taskInputCode.includes('branch-selector')) {
    throw new Error('Missing repository or branch selectors');
  }
  console.log('✓ Repository and branch selectors verified');

  if (!taskInputCode.includes('Python 3.11 • pytest • sandbox')) {
    throw new Error('Missing small repository metadata');
  }
  console.log('✓ Small repository metadata verified');

  if (!taskInputCode.includes('Ctrl') || !taskInputCode.includes('Enter')) {
    throw new Error('Missing keyboard shortcut handler');
  }
  console.log('✓ Ctrl/Cmd + Enter keyboard shortcut handler verified');

  console.log('\n--- TEST 3: Sidebar Component Verification ---');
  const sidebarCode = fs.readFileSync(path.join(__dirname, '../src/components/Sidebar.jsx'), 'utf-8');
  
  if (!sidebarCode.includes('RepoPilot')) throw new Error('Missing brand RepoPilot in sidebar');
  if (!sidebarCode.includes('New Task')) throw new Error('Missing New Task button');
  if (!sidebarCode.includes('sidebar-divider')) throw new Error('Missing sidebar dividers');
  if (!sidebarCode.includes('Workspace') || !sidebarCode.includes('Runs') || !sidebarCode.includes('Projects')) {
    throw new Error('Missing group 1 items');
  }
  if (!sidebarCode.includes('Documentation') || !sidebarCode.includes('Settings')) {
    throw new Error('Missing group 2 items');
  }
  if (!sidebarCode.includes('user-profile-card')) throw new Error('Missing user profile section');
  console.log('✓ Sidebar layout hierarchy and dividers verified');

  console.log('\n--- TEST 4: RunInfoPanel Component Verification ---');
  const runInfoCode = fs.readFileSync(path.join(__dirname, '../src/components/RunInfoPanel.jsx'), 'utf-8');
  
  const requiredFields = [
    'Repository',
    'Branch',
    'Agent',
    'Steps',
    'Tools used',
    'Errors',
    'Recovery attempts',
    'Duration'
  ];
  requiredFields.forEach(field => {
    if (!runInfoCode.toLowerCase().includes(field.toLowerCase())) {
      throw new Error(`Missing Run Details field: ${field}`);
    }
    console.log(`✓ Run Details contains: "${field}"`);
  });

  if (!runInfoCode.includes('run-details-empty-state')) {
    throw new Error('Missing useful empty state');
  }
  console.log('✓ Useful empty state verified');

  console.log('\n--- TEST 5: Recent Runs Verification ---');
  const appCode = fs.readFileSync(path.join(__dirname, '../src/App.jsx'), 'utf-8');
  
  const expectedRuns = [
    'Fix authentication failure',
    'Investigate API timeout',
    'Repair broken tests',
    'Explain database error'
  ];
  expectedRuns.forEach(runTitle => {
    if (!appCode.includes(runTitle)) throw new Error(`Missing recent run: ${runTitle}`);
    console.log(`✓ Found recent run: "${runTitle}"`);
  });

  console.log('\nALL WORKSPACE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
