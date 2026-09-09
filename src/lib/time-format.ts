/**
 * Shared presentation-layer timestamp formatting.
 *
 * Architecture invariant: timestamps are canonical ISO-8601 UTC everywhere —
 * packet capture, the DetectionEngine, IPC transport, the SIEM API, and the
 * database. This module is the ONLY place conversion happens: at render time,
 * to the user's local system timezone via the runtime Intl implementation.
 *
 * The timezone is never hardcoded. In the browser and in the Electron renderer
 * (Chromium), `Intl.DateTimeFormat().resolvedOptions().timeZone` resolves to
 * the machine's OS timezone automatically; the locale likewise follows the
 * user's system settings. The optional `timeZone` / `locale` overrides exist
 * solely for deterministic tests and explicit contexts.
 *
 * Hydration safety: these helpers are pure functions of (timestamp, options).
 * Every caller renders timestamps from state that only exists after mount
 * (capture stream via IPC or client-side fetch), so no server-rendered HTML
 * ever contains a formatted local time — no server/client mismatch, no flicker.
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TimeFormatOptions {
  /** IANA timezone override (tests / explicit forensic context). Default: runtime system timezone. */
  timeZone?: string;
  /** BCP 47 locale override (tests). Default: runtime system locale. */
  locale?: string;
}

type TimeInput = string | number | Date;

/** Parse any canonical timestamp into a Date; null when unparseable. */
function toDate(ts: TimeInput): Date | null {
  const d = ts instanceof Date ? ts : new Date(ts);
  return Number.isFinite(d.getTime()) ? d : null;
}

function fallback(ts: TimeInput): string {
  return ts instanceof Date ? ts.toISOString() : String(ts);
}

/**
 * The runtime's timezone, derived from the operating system.
 * Browsers and the Electron renderer (Chromium ICU) resolve this from the
 * machine's local settings automatically — nothing is hardcoded.
 */
export function runtimeTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    // Intl unavailable in this runtime; ISO strings remain canonical anyway.
    return 'UTC';
  }
}

/**
 * Locale-appropriate local time, e.g. "6:10:22 PM" (en-US) or "18:10:22" (en-GB).
 * Returns the input unchanged when it cannot be parsed.
 */
export function formatLocalTime(ts: TimeInput, opts?: TimeFormatOptions): string {
  const d = toDate(ts);
  if (!d) return fallback(ts);
  try {
    return new Intl.DateTimeFormat(opts?.locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...(opts?.timeZone ? { timeZone: opts.timeZone } : {})
    }).format(d);
  } catch {
    return fallback(ts);
  }
}

/**
 * Locale-appropriate local date + time, e.g. "Jan 15, 6:10:22 PM".
 * Used for historical (database-backed) records where the date matters.
 */
export function formatLocalDateTime(ts: TimeInput, opts?: TimeFormatOptions): string {
  const d = toDate(ts);
  if (!d) return fallback(ts);
  try {
    return new Intl.DateTimeFormat(opts?.locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      ...(opts?.timeZone ? { timeZone: opts.timeZone } : {})
    }).format(d);
  } catch {
    return fallback(ts);
  }
}

/**
 * Local time with timezone context, e.g. "6:10:22 PM EST" or "6:10:22 PM GMT+5:30".
 * For forensic/evidence panels where timezone context matters. The short
 * timezone name is DST-aware (EST vs EDT, GMT vs BST).
 */
export function formatLocalTimeWithZone(ts: TimeInput, opts?: TimeFormatOptions): string {
  const d = toDate(ts);
  if (!d) return fallback(ts);
  try {
    return new Intl.DateTimeFormat(opts?.locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      ...(opts?.timeZone ? { timeZone: opts.timeZone } : {})
    }).format(d);
  } catch {
    return fallback(ts);
  }
}

/**
 * Local date + time with timezone context, e.g. "Jan 15, 6:10:22 PM EST".
 * For forensic inspectors showing historical events with full context.
 */
export function formatLocalDateTimeWithZone(ts: TimeInput, opts?: TimeFormatOptions): string {
  const d = toDate(ts);
  if (!d) return fallback(ts);
  try {
    return new Intl.DateTimeFormat(opts?.locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
      ...(opts?.timeZone ? { timeZone: opts.timeZone } : {})
    }).format(d);
  } catch {
    return fallback(ts);
  }
}

/**
 * Relative age, e.g. "6s ago" / "3m ago" / "2h ago".
 * Calculated from the canonical timestamp; future timestamps clamp to 0s.
 * Returns null when the timestamp is missing or unparseable.
 */
export function timeAgo(ts: TimeInput | null | undefined, now: number = Date.now()): string | null {
  if (ts === null || ts === undefined || ts === '') return null;
  const t = toDate(ts);
  if (!t) return null;
  const diff = Math.max(0, now - t.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}