import { runMockAgentSimulation, SCENARIOS } from '../src/services/mockAgent.js';

console.log('Testing runMockAgentSimulation with FAILURE_RECOVERY scenario...');

const events = [];
const statusHistory = [];

const cancel = runMockAgentSimulation({
  scenario: SCENARIOS.FAILURE_RECOVERY,
  intervalMs: 50, // fast for testing
  onEvent: (event) => {
    events.push(event);
    console.log(`[EVENT ${events.length}] Step ${event.step} | Type: ${event.type} | Status: ${event.status}`);
  },
  onStatusChange: (status) => {
    statusHistory.push(status);
    console.log(`[STATUS CHANGE] -> ${status}`);
  },
  onComplete: (finalEvent) => {
    console.log('\n--- SIMULATION COMPLETE ---');
    console.log(`Total events emitted: ${events.length}`);
    console.log(`Statuses visited: ${statusHistory.join(' -> ')}`);
    console.log(`Final message: ${finalEvent.message}`);

    const hasFailure = events.some(e => e.error);
    const hasReflection = events.some(e => e.type === 'reflection');
    const hasSuccess = events.some(e => e.type === 'final');

    if (hasFailure && hasReflection && hasSuccess && events.length === 10) {
      console.log('✓ Mock Agent Failure-Recovery flow verified successfully!');
      process.exit(0);
    } else {
      console.error('✗ Mock Agent flow failed expectations!');
      process.exit(1);
    }
  }
});
