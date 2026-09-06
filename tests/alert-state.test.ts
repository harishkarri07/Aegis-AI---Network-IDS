/**
 * AEGIS LATEST SYSTEM ALERT STABILIZATION TESTS
 *
 * Verifies the alert-signature hold policy used by the Live Monitor
 * "What needs attention" card so that real detections stay visible while the
 * card stops churning on every non-NORMAL packet at 20 Hz.
 *
 * Pure-function suite: no React, Electron, network, or Python required.
 */

import {
  alertSignatureOf,
  shouldUpdateLatestAlert,
  type LatestAlertState
} from '../src/lib/alert-state';

let passed = 0;
let failed = 0;

function expect(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runTest(testName: string, fn: () => void): void {
  try {
    fn();
    passed++;
    console.log(`  [PASS] ${testName}`);
  } catch (e: any) {
    failed++;
    console.log(`  [FAIL] ${testName}`);
    if (e && e.message) {
      console.log(`         ${e.message}`);
    }
  }
}

const HOLD_MS = 4000;

function state(signature: string, updatedAt: number): LatestAlertState {
  return { signature, updatedAt };
}

console.log('====================================================');
console.log('   LATEST SYSTEM ALERT STABILIZATION TESTS          ');
console.log('====================================================\n');

console.log('--- 1. Alert signature building ---');

runTest('1a: signature includes category, rule, and source IP', () => {
  const s = alertSignatureOf({ category: 'Probe', rule: 'PROBE_PORT_SCAN', srcIp: '203.0.113.7' });
  expect(s === 'Probe|PROBE_PORT_SCAN|203.0.113.7', `got ${s}`);
});

runTest('1b: same episode yields identical signature', () => {
  const a = alertSignatureOf({ category: 'Probe', rule: 'PROBE_PORT_SCAN', srcIp: '203.0.113.7' });
  const b = alertSignatureOf({ category: 'Probe', rule: 'PROBE_PORT_SCAN', srcIp: '203.0.113.7' });
  expect(a === b, `${a} !== ${b}`);
});

runTest('1c: same category/rule from a different source differs', () => {
  const a = alertSignatureOf({ category: 'Probe', rule: 'PROBE_PORT_SCAN', srcIp: '203.0.113.7' });
  const b = alertSignatureOf({ category: 'Probe', rule: 'PROBE_PORT_SCAN', srcIp: '198.51.100.9' });
  expect(a !== b, `${a} === ${b}`);
});

runTest('1d: missing rule/srcIp still produce a deterministic signature', () => {
  const s = alertSignatureOf({ category: 'DoS' });
  expect(s === 'DoS||', `got ${s}`);
});

console.log('\n--- 2. Card update policy ---');

runTest('2a: first detection always updates the card', () => {
  expect(shouldUpdateLatestAlert(null, 'Probe|P|1.1.1.1', 1000, HOLD_MS) === true, 'first alert must show');
});

runTest('2b: repeat of the same signature within hold is suppressed', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  expect(shouldUpdateLatestAlert(prev, 'Probe|PROBE_PORT_SCAN|203.0.113.7', 2500, HOLD_MS) === false, 'must not repaint at 20 Hz');
});

runTest('2c: repeat of the same signature after hold expires may update', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  expect(shouldUpdateLatestAlert(prev, 'Probe|PROBE_PORT_SCAN|203.0.113.7', 1000 + HOLD_MS + 1, HOLD_MS) === true, 'episode continuation refresh is allowed');
});

runTest('2d: different signature updates immediately even within hold', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  expect(shouldUpdateLatestAlert(prev, 'DoS|DOS_RATE_FLOOD|203.0.113.7', 1200, HOLD_MS) === true, 'DoS landing mid-scan must show');
});

runTest('2e: different rule from the same source updates immediately', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  expect(shouldUpdateLatestAlert(prev, 'Probe|PROBE_SYN_STEALTH|203.0.113.7', 1500, HOLD_MS) === true, 'new rule must show');
});

runTest('2f: a new source attacking with the same rule updates immediately', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  expect(shouldUpdateLatestAlert(prev, 'Probe|PROBE_PORT_SCAN|198.51.100.9', 1800, HOLD_MS) === true, 'new source must show');
});

runTest('2g: NORMAL packets never replace an active alert (category differs, shows immediately)', () => {
  const prev = state('Probe|PROBE_PORT_SCAN|203.0.113.7', 1000);
  // The card policy is never even consulted for NORMAL packets upstream, but
  // even if it were, a NORMAL signature is distinct and the helper is safe.
  expect(shouldUpdateLatestAlert(prev, 'NORMAL|BASELINE_CLEAN_FLOW|203.0.113.7', 1100, HOLD_MS) === true, 'helper handles category transitions');
});

console.log('\n--- 3. Boundary conditions ---');

runTest('3a: hold boundary exactly at expiry will update', () => {
  const prev = state('DoS|DOS_SYN_FLOOD|1.1.1.1', 5000);
  expect(shouldUpdateLatestAlert(prev, 'DoS|DOS_SYN_FLOOD|1.1.1.1', 5000 + HOLD_MS, HOLD_MS) === true, 'now - updatedAt >= holdMs');
});

runTest('3b: zero hold means every sighting updates', () => {
  const prev = state('Probe|P|1.1.1.1', 1000);
  expect(shouldUpdateLatestAlert(prev, 'Probe|P|1.1.1.1', 1001, 0) === true, 'hold 0 must always update');
});

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}