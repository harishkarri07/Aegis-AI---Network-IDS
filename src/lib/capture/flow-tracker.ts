/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecodedPacketHeader } from './packet-decoder';

export interface FlowState {
  key: string;
  reverseKey: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  packetCount: number;
  byteCount: number;
  synCount: number;
  ackCount: number;
  rstCount: number;
  finCount: number;
  startTime: number;
  lastSeenTime: number;
  durationSeconds: number;
  state: 'INIT' | 'SYN_SENT' | 'SYN_ACK' | 'ESTABLISHED' | 'CLOSED' | 'RESET';
}

export interface HostWindowStats {
  srcIp: string;
  packetsInWindow: number;
  bytesInWindow: number;
  packetsPerSecond: number;
  bytesPerSecond: number;
  distinctDstPorts: number;
  distinctDstHosts: number;
  /** Distinct destination ports contacted on the CURRENT packet's dstIp within the window.
   *  Enables true vertical port-scan detection (many ports toward a SINGLE host) without
   *  firing on normal browsing that touches many hosts on different ports. O(1) lookup. */
  portsToCurrentDst: number;
  /** Average packet size (bytes) in window - O(1) derived from running totals. Used to
   *  separate high-packet-rate normal CDN/video streaming (MTU-sized ~1265B packets)
   *  from genuine volumetric floods (small packets). */
  avgBytesPerPacket: number;
  /** Observed first-to-last packet timestamp span (seconds) within the window.
   *  Informational only; NOT used as the primary PPS/BPS denominator.
   *  Kept around for diagnostics and future tuning without reintroducing
   *  timestamp-cluster rate inflation. */
  observedSpanSeconds: number;
  synCountInWindow: number;
  ackCountInWindow: number;
  rstCountInWindow: number;
  synToAckRatio: number;
  authAttempts: number;
  authFailedResets: number;
  privilegedPortBytes: number;
  isBurstTraffic: boolean;
  windowDurationSeconds: number;
}

const SENSITIVE_AUTH_PORTS = new Set([21, 22, 23, 445, 1433, 1521, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 9200]);
const PRIVILEGED_MANAGEMENT_PORTS = new Set([22, 23, 445, 3389, 8443, 9090, 10000]);

interface TimestampedRecord {
  time: number;
  bytes: number;
  dstIp: string;
  dstPort: number;
  flags: string[];
  /** L4 protocol of the record; port-derived statistics only apply to TCP/UDP. */
  protocol: string;
}

/**
 * Incremental accumulator for host window statistics.
 * Maintains running totals updated in O(1) per add/remove operation,
 * eliminating the need to iterate all records on every packet.
 */
interface HostWindowAccumulator {
  totalBytes: number;
  totalPackets: number;
  synCount: number;
  ackCount: number;
  rstCount: number;
  authAttempts: number;
  authFailedResets: number;
  privilegedPortBytes: number;
  /** dstPort → reference count (number of records with this port) */
  portCounts: Map<number, number>;
  /** dstIp → reference count */
  hostCounts: Map<string, number>;
  /** dstIp → (dstPort → refcount). Per-target port concentration used for
   *  vertical port-scan detection. Ref-counted so removals are exact. O(1) per op. */
  hostPortRefs: Map<string, Map<number, number>>;
  firstRecordTime: number;
  lastRecordTime: number;
}

function createAccumulator(): HostWindowAccumulator {
  return {
    totalBytes: 0,
    totalPackets: 0,
    synCount: 0,
    ackCount: 0,
    rstCount: 0,
    authAttempts: 0,
    authFailedResets: 0,
    privilegedPortBytes: 0,
    portCounts: new Map(),
    hostCounts: new Map(),
    hostPortRefs: new Map(),
    firstRecordTime: 0,
    lastRecordTime: 0,
  };
}

function addRecordToAcc(acc: HostWindowAccumulator, r: TimestampedRecord): void {
  acc.totalBytes += r.bytes;
  acc.totalPackets++;

  if (r.flags.includes('SYN')) acc.synCount++;
  if (r.flags.includes('ACK')) acc.ackCount++;
  if (r.flags.includes('RST')) acc.rstCount++;

  // Port-derived statistics only apply to real TCP/UDP transport ports.
  // ICMP (and OTHER) records carry no ports — their type/code values must
  // never be counted as ports, inflate distinctDstPorts/portsToCurrentDst,
  // or trip auth/privileged-port heuristics.
  const hasTransportPorts = r.protocol === 'TCP' || r.protocol === 'UDP';

  // Reference-count distinct ports (TCP/UDP only)
  if (hasTransportPorts) {
    acc.portCounts.set(r.dstPort, (acc.portCounts.get(r.dstPort) || 0) + 1);
  }
  // Reference-count distinct hosts (protocol-agnostic: ICMP hosts still count
  // toward destination-spread statistics such as the DoS concentration guard)
  acc.hostCounts.set(r.dstIp, (acc.hostCounts.get(r.dstIp) || 0) + 1);

  // Reference-count ports per destination host (vertical scan concentration) — TCP/UDP only
  if (hasTransportPorts) {
    let hostPorts = acc.hostPortRefs.get(r.dstIp);
    if (!hostPorts) {
      hostPorts = new Map();
      acc.hostPortRefs.set(r.dstIp, hostPorts);
    }
    hostPorts.set(r.dstPort, (hostPorts.get(r.dstPort) || 0) + 1);
  }

  if (hasTransportPorts && SENSITIVE_AUTH_PORTS.has(r.dstPort)) {
    acc.authAttempts++;
    if (r.flags.includes('RST')) {
      acc.authFailedResets++;
    }
  }

  if (hasTransportPorts && PRIVILEGED_MANAGEMENT_PORTS.has(r.dstPort)) {
    acc.privilegedPortBytes += r.bytes;
  }

  // Track time span
  if (acc.totalPackets === 1) {
    acc.firstRecordTime = r.time;
  }
  acc.lastRecordTime = r.time;
}

function removeRecordFromAcc(acc: HostWindowAccumulator, r: TimestampedRecord): void {
  acc.totalBytes -= r.bytes;
  acc.totalPackets--;

  if (r.flags.includes('SYN')) acc.synCount--;
  if (r.flags.includes('ACK')) acc.ackCount--;
  if (r.flags.includes('RST')) acc.rstCount--;

  // Mirror of addRecordToAcc: port-derived statistics only apply to TCP/UDP.
  const hasTransportPorts = r.protocol === 'TCP' || r.protocol === 'UDP';

  // Decrement port reference count (TCP/UDP only)
  if (hasTransportPorts) {
    const portCount = (acc.portCounts.get(r.dstPort) || 1) - 1;
    if (portCount <= 0) acc.portCounts.delete(r.dstPort);
    else acc.portCounts.set(r.dstPort, portCount);
  }

  // Decrement host reference count (protocol-agnostic)
  const hostCount = (acc.hostCounts.get(r.dstIp) || 1) - 1;
  if (hostCount <= 0) acc.hostCounts.delete(r.dstIp);
  else acc.hostCounts.set(r.dstIp, hostCount);

  // Decrement per-target port reference count (TCP/UDP only)
  if (hasTransportPorts) {
    const hostPorts = acc.hostPortRefs.get(r.dstIp);
    if (hostPorts) {
      const hpCount = (hostPorts.get(r.dstPort) || 1) - 1;
      if (hpCount <= 0) hostPorts.delete(r.dstPort);
      else hostPorts.set(r.dstPort, hpCount);
      if (hostPorts.size === 0) acc.hostPortRefs.delete(r.dstIp);
    }
  }

  if (hasTransportPorts && SENSITIVE_AUTH_PORTS.has(r.dstPort)) {
    acc.authAttempts = Math.max(0, acc.authAttempts - 1);
    if (r.flags.includes('RST')) {
      acc.authFailedResets = Math.max(0, acc.authFailedResets - 1);
    }
  }

  if (hasTransportPorts && PRIVILEGED_MANAGEMENT_PORTS.has(r.dstPort)) {
    acc.privilegedPortBytes -= r.bytes;
  }
}

/**
 * Stateful Flow and Host-level traffic tracker over a sliding time window.
 * Bounded in memory with automated eviction of idle flows.
 * Uses O(1) incremental statistics per packet via HostWindowAccumulator.
 */
export class FlowTracker {
  private flows: Map<string, FlowState> = new Map();
  private hostRecords: Map<string, TimestampedRecord[]> = new Map();
  private hostAccumulators: Map<string, HostWindowAccumulator> = new Map();
  private hostLastSeen: Map<string, number> = new Map();
  
  private readonly windowMs: number;
  private readonly maxFlows: number;
  private readonly idleTimeoutMs: number;
  private lastCleanupTime: number = Date.now();

  constructor(windowMs: number = 10_000, maxFlows: number = 10_000, idleTimeoutMs: number = 60_000) {
    this.windowMs = windowMs;
    this.maxFlows = maxFlows;
    this.idleTimeoutMs = idleTimeoutMs;
  }

  /**
   * Ingest a decoded packet header and update flow state and sliding window.
   * Per-packet cost: O(1) for host stats (incremental accumulator).
   */
  public update(packet: DecodedPacketHeader, timestampMs: number = Date.now()): { flow: FlowState; hostStats: HostWindowStats } {
    this.periodicCleanup(timestampMs);

    const flowKey = `${packet.srcIp}:${packet.srcPort}->${packet.dstIp}:${packet.dstPort}:${packet.protocol}`;
    const reverseKey = `${packet.dstIp}:${packet.dstPort}->${packet.srcIp}:${packet.srcPort}:${packet.protocol}`;

    // 1. Update or create 5-Tuple Flow State
    let flow = this.flows.get(flowKey);
    if (!flow) {
      // Check if reverse flow exists (e.g. response packet in same session)
      const reverseFlow = this.flows.get(reverseKey);
      if (reverseFlow) {
        flow = reverseFlow;
      } else {
        // Enforce max flows capacity with LRU eviction
        if (this.flows.size >= this.maxFlows) {
          const oldestKey = this.flows.keys().next().value;
          if (oldestKey) this.flows.delete(oldestKey);
        }

        flow = {
          key: flowKey,
          reverseKey,
          srcIp: packet.srcIp,
          dstIp: packet.dstIp,
          srcPort: packet.srcPort,
          dstPort: packet.dstPort,
          protocol: packet.protocol,
          packetCount: 0,
          byteCount: 0,
          synCount: 0,
          ackCount: 0,
          rstCount: 0,
          finCount: 0,
          startTime: timestampMs,
          lastSeenTime: timestampMs,
          durationSeconds: 0,
          state: 'INIT',
        };
        this.flows.set(flowKey, flow);
      }
    }

    flow.packetCount++;
    flow.byteCount += packet.totalLength;
    flow.lastSeenTime = timestampMs;
    flow.durationSeconds = Math.max(0.001, (timestampMs - flow.startTime) / 1000);

    if (packet.flags.includes('SYN')) flow.synCount++;
    if (packet.flags.includes('ACK')) flow.ackCount++;
    if (packet.flags.includes('RST')) {
      flow.rstCount++;
      flow.state = 'RESET';
    }
    if (packet.flags.includes('FIN')) {
      flow.finCount++;
      flow.state = 'CLOSED';
    }

    if (flow.state === 'INIT' && packet.flags.includes('SYN') && !packet.flags.includes('ACK')) {
      flow.state = 'SYN_SENT';
    } else if (flow.state === 'SYN_SENT' && packet.flags.includes('SYN') && packet.flags.includes('ACK')) {
      flow.state = 'SYN_ACK';
    } else if ((flow.state === 'SYN_ACK' || flow.state === 'SYN_SENT') && packet.flags.includes('ACK')) {
      flow.state = 'ESTABLISHED';
    }

    // 2. Update Host-Level Sliding Window
    let records = this.hostRecords.get(packet.srcIp);
    if (!records) {
      records = [];
      this.hostRecords.set(packet.srcIp, records);
    }

    let acc = this.hostAccumulators.get(packet.srcIp);
    if (!acc) {
      acc = createAccumulator();
      this.hostAccumulators.set(packet.srcIp, acc);
    }

    const newRecord: TimestampedRecord = {
      time: timestampMs,
      bytes: packet.totalLength,
      dstIp: packet.dstIp,
      dstPort: packet.dstPort,
      flags: packet.flags,
      protocol: packet.protocol,
    };

    records.push(newRecord);
    addRecordToAcc(acc, newRecord);
    this.hostLastSeen.set(packet.srcIp, timestampMs);

    // Prune records older than sliding window — O(removed) with incremental accumulator update
    const cutoff = timestampMs - this.windowMs;
    const startIndex = records.findIndex(r => r.time >= cutoff);
    if (startIndex > 0) {
      // Remove old records and subtract their contributions from the accumulator
      for (let i = 0; i < startIndex; i++) {
        removeRecordFromAcc(acc, records[i]);
      }
      records.splice(0, startIndex);
      // Update firstRecordTime from the new first record
      if (records.length > 0) {
        acc.firstRecordTime = records[0].time;
      }
    } else if (startIndex === -1 && records.length > 0) {
      // All records are old
      for (const r of records) {
        removeRecordFromAcc(acc, r);
      }
      records.length = 0;
      acc.firstRecordTime = 0;
      acc.lastRecordTime = 0;
    }

    // 3. Compute Host Sliding Window Statistics from accumulator — O(1)
    const hostStats = this.computeHostStatsFromAccumulator(packet.srcIp, acc, packet.dstIp);

    return { flow, hostStats };
  }

  /**
   * Compute host stats from the incremental accumulator — O(1) per call.
   */
  private computeHostStatsFromAccumulator(
    srcIp: string,
    acc: HostWindowAccumulator,
    dstIp: string
  ): HostWindowStats {
    const windowDurationSeconds = this.windowMs / 1000;
    const packetsInWindow = acc.totalPackets;

    // PPS/BPS use the configured sliding-window length as the canonical
    // rate window. Using the raw first-to-last packet timestamp span made
    // rates artificially high when packets arrived in identical or tightly
    // clustered timestamp batches (the span could collapse toward zero).
    // The sliding-window statistics already represent traffic over this
    // configured window, so rates should be normalized over it.
    const rateWindowSeconds = windowDurationSeconds;

    // Observed packet-timestamp span is preserved only as informational
    // metadata. It is not used as the primary PPS/BPS denominator.
    const observedSpanSeconds = acc.totalPackets > 1 && acc.firstRecordTime > 0
      ? Math.max(0, (acc.lastRecordTime - acc.firstRecordTime) / 1000)
      : 0;

    const packetsPerSecond = packetsInWindow / rateWindowSeconds;
    const bytesPerSecond = acc.totalBytes / rateWindowSeconds;
    const synToAckRatio = acc.ackCount > 0 ? acc.synCount / acc.ackCount : acc.synCount > 0 ? acc.synCount : 0;
    const isBurstTraffic = packetsPerSecond > 50 || bytesPerSecond > 300_000;
    const hostPorts = acc.hostPortRefs.get(dstIp);
    const portsToCurrentDst = hostPorts ? hostPorts.size : 0;
    const avgBytesPerPacket = packetsInWindow > 0 ? Math.round(acc.totalBytes / packetsInWindow) : 0;

    return {
      srcIp,
      packetsInWindow,
      bytesInWindow: acc.totalBytes,
      packetsPerSecond,
      bytesPerSecond,
      distinctDstPorts: acc.portCounts.size,
      distinctDstHosts: acc.hostCounts.size,
      portsToCurrentDst,
      avgBytesPerPacket,
      observedSpanSeconds,
      synCountInWindow: acc.synCount,
      ackCountInWindow: acc.ackCount,
      rstCountInWindow: acc.rstCount,
      synToAckRatio,
      authAttempts: acc.authAttempts,
      authFailedResets: acc.authFailedResets,
      privilegedPortBytes: acc.privilegedPortBytes,
      isBurstTraffic,
      windowDurationSeconds,
    };
  }

  /**
   * Periodic memory cleanup: Evicts idle flows and dead host records.
   */
  private periodicCleanup(now: number): void {
    if (now - this.lastCleanupTime < 15_000) return; // Clean every 15s
    this.lastCleanupTime = now;

    const idleCutoff = now - this.idleTimeoutMs;

    // Evict idle flows
    for (const [key, flow] of this.flows.entries()) {
      if (flow.lastSeenTime < idleCutoff) {
        this.flows.delete(key);
      }
    }

    // Evict idle hosts
    for (const [ip, lastSeen] of this.hostLastSeen.entries()) {
      if (lastSeen < idleCutoff) {
        this.hostRecords.delete(ip);
        this.hostAccumulators.delete(ip);
        this.hostLastSeen.delete(ip);
      }
    }
  }

  public getActiveFlowCount(): number {
    return this.flows.size;
  }

  public reset(): void {
    this.flows.clear();
    this.hostRecords.clear();
    this.hostAccumulators.clear();
    this.hostLastSeen.clear();
  }
}
