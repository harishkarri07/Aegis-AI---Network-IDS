/**
 * AEGIS LOCAL SERVER REQUEST GUARD TESTS
 *
 * Validates the loopback-only request guard that protects the Electron
 * static + SIEM API server from drive-by cross-origin requests and
 * DNS-rebinding Host headers, while keeping the app renderer, the Python
 * endpoint agent, and plain HTTP clients fully supported.
 *
 * Pure-function suite: no Electron runtime, network, or Python required.
 */

import {
  isRequestAllowed,
  loopbackHostnameOf,
  MAX_API_BODY_BYTES
} from '../src/lib/local-server-guard';

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

console.log('====================================================');
console.log('   AEGIS LOCAL SERVER REQUEST GUARD TESTS           ');
console.log('====================================================\n');

console.log('--- 1. Host header parsing ---');

runTest('1a: 127.0.0.1 with port parses to loopback', () => {
  expect(loopbackHostnameOf('127.0.0.1:3000') === '127.0.0.1', `got ${loopbackHostnameOf('127.0.0.1:3000')}`);
});

runTest('1b: localhost with port parses to loopback', () => {
  expect(loopbackHostnameOf('localhost:3000') === 'localhost', `got ${loopbackHostnameOf('localhost:3000')}`);
});

runTest('1c: localhost without port parses to loopback', () => {
  expect(loopbackHostnameOf('localhost') === 'localhost', `got ${loopbackHostnameOf('localhost')}`);
});

runTest('1d: bracketed IPv6 [::1]:3000 parses to loopback', () => {
  expect(loopbackHostnameOf('[::1]:3000') === '::1', `got ${loopbackHostnameOf('[::1]:3000')}`);
});

runTest('1e: bare IPv6 ::1 parses to loopback', () => {
  expect(loopbackHostnameOf('::1') === '::1', `got ${loopbackHostnameOf('::1')}`);
});

runTest('1f: public hostname is rejected', () => {
  expect(loopbackHostnameOf('evil.example:3000') === null, `got ${loopbackHostnameOf('evil.example:3000')}`);
});

runTest('1g: missing host is rejected', () => {
  expect(loopbackHostnameOf(undefined) === null, 'undefined host must be null');
  expect(loopbackHostnameOf('') === null, 'empty host must be null');
});

console.log('\n--- 2. Read-only requests (GET/HEAD/OPTIONS) ---');

runTest('2a: GET from the app renderer is allowed', () => {
  const d = isRequestAllowed({ method: 'GET', host: '127.0.0.1:3000' });
  expect(d.allowed, `expected allowed, got ${d.reason}`);
});

runTest('2b: GET with rebinding Host header is blocked', () => {
  const d = isRequestAllowed({ method: 'GET', host: 'evil.example:3000' });
  expect(!d.allowed, 'rebinding host must be blocked');
});

runTest('2c: GET with missing Host header is blocked', () => {
  const d = isRequestAllowed({ method: 'GET' });
  expect(!d.allowed, 'missing host must be blocked');
});

runTest('2d: OPTIONS preflight with loopback Host is allowed', () => {
  const d = isRequestAllowed({
    method: 'OPTIONS',
    host: 'localhost:3000',
    origin: 'http://evil.example',
    secFetchSite: 'cross-site'
  });
  expect(d.allowed, `preflight should be allowed, got ${d.reason}`);
});

console.log('\n--- 3. State-changing requests from the app renderer (must keep working) ---');

runTest('3a: same-origin POST is allowed', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: '127.0.0.1:3000',
    origin: 'http://127.0.0.1:3000',
    secFetchSite: 'same-origin'
  });
  expect(d.allowed, `same-origin POST must be allowed, got ${d.reason}`);
});

runTest('3b: same-origin POST via localhost is allowed', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: 'localhost:3000',
    origin: 'http://localhost:3000',
    secFetchSite: 'same-origin'
  });
  expect(d.allowed, `got ${d.reason}`);
});

runTest('3c: same-origin PATCH (alert status update) is allowed', () => {
  const d = isRequestAllowed({
    method: 'PATCH',
    host: '127.0.0.1:3000',
    origin: 'http://127.0.0.1:3000',
    secFetchSite: 'same-origin'
  });
  expect(d.allowed, `got ${d.reason}`);
});

runTest('3d: POST with Origin but no Sec-Fetch-Site from app origin is allowed', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: '127.0.0.1:3000',
    origin: 'http://127.0.0.1:3000'
  });
  expect(d.allowed, `got ${d.reason}`);
});

console.log('\n--- 4. State-changing requests from non-browser clients (agent/curl) ---');

runTest('4a: POST with no browser headers is allowed (Python agent)', () => {
  const d = isRequestAllowed({ method: 'POST', host: 'localhost:3000' });
  expect(d.allowed, `agent POST must stay allowed, got ${d.reason}`);
});

runTest('4b: PATCH with no browser headers is allowed', () => {
  const d = isRequestAllowed({ method: 'PATCH', host: '127.0.0.1:3000' });
  expect(d.allowed, `got ${d.reason}`);
});

console.log('\n--- 5. Drive-by cross-origin state changes (must be blocked) ---');

runTest('5a: cross-site POST from any website is blocked', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: '127.0.0.1:3000',
    origin: 'http://evil.example',
    secFetchSite: 'cross-site'
  });
  expect(!d.allowed, 'cross-site POST must be blocked');
});

runTest('5b: same-site POST from another local app is blocked', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: '127.0.0.1:3000',
    origin: 'http://localhost:8999',
    secFetchSite: 'same-site'
  });
  expect(!d.allowed, 'same-site POST must be blocked');
});

runTest('5c: POST with mismatched Origin and no Sec-Fetch-Site is blocked', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: '127.0.0.1:3000',
    origin: 'http://evil.example'
  });
  expect(!d.allowed, 'mismatched Origin must be blocked');
});

runTest('5d: cross-site PATCH (alert tampering) is blocked', () => {
  const d = isRequestAllowed({
    method: 'PATCH',
    host: '127.0.0.1:3000',
    origin: 'http://evil.example',
    secFetchSite: 'cross-site'
  });
  expect(!d.allowed, 'cross-site PATCH must be blocked');
});

runTest('5e: cross-site POST with rebinding Host is blocked', () => {
  const d = isRequestAllowed({
    method: 'POST',
    host: 'evil.example:3000',
    origin: 'http://evil.example:3000',
    secFetchSite: 'cross-site'
  });
  expect(!d.allowed, 'rebinding host must be blocked regardless of other headers');
});

console.log('\n--- 6. Body size cap ---');

runTest('6a: MAX_API_BODY_BYTES is a sane positive bound', () => {
  expect(Number.isFinite(MAX_API_BODY_BYTES) && MAX_API_BODY_BYTES > 1024 * 1024, 'cap must exceed 1 MB');
  expect(MAX_API_BODY_BYTES <= 64 * 1024 * 1024, 'cap must stay bounded (memory safety)');
});

console.log('\n====================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
