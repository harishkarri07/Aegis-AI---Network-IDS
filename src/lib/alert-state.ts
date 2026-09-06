/**
 * Latest System Alert stabilization helpers.
 *
 * The Live Monitor "What needs attention" card is fed by flushPacketBuffer()
 * in AegisDesktopApp, which runs at ~20 Hz. Under real capture, the Detection
 * Engine classifies sustained streams of packets as attacks (e.g. every packet
 * from a probing source while the sliding window shows >= 6 distinct ports).
 * Without stabilization the card re-binds to the newest non-NORMAL packet on
 * every flush, so it visibly churns through classifications, rules, sources,
 * and evidence at up to 20 Hz.
 *
 * The policy below keeps the card calm without hiding genuine detections:
 *  - The FIRST sighting of an alert signature updates the card immediately.
 *  - Repeats of the same signature within the hold window are suppressed.
 *  - A DIFFERENT signature (new source IP, new rule, or new category such as
 *    a DoS confirmation landing while a scan is ongoing) updates immediately.
 *  - Once the hold window expires, a repeat of the same signature may update
 *    again (episode continuation with fresh evidence).
 *
 * Pure module on purpose (no React/Electron imports) so it can be unit-tested
 * without a DOM, renderer, or network runtime.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AlertSignatureParts {
  category: string;
  /** Detection rule id, e.g. PROBE_PORT_SCAN, DOS_RATE_FLOOD. */
  rule?: string;
  /** Source IP the detection was attributed to. */
  srcIp?: string;
}

export interface LatestAlertState {
  /** Stable signature of the alert currently shown on the card. */
  signature: string;
  /** Timestamp (ms) when the card was last updated. */
  updatedAt: number;
}

/**
 * Stable signature for a detection episode: category + rule + source IP.
 * Two packets with the same signature belong to the same ongoing episode and
 * do not each need to repaint the card.
 */
export function alertSignatureOf(p: AlertSignatureParts): string {
  return [p.category, p.rule || '', p.srcIp || ''].join('|');
}

/**
 * Decide whether a newly detected packet should replace the Latest System
 * Alert card.
 *
 * @param prev the previous card state (null when the card is empty)
 * @param candidateSignature signature of the newly detected packet
 * @param nowMs current time in ms
 * @param holdMs how long the card holds a given signature before the same
 *   signature may refresh it again
 */
export function shouldUpdateLatestAlert(
  prev: LatestAlertState | null,
  candidateSignature: string,
  nowMs: number,
  holdMs: number
): boolean {
  if (!prev) {
    return true;
  }
  if (prev.signature !== candidateSignature) {
    return true;
  }
  return nowMs - prev.updatedAt >= holdMs;
}