/**
 * AEGIS LOCAL TIMEZONE FORMATTER TESTS
 *
 * Verifies the shared presentation-layer timestamp formatter
 * (src/lib/time-format.ts) which converts canonical ISO-8601 UTC timestamps
 * to the user's local timezone at render time.
 *
 * All timezone/locale inputs are controlled via the formatter's explicit
 * `timeZone` / `locale` options — the developer's machine timezone is never
 * modified. Covers: UTC, Asia/Kolkata, America/New_York (DST), Europe/London
 * (DST), relative "ago" formatting, invalid-input fallbacks, and purity
 * (hydration determinism).
 *
 * Pure-function suite: no React, Electron, network, or Python required.
 */

import {
  runtimeTimezone,
  formatLocalTime,
  formatLocalDateTime,
  formatLocalTimeWithZone,
  formatLocalDateTimeWithZone,
  timeAgo
} from '../src/lib/time-format';

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
console.log('   LOCAL TIMEZONE FORMATTER TESTS                   ');
console.log('====================================================\n');

// Fixed instants: 2024-01-15 is Northern winter (standard time),
// 2024-07-15 is Northern summer (DST active in NY/London).
const WINTER = '2024-01-15T12:40:00Z';
const SUMMER = '2024-07-15T12:40:00Z';

console.log('--- 1. Runtime timezone detection ---');

runTest('1a: runtimeTimezone returns a non-empty IANA zone', () => {
  const tz = runtimeTimezone();
  expect(typeof tz === 'string' && tz.length > 0, `got "${tz}"`);
});

runTest('1b: runtimeTimezone resolves without hardcoding a specific zone', () => {
  // Whatever the machine zone is, it must resolve from the runtime, not a
  // constant. Verify the call succeeds and is idempotent.
  expect(runtimeTimezone() === runtimeTimezone(), 'runtime timezone not stable');
});

console.log('\n--- 2. formatLocalTime — controlled timezones (en-US locale) ---');

runTest('2a: UTC renders 12:40:00 PM for 12:40 UTC', () => {
  expect(
    formatLocalTime(WINTER, { timeZone: 'UTC', locale: 'en-US' }) === '12:40:00 PM',
    `got "${formatLocalTime(WINTER, { timeZone: 'UTC', locale: 'en-US' })}"`
  );
});

runTest('2b: Asia/Kolkata renders 06:10:00 PM for 12:40 UTC', () => {
  expect(
    formatLocalTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' }) === '06:10:00 PM',
    `got "${formatLocalTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' })}"`
  );
});

runTest('2c: America/New_York winter renders 07:40:00 AM (EST)', () => {
  expect(
    formatLocalTime(WINTER, { timeZone: 'America/New_York', locale: 'en-US' }) === '07:40:00 AM',
    `got "${formatLocalTime(WINTER, { timeZone: 'America/New_York', locale: 'en-US' })}"`
  );
});

runTest('2d: America/New_York summer renders 08:40:00 AM (EDT) — DST aware', () => {
  expect(
    formatLocalTime(SUMMER, { timeZone: 'America/New_York', locale: 'en-US' }) === '08:40:00 AM',
    `got "${formatLocalTime(SUMMER, { timeZone: 'America/New_York', locale: 'en-US' })}"`
  );
});

runTest('2e: Europe/London winter renders 12:40:00 PM (GMT)', () => {
  expect(
    formatLocalTime(WINTER, { timeZone: 'Europe/London', locale: 'en-US' }) === '12:40:00 PM',
    `got "${formatLocalTime(WINTER, { timeZone: 'Europe/London', locale: 'en-US' })}"`
  );
});

runTest('2f: Europe/London summer renders 01:40:00 PM (BST) — DST aware', () => {
  expect(
    formatLocalTime(SUMMER, { timeZone: 'Europe/London', locale: 'en-US' }) === '01:40:00 PM',
    `got "${formatLocalTime(SUMMER, { timeZone: 'Europe/London', locale: 'en-US' })}"`
  );
});

runTest('2g: 24-hour locale (en-GB) renders 18:10:22 without AM/PM', () => {
  expect(
    formatLocalTime('2024-07-15T18:10:22Z', { timeZone: 'UTC', locale: 'en-GB' }) === '18:10:22',
    `got "${formatLocalTime('2024-07-15T18:10:22Z', { timeZone: 'UTC', locale: 'en-GB' })}"`
  );
});

runTest('2h: default options use the runtime timezone/locale without throwing', () => {
  const out = formatLocalTime(WINTER);
  expect(typeof out === 'string' && out.length > 0, `got "${out}"`);
});

console.log('\n--- 3. formatLocalDateTime — date + time ---');

runTest('3a: Kolkata includes both date and converted time', () => {
  const out = formatLocalDateTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' });
  expect(out.includes('Jan 15'), `date missing in "${out}"`);
  expect(out.includes('6:10:00 PM'), `time missing in "${out}"`);
});

runTest('3b: New York summer date + DST-shifted time', () => {
  const out = formatLocalDateTime(SUMMER, { timeZone: 'America/New_York', locale: 'en-US' });
  expect(out.includes('Jul 15'), `date missing in "${out}"`);
  expect(out.includes('8:40:00 AM'), `time missing in "${out}"`);
});

console.log('\n--- 4. Timezone context (forensic evidence displays) ---');

runTest('4a: Asia/Kolkata shows GMT+5:30 or IST zone name', () => {
  const out = formatLocalTimeWithZone(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' });
  expect(/GMT\+5:30|IST/.test(out), `got "${out}"`);
});

runTest('4b: New York winter shows EST', () => {
  const out = formatLocalTimeWithZone(WINTER, { timeZone: 'America/New_York', locale: 'en-US' });
  expect(out.includes('EST'), `got "${out}"`);
});

runTest('4c: New York summer shows EDT — DST aware zone name', () => {
  const out = formatLocalTimeWithZone(SUMMER, { timeZone: 'America/New_York', locale: 'en-US' });
  expect(out.includes('EDT'), `got "${out}"`);
});

runTest('4d: London winter shows GMT, summer shows BST or GMT+1', () => {
  const w = formatLocalTimeWithZone(WINTER, { timeZone: 'Europe/London', locale: 'en-US' });
  const s = formatLocalTimeWithZone(SUMMER, { timeZone: 'Europe/London', locale: 'en-US' });
  expect(w.includes('GMT') && !w.includes('GMT+1') && !w.includes('BST'), `winter got "${w}"`);
  expect(/BST|GMT\+1/.test(s), `summer got "${s}"`);
});

runTest('4e: UTC shows explicit GMT/UTC zone name', () => {
  const out = formatLocalTimeWithZone(WINTER, { timeZone: 'UTC', locale: 'en-US' });
  expect(/GMT|UTC/.test(out), `got "${out}"`);
});

runTest('4f: formatLocalDateTimeWithZone includes date, time, and zone', () => {
  const out = formatLocalDateTimeWithZone(WINTER, { timeZone: 'America/New_York', locale: 'en-US' });
  expect(out.includes('Jan 15'), `date missing in "${out}"`);
  expect(out.includes('7:40:00 AM'), `time missing in "${out}"`);
  expect(out.includes('EST'), `zone missing in "${out}"`);
});

console.log('\n--- 5. Relative timestamps (detected X ago) ---');

const NOW = Date.parse('2024-07-15T12:40:00Z');

runTest('5a: seconds precision — 6s ago', () => {
  expect(timeAgo('2024-07-15T12:39:54Z', NOW) === '6s ago', `got "${timeAgo('2024-07-15T12:39:54Z', NOW)}"`);
});

runTest('5b: minutes precision — 3m ago', () => {
  expect(timeAgo('2024-07-15T12:37:00Z', NOW) === '3m ago', `got "${timeAgo('2024-07-15T12:37:00Z', NOW)}"`);
});

runTest('5c: hours precision — 2h ago', () => {
  expect(timeAgo('2024-07-15T10:39:00Z', NOW) === '2h ago', `got "${timeAgo('2024-07-15T10:39:00Z', NOW)}"`);
});

runTest('5d: future timestamps clamp to 0s ago (clock skew safe)', () => {
  expect(timeAgo('2024-07-15T12:40:10Z', NOW) === '0s ago', `got "${timeAgo('2024-07-15T12:40:10Z', NOW)}"`);
});

runTest('5e: relative time is timezone-independent (canonical math)', () => {
  // Same instant expressed in different zone notations must yield identical age.
  expect(
    timeAgo('2024-07-15T12:39:54Z', NOW) === timeAgo('2024-07-15T12:39:54+00:00', NOW),
    'relative age differs between equivalent timestamps'
  );
});

runTest('5f: missing/empty timestamp returns null', () => {
  expect(timeAgo(undefined, NOW) === null, 'undefined should be null');
  expect(timeAgo(null, NOW) === null, 'null should be null');
  expect(timeAgo('', NOW) === null, 'empty string should be null');
});

runTest('5g: unparseable timestamp returns null', () => {
  expect(timeAgo('not-a-timestamp', NOW) === null, 'garbage should be null');
});

console.log('\n--- 6. Invalid input fallbacks ---');

runTest('6a: unparseable string falls back to the input unchanged', () => {
  expect(formatLocalTime('not-a-timestamp') === 'not-a-timestamp', 'should echo input');
  expect(formatLocalTimeWithZone('garbage') === 'garbage', 'should echo input');
  expect(formatLocalDateTime('garbage') === 'garbage', 'should echo input');
});

runTest('6b: Date objects and epoch numbers are accepted', () => {
  const d = new Date('2024-01-15T12:40:00Z');
  expect(
    formatLocalTime(d, { timeZone: 'UTC', locale: 'en-US' }) === '12:40:00 PM',
    `Date object got "${formatLocalTime(d, { timeZone: 'UTC', locale: 'en-US' })}"`
  );
  expect(
    formatLocalTime(Date.parse(WINTER), { timeZone: 'UTC', locale: 'en-US' }) === '12:40:00 PM',
    `epoch got "${formatLocalTime(Date.parse(WINTER), { timeZone: 'UTC', locale: 'en-US' })}"`
  );
});

console.log('\n--- 7. Hydration determinism (purity) ---');

runTest('7a: repeated calls with the same inputs are identical', () => {
  const a = formatLocalTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' });
  const b = formatLocalTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' });
  expect(a === b, `"${a}" !== "${b}"`);
});

runTest('7b: formatter output contains no hardcoded zone suffix injection', () => {
  // The formatter itself must never append zone text unless asked — callers
  // decide clutter. Plain local time for Asia/Kolkata contains no zone name.
  const out = formatLocalTime(WINTER, { timeZone: 'Asia/Kolkata', locale: 'en-US' });
  expect(!out.includes('IST') && !out.includes('GMT'), `unexpected zone text in "${out}"`);
});

console.log('\n====================================================');
console.log(`   RESULTS: ${passed} passed, ${failed} failed`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
