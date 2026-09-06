/**
 * Aegis Local Server Request Guard
 *
 * Pure-function security helpers for the Electron local static + SIEM API
 * server (see electron/main.ts handleRequest). The server listens on the
 * loopback interface only, but without further checks it is still reachable
 * by:
 *
 *  1. DNS rebinding — a public hostname resolving to 127.0.0.1 makes the
 *     server appear same-origin to a browser while `Host` reveals the trick.
 *  2. Drive-by cross-origin requests — any website open in any browser on the
 *     machine could previously POST SIEM events or PATCH alert statuses,
 *     because the API answered with `Access-Control-Allow-Origin: *`.
 *
 * This module centralizes the policy so it can be unit-tested without an
 * Electron runtime:
 *
 *  - Only loopback Host headers are accepted at all.
 *  - State-changing methods (POST/PATCH/PUT/DELETE) are additionally blocked
 *    when browser signals (`Sec-Fetch-Site` / `Origin`) indicate a
 *    cross-origin or cross-site request.
 *  - Non-browser clients (the Python endpoint agent, curl, SOC automation)
 *    send neither header and remain fully supported.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/** Hard cap for SIEM API request bodies (10 MB). Ingest batches are far below this. */
export const MAX_API_BODY_BYTES = 10 * 1024 * 1024;

export interface RequestGuardInput {
  method: string;
  /** Raw Host header, e.g. "127.0.0.1:3000". */
  host?: string;
  /** Raw Origin header, if the client sent one. */
  origin?: string;
  /** Raw Sec-Fetch-Site header, if the client sent one (Chromium-family browsers). */
  secFetchSite?: string;
}

export interface RequestGuardDecision {
  allowed: boolean;
  reason?: string;
}

const LOOPBACK_HOSTNAMES = new Set(['127.0.0.1', 'localhost', '::1']);

/**
 * Extract the hostname from a Host header value, stripping any port.
 * Handles plain hosts ("localhost:3000"), IPv4 ("127.0.0.1:3000") and
 * bracketed IPv6 ("[::1]:3000", "[::1]").
 * Returns null when the value is empty or not a known loopback name.
 */
export function loopbackHostnameOf(host?: string): string | null {
  if (!host) {
    return null;
  }
  let value = host.trim().toLowerCase();
  if (!value) {
    return null;
  }
  const bracketed = /^\[(.+)\](?::\d+)?$/.exec(value);
  if (bracketed) {
    value = bracketed[1];
  } else {
    // Strip a single trailing ":port" only for non-IPv6 values
    // (IPv6 without brackets contains multiple colons and no port).
    const first = value.indexOf(':');
    const last = value.lastIndexOf(':');
    if (first !== -1 && first === last) {
      value = value.slice(0, first);
    }
  }
  return LOOPBACK_HOSTNAMES.has(value) ? value : null;
}

/**
 * Decide whether an incoming request may be served by the local server.
 *
 * GET/HEAD/OPTIONS only require a loopback Host header. State-changing
 * methods are additionally rejected when the request demonstrably comes from
 * a browser context that is not this app's own origin.
 */
export function isRequestAllowed(input: RequestGuardInput): RequestGuardDecision {
  if (!loopbackHostnameOf(input.host)) {
    return {
      allowed: false,
      reason: 'Forbidden: this server only accepts loopback requests',
    };
  }

  const method = (input.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { allowed: true };
  }

  // Browser-initiated cross-site request (any site → our loopback server).
  // Chromium sends Sec-Fetch-Site; treat "same-site" (another local port/app)
  // as untrusted as well — only this app's own origin is trusted.
  if (input.secFetchSite === 'cross-site' || input.secFetchSite === 'same-site') {
    return {
      allowed: false,
      reason: 'Forbidden: cross-origin state changes are not allowed',
    };
  }

  // Origin-based defense for browsers that do not send Sec-Fetch-Site.
  // Same-origin POSTs include `Origin: http://<host>`; headerless clients
  // (agents, curl) send no Origin and stay allowed.
  if (input.origin !== undefined) {
    const expected = `http://${(input.host || '').toLowerCase()}`;
    if (input.origin.trim().toLowerCase() !== expected) {
      return {
        allowed: false,
        reason: 'Forbidden: cross-origin state changes are not allowed',
      };
    }
  }

  return { allowed: true };
}
