/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackCategory, AttackExplanation, FeatureImportance, Indicator, Packet } from '../../types';
import { DecodedPacketHeader } from './packet-decoder';
import { FlowState, HostWindowStats } from './flow-tracker';

export interface DetectionResult {
  category: AttackCategory;
  confidence: number;
  is_anomaly: boolean;
  iso_score: number;
  binary: 0 | 1;
  explanation: AttackExplanation;
  features: number[];
  ruleTriggered: string;
}

/**
 * Per-source-IP DoS detection state machine state.
 * Tracks whether traffic from a given source IP is building evidence
 * toward a DoS confirmation, or is in a cooldown period after an alert.
 *
 * State transitions:
 *   IDLE     → BUILDING   (raw threshold first met)
 *   BUILDING → COOLDOWN   (threshold sustained ≥ 3 seconds — emit DoS alert)
 *   BUILDING → IDLE       (threshold no longer met — traffic normalized)
 *   COOLDOWN → COOLDOWN   (attack persists, re-confirm after cooldown expires)
 *   COOLDOWN → IDLE       (attack ended, cooldown expired — ready for future detection)
 */
interface DosDetectorState {
  /** Current state of the DoS detection for this source IP */
  state: 'IDLE' | 'BUILDING' | 'COOLDOWN';
  /** Timestamp (ms) when the raw DoS condition was first detected */
  suspiciousSince: number;
  /** Timestamp (ms) when the cooldown period expires */
  cooldownUntil: number;
  /** Which rule triggered the detection */
  ruleTriggered: string;
}

/**
 * Transparent, deterministic network intrusion detection engine based on
 * stateful flow analysis, sliding-window statistics, and verified security rules.
 *
 * DoS detection uses a three-state machine per source IP:
 *   IDLE → BUILDING → COOLDOWN → (IDLE or re-confirm)
 *
 * This prevents false-positive alert flooding by:
 * 1. Requiring sustained evidence (≥3 seconds) before confirming a DoS attack.
 * 2. Emitting at most one DoS alert per confirmation cycle.
 * 3. Implementing cooldown periods (30 seconds) between alerts.
 * 4. Using significantly raised thresholds that distinguish real attacks from
 *    normal hotspot traffic, streaming, and bursty browsing.
 */
export class DetectionEngine {
  // ─── DoS State Machine ───────────────────────────────────────────────
  private static dosStates: Map<string, DosDetectorState> = new Map();
  private static dosStateCleanupLastRun: number = 0;

  /**
   * Duration (ms) the raw DoS condition must be sustained before confirmation.
   * 3 seconds prevents transient traffic spikes from being classified as DoS.
   */
  private static readonly DOS_CONFIRM_DURATION_MS = 3_000;

  /**
   * Duration (ms) of the cooldown period after a confirmed DoS alert.
   * During cooldown, packets from this source are classified as NORMAL
   * to prevent one sustained attack from generating unlimited alerts.
   * After cooldown, if the attack persists, a new alert may be emitted.
   */
  private static readonly DOS_COOLDOWN_DURATION_MS = 30_000;

  /**
   * Evaluates a decoded packet against stateful flow metrics.
   *
   * @param skipDosStateMachine - When true, bypasses the DoS state machine and
   *   evaluates raw DoS thresholds directly. Used by explainVector() to always
   *   produce DoS explanations regardless of state machine state.
   */
  public static evaluate(
    packet: DecodedPacketHeader,
    flow: FlowState,
    hostStats: HostWindowStats,
    timestampMs: number = Date.now(),
    skipDosStateMachine: boolean = false
  ): DetectionResult {
    let category: AttackCategory = 'NORMAL';
    let confidence = 0.95;
    let ruleTriggered = 'BASELINE_CLEAN_FLOW';
    const indicators: Indicator[] = [];

    // Periodic cleanup of stale DoS states to prevent memory leaks
    this.maybeCleanupDosStates(timestampMs);

    // ─── RULE 1: Denial of Service (DoS) ───────────────────────────────
    // Stateful DoS detection with confirmation and cooldown mechanism.
    // Requires sustained evidence (≥3 seconds) across multiple evaluations
    // before confirming an attack, preventing transient spikes from triggering.
    const rawDosCheck = this.checkRawDosThresholds(hostStats, packet);
    let dosDecision: { category: AttackCategory; ruleTriggered: string; confidence: number; indicators: Indicator[] } | null = null;

    if (rawDosCheck) {
      if (skipDosStateMachine) {
        dosDecision = { category: 'DoS', ...rawDosCheck };
      } else {
        dosDecision = this.processDosStateMachine(rawDosCheck, packet.srcIp, timestampMs);
      }
    } else {
      // No raw threshold met — still advance state machine (may transition BUILDING → IDLE)
      if (!skipDosStateMachine) {
        this.processDosStateMachine(null, packet.srcIp, timestampMs);
      }
    }

    if (dosDecision) {
      category = dosDecision.category;
      ruleTriggered = dosDecision.ruleTriggered;
      confidence = dosDecision.confidence;
      indicators.push(...dosDecision.indicators);
    }    // ─── RULE 2: Network Probing / Scanning ─────────────────────────────
    // Port scan (many ports on one target) or host sweep (many targets on network)
    else if (hostStats.portsToCurrentDst >= 6 && hostStats.synToAckRatio >= 1.5) {
      // Real vertical scans concentrate many distinct ports toward a SINGLE host AND are
      // half-open (SYN-to-ACK ratio clearly > 1 because probe SYNs go unanswered).
      // portsToCurrentDst counts ports to the packet's destination host only; the extra
      // ratio guard excludes legitimate multi-connection conversations where every SYN
      // is answered (e.g. a busy API/CDN server holding many completed parallel
      // connections to this host shows ports>=6 but synToAckRatio ~1.0).
      category = 'Probe';
      ruleTriggered = 'PROBE_PORT_SCAN';
      confidence = Math.min(0.98, 0.65 + (hostStats.portsToCurrentDst / 18) * 0.30);
      indicators.push({
        feature: 'distinct_dst_ports_on_target',
        value: hostStats.portsToCurrentDst,
        threshold: '>= 6 distinct ports to one host',
        description: 'Vertical port scan detected touching multiple service ports on a single target host.'
      });
      indicators.push({
        feature: 'syn_to_ack_ratio',
        value: hostStats.synToAckRatio.toFixed(2),
        threshold: '>= 1.50',
        description: 'Unanswered half-open SYN probes indicate active port scanning (completed conversations show ratio ~1.0).'
      });
      indicators.push({
        feature: 'scan_target_ip',
        value: packet.dstIp,
        threshold: 'Single Host Sweep',
        description: `Targeting service discovery on host ${packet.dstIp}.`
      });
    }

    // ─── RULE 2b: Host Sweep — many targets on a focused port set ─────────────────
    // Horizontal sweep: one source probing a small port set across many hosts.
    // The <= 3 ports constraint avoids counting normal browsing (many hosts across
    // many ports) as a sweep.
    else if (hostStats.distinctDstHosts >= 5 && hostStats.distinctDstPorts <= 3) {
      // Host sweeps probe MANY hosts but stay focused on a small port set (e.g. 445, 22).
      // Normal browsing contacts many hosts ACROSS many ports (HTTPS/DNS/mDNS...), so the
      // additional <=3-port constraint prevents sweep false positives on routine web use.
      category = 'Probe';
      ruleTriggered = 'PROBE_HOST_SWEEP';
      confidence = Math.min(0.97, 0.68 + (hostStats.distinctDstHosts / 15) * 0.28);
      indicators.push({
        feature: 'distinct_dst_hosts',
        value: hostStats.distinctDstHosts,
        threshold: '>= 5 distinct IPs on a focused port set',
        description: 'Horizontal host sweep scanning across network subnet on a focused port set.'
      });
    }

    // ─── RULE 2c: SYN Stealth Scan — many ports, bare SYN, SYN-skewed ─────────────
    // Detects bare SYN packets (no ACK) sent to many distinct ports, indicating a
    // stealth half-open scan. Adds a SYN:ACK ratio guard so normal connection setup
    // (which quickly accumulates ACKs) is not flagged as stealth scanning.
    else if (
      packet.flags.includes('SYN') &&
      !packet.flags.includes('ACK') &&
      hostStats.portsToCurrentDst >= 4 &&
      hostStats.synToAckRatio >= 1.5
    ) {
      // Per-target port count: a stealth scan half-opens many ports on ONE host.
      // Normal browsers initiate SYNs to many DIFFERENT hosts on few ports each.
      // This rule also requires a SYN/ACK ratio >= 1.5 so that normal connection
      // setup (which quickly accumulates ACKs) is not flagged as stealth scanning.
      category = 'Probe';
      ruleTriggered = 'PROBE_SYN_STEALTH';
      confidence = 0.85;
      indicators.push({
        feature: 'stealth_syn_probes',
        value: `${hostStats.portsToCurrentDst} ports with bare SYN`,
        threshold: '>= 4 ports with bare SYN and SYN:ACK ratio >= 1.50',
        description: 'Stealth half-open TCP port interrogation across multiple ports.'
      });
    }

    // ─── RULE 3: Remote-to-Local (R2L) Brute Force & Unauthorized Access ─
    // Repeated connection attempts to sensitive authentication ports with connection resets
    else if (hostStats.authAttempts >= 3 && (hostStats.authFailedResets >= 2 || flow.rstCount >= 2)) {
      category = 'R2L';
      ruleTriggered = 'R2L_AUTH_BRUTE_FORCE';
      confidence = Math.min(0.96, 0.62 + (hostStats.authAttempts / 8) * 0.32);
      indicators.push({
        feature: 'auth_port_attempts',
        value: hostStats.authAttempts,
        threshold: '>= 3 attempts',
        description: 'Rapid connection attempts targeting credentialed authentication ports (SSH/FTP/RDP/DB).'
      });
      indicators.push({
        feature: 'auth_failed_resets',
        value: hostStats.authFailedResets,
        threshold: '>= 2 connection resets',
        description: 'High connection reset / termination frequency indicating authentication failures.'
      });
    }

    // ─── RULE 4: User-to-Root (U2R) Proxy Heuristic ─────────────────────
    // IMPORTANT & TRANSPARENT: Network packets cannot directly observe OS-level kernel / local
    // privilege escalation (which occurs inside host syscalls and process execution).
    // This rule provides a best-effort NETWORK PROXY SIGNAL for anomalous high-volume
    // administrative control channels or post-exploitation transfer bursts on privileged ports.
    else if (
      (packet.dstPort === 22 || packet.dstPort === 3389 || packet.dstPort === 445 || packet.dstPort === 8443) &&
      (hostStats.privilegedPortBytes >= 35_000 || (flow.byteCount >= 50_000 && flow.durationSeconds > 5))
    ) {
      category = 'U2R';
      ruleTriggered = 'U2R_PROXY_PRIVILEGE_BURST';
      confidence = Math.min(0.88, 0.58 + (hostStats.privilegedPortBytes / 80_000) * 0.28);
      indicators.push({
        feature: 'privileged_mgmt_bytes',
        value: `${(hostStats.privilegedPortBytes / 1024).toFixed(1)} KB`,
        threshold: '>= 35.0 KB sustained',
        description: '[PROXY HEURISTIC] Anomalous sustained data burst on administrative management channel.'
      });
      indicators.push({
        feature: 'target_mgmt_port',
        value: `${packet.dstPort} (${packet.protocol})`,
        threshold: 'Privileged Port',
        description: 'Note: Host-level process/syscall auditing required to verify true OS privilege escalation.'
      });
    }

    // ─── Deterministic Anomaly Scoring ───────────────────────────────────
    // Computes statistical deviation of the flow metrics from standard baseline
    const rateDev = Math.min(1.0, hostStats.packetsPerSecond / 60);
    const portSpreadDev = Math.min(1.0, (hostStats.distinctDstPorts - 1) / 8);
    const hostSpreadDev = Math.min(1.0, (hostStats.distinctDstHosts - 1) / 6);
    const synDev = hostStats.synToAckRatio > 2 ? Math.min(1.0, hostStats.synToAckRatio / 5) : 0;
    const resetDev = hostStats.authFailedResets > 0 ? Math.min(1.0, hostStats.authFailedResets / 4) : 0;

    const compositeAnomaly = (rateDev * 0.35) + (portSpreadDev * 0.25) + (hostSpreadDev * 0.15) + (synDev * 0.15) + (resetDev * 0.10);
    
    // iso_score in range [-1.0, +0.6]. Values < 0.0 represent anomalies
    const iso_score = parseFloat((0.45 - (compositeAnomaly * 1.35)).toFixed(3));
    const is_anomaly = iso_score < 0 || category !== 'NORMAL';
    const binary: 0 | 1 = category === 'NORMAL' ? 0 : 1;

    // ─── Deterministic Feature Weights ───────────────────────────────────
    const top_features: FeatureImportance[] = [
      { feature: 'src_packet_rate', importance: parseFloat((0.25 + rateDev * 0.15).toFixed(3)) },
      { feature: 'dst_port_dispersion', importance: parseFloat((0.20 + portSpreadDev * 0.15).toFixed(3)) },
      { feature: 'syn_to_ack_ratio', importance: parseFloat((0.18 + synDev * 0.12).toFixed(3)) },
      { feature: 'auth_failure_frequency', importance: parseFloat((0.15 + resetDev * 0.15).toFixed(3)) },
      { feature: 'privileged_payload_vol', importance: parseFloat((0.12 + (hostStats.privilegedPortBytes > 0 ? 0.10 : 0)).toFixed(3)) },
    ].sort((a, b) => b.importance - a.importance);

    // Normalize feature weights to sum to 1.0
    const totalWeight = top_features.reduce((acc, f) => acc + f.importance, 0);
    top_features.forEach(f => {
      f.importance = parseFloat((f.importance / totalWeight).toFixed(3));
    });

    const explanation = this.buildExplanation(category, ruleTriggered, indicators, top_features, packet, hostStats);

    // Standardized feature vector matching legacy format for backward compatibility
    const features = [
      flow.durationSeconds,
      packet.protocol === 'TCP' ? 1 : packet.protocol === 'UDP' ? 2 : 3,
      packet.dstPort,
      packet.flags.length,
      packet.totalLength,
      flow.byteCount,
      hostStats.packetsPerSecond,
      hostStats.distinctDstPorts,
      hostStats.distinctDstHosts,
      hostStats.authAttempts,
      hostStats.authFailedResets,
      flow.state === 'ESTABLISHED' ? 1 : 0,
      category === 'U2R' ? 1 : 0,
      flow.rstCount,
      hostStats.synCountInWindow,
      hostStats.ackCountInWindow,
      hostStats.synToAckRatio,
      rateDev,
      compositeAnomaly,
      iso_score
    ];

    return {
      category,
      confidence: parseFloat(confidence.toFixed(3)),
      is_anomaly,
      iso_score,
      binary,
      explanation,
      features,
      ruleTriggered
    };
  }

  // ─── DoS Threshold Checking ──────────────────────────────────────────

  /**
   * Check raw DoS thresholds against current host statistics.
   *
   * Uses significantly raised thresholds compared to original implementation
   * to avoid false positives on normal hotspot traffic, streaming, or browsing.
   *
   * Thresholds (previous → new):
   *   SYN Flood:    ≥ 12 SYNs + ratio ≥ 2.5  →  ≥ 50 SYNs + ratio ≥ 3.0
   *   Rate Flood:   ≥ 75 PPS or ≥ 60 pkts/10s →  ≥ 200 PPS or ≥ 2000 pkts/10s
   *   Bandwidth:    ≥ 400 KB/s               →  ≥ 2 MB/s (with concentration check)
   *
   * A concentration check (distinctDstHosts) is applied to rate flood and
   * bandwidth burst to distinguish DoS (targeted at few hosts) from legitimate
   * distributed traffic (browsing many different servers).
   */
  private static checkRawDosThresholds(
    hostStats: HostWindowStats,
    _packet: DecodedPacketHeader
  ): { ruleTriggered: string; confidence: number; indicators: Indicator[] } | null {
    // SYN Flood: sustained unanswered TCP SYNs without completing handshake
    if (hostStats.synCountInWindow >= 50 && hostStats.synToAckRatio >= 3.0) {
      return {
        ruleTriggered: 'DOS_SYN_FLOOD',
        confidence: Math.min(0.98, 0.75 + (hostStats.synToAckRatio / 10) * 0.20),
        indicators: [
          {
            feature: 'syn_to_ack_ratio',
            value: hostStats.synToAckRatio.toFixed(2),
            threshold: '>= 3.00',
            description: 'Sustained unanswered TCP SYN packets indicate SYN exhaustion / half-open attack.'
          },
          {
            feature: 'syn_count_10s',
            value: hostStats.synCountInWindow,
            threshold: '>= 50 SYNs',
            description: 'High-volume SYN burst without completing TCP handshake.'
          }
        ]
      };
    }

    // Rate Flood: very high packet rate from single source, somewhat concentrated
    // Concentration check: traffic to ≤10 distinct hosts (legitimate browsing typically
    // contacts many more servers; DoS targets fewer endpoints)
    //
    // Streaming discriminator (avgBytesPerPacket < 1000):
    // Real-packet runtime validation on Wi-Fi showed legitimate CDN/video streaming
    // (e.g. Google/YouTube over QUIC) sustains 250-565 PPS with MTU-sized packets
    // (avg bytes ≈ 1265), which the 200 PPS threshold alone flagged as DoS. Genuine
    // volumetric floods (SYN flurries, DNS/UDP amplification, ACK storms) are made of
    // small packets. Requiring an average packet size below 1000 bytes keeps true
    // floods detectable while excluding high-rate large-packet streaming.
    if ((hostStats.packetsPerSecond >= 200 || hostStats.packetsInWindow >= 2000)
        && hostStats.distinctDstHosts <= 10
        && hostStats.avgBytesPerPacket < 1000) {
      return {
        ruleTriggered: 'DOS_RATE_FLOOD',
        confidence: Math.min(0.99, 0.72 + (hostStats.packetsPerSecond / 500) * 0.25),
        indicators: [
          {
            feature: 'src_pps',
            value: `${hostStats.packetsPerSecond.toFixed(1)} pkt/s`,
            threshold: '>= 200.0 pkt/s',
            description: 'Packet ingestion rate from source IP exceeds volumetric flood threshold.'
          },
          {
            feature: 'packets_in_window',
            value: hostStats.packetsInWindow,
            threshold: '>= 2000 pkts / 10s',
            description: 'Sustained high burst concentration in current sliding window.'
          }
        ]
      };
    }

    // Bandwidth Burst: very high throughput targeting few destinations
    // Concentration check: traffic to ≤3 distinct hosts
    if (hostStats.bytesPerSecond >= 2_000_000 && hostStats.distinctDstHosts <= 3) {
      return {
        ruleTriggered: 'DOS_BANDWIDTH_BURST',
        confidence: Math.min(0.96, 0.70 + (hostStats.bytesPerSecond / 5_000_000) * 0.25),
        indicators: [
          {
            feature: 'bytes_per_second',
            value: `${(hostStats.bytesPerSecond / 1024).toFixed(1)} KB/s`,
            threshold: '>= 2000.0 KB/s',
            description: 'High throughput data stream targeting single endpoint.'
          }
        ]
      };
    }

    return null;
  }

  // ─── DoS State Machine ───────────────────────────────────────────────

  /**
   * Process the DoS state machine for a given source IP.
   *
   * State transitions:
   *   IDLE     + threshold met  → BUILDING   (return null / classify as NORMAL)
   *   BUILDING + threshold met  + sustained ≥ 3s → COOLDOWN (return DoS — ONE alert)
   *   BUILDING + threshold not met → IDLE    (return null / classify as NORMAL)
   *   COOLDOWN + cooldown expired + threshold met → COOLDOWN (return DoS — re-alert)
   *   COOLDOWN + cooldown expired + threshold not met → IDLE
   *   COOLDOWN + cooldown not expired → COOLDOWN (return null / classify as NORMAL)
   *
   * This ensures ONE SUSTAINED ATTACK CONDITION ≠ ONE NEW DOS EVENT FOR EVERY PACKET.
   * Instead, at most one DoS alert is emitted per confirmation cycle (~30 seconds).
   */
  private static processDosStateMachine(
    rawCheck: { ruleTriggered: string; confidence: number; indicators: Indicator[] } | null,
    srcIp: string,
    timestampMs: number
  ): { category: AttackCategory; ruleTriggered: string; confidence: number; indicators: Indicator[] } | null {
    let state = this.dosStates.get(srcIp);
    if (!state) {
      state = { state: 'IDLE', suspiciousSince: 0, cooldownUntil: 0, ruleTriggered: '' };
      this.dosStates.set(srcIp, state);
    }

    const thresholdMet = rawCheck !== null;
    const now = timestampMs;

    switch (state.state) {
      case 'IDLE':
        if (thresholdMet) {
          // First detection — start building evidence
          state.state = 'BUILDING';
          state.suspiciousSince = now;
          state.ruleTriggered = rawCheck!.ruleTriggered;
        }
        return null; // CLASSIFY AS NORMAL

      case 'BUILDING':
        if (thresholdMet && (now - state.suspiciousSince) >= this.DOS_CONFIRM_DURATION_MS) {
          // Sustained evidence confirmed — emit DoS and immediately enter cooldown
          state.state = 'COOLDOWN';
          state.cooldownUntil = now + this.DOS_COOLDOWN_DURATION_MS;
          return {
            category: 'DoS',
            ruleTriggered: state.ruleTriggered,
            confidence: rawCheck!.confidence,
            indicators: rawCheck!.indicators
          };
        } else if (!thresholdMet) {
          // Traffic returned to normal before confirmation — reset to IDLE
          state.state = 'IDLE';
          state.suspiciousSince = 0;
        }
        return null; // CLASSIFY AS NORMAL (still building evidence)

      case 'COOLDOWN':
        if (now >= state.cooldownUntil) {
          if (thresholdMet) {
            // Attack still ongoing after cooldown — re-confirm and restart cooldown
            state.cooldownUntil = now + this.DOS_COOLDOWN_DURATION_MS;
            return {
              category: 'DoS',
              ruleTriggered: state.ruleTriggered,
              confidence: rawCheck!.confidence,
              indicators: rawCheck!.indicators
            };
          } else {
            // Attack ended — reset to IDLE for future detection
            state.state = 'IDLE';
            state.suspiciousSince = 0;
          }
        }
        return null; // CLASSIFY AS NORMAL (in cooldown)

      default:
        state.state = 'IDLE';
        return null;
    }
  }

  /**
   * Periodic cleanup of stale DoS states to prevent memory leaks.
   * States that have been IDLE for longer than 3× the cooldown duration are evicted.
   */
  private static maybeCleanupDosStates(now: number): void {
    if (now - this.dosStateCleanupLastRun < 60_000) return;
    this.dosStateCleanupLastRun = now;

    const staleThreshold = now - (this.DOS_COOLDOWN_DURATION_MS * 3);
    for (const [ip, state] of this.dosStates.entries()) {
      if (state.state === 'IDLE' && state.suspiciousSince > 0 && state.suspiciousSince < staleThreshold) {
        this.dosStates.delete(ip);
      }
    }

    // Force evict if map grows excessively large
    if (this.dosStates.size > 1000) {
      this.dosStates.clear();
    }
  }

  /**
   * Reset internal DoS state machine for testing.
   * Not part of the production API.
   */
  public static resetForTesting(): void {
    this.dosStates.clear();
    this.dosStateCleanupLastRun = 0;
  }

  // ─── Explanation Building ─────────────────────────────────────────────

  private static buildExplanation(
    category: AttackCategory,
    ruleTriggered: string,
    indicators: Indicator[],
    top_features: FeatureImportance[],
    packet: DecodedPacketHeader,
    hostStats: HostWindowStats
  ): AttackExplanation {
    switch (category) {
      case 'DoS':
        return {
          attack_name: 'Denial of Service (DoS)',
          severity: 'CRITICAL',
          narrative: `Confirmed sustained DoS attack: ${ruleTriggered === 'DOS_SYN_FLOOD' ? 'SYN exhaustion' : ruleTriggered === 'DOS_RATE_FLOOD' ? 'volumetric rate flood' : 'bandwidth burst'} from ${packet.srcIp} targeting port ${packet.dstPort} (${hostStats.packetsPerSecond.toFixed(1)} pkt/s, SYN/ACK ratio ${hostStats.synToAckRatio.toFixed(2)}). Sustained for ≥ ${this.DOS_CONFIRM_DURATION_MS / 1000}s before confirmation. Rule: ${ruleTriggered}.`,
          mitigation: `Apply rate-limiting and SYN cookies on port ${packet.dstPort}. Block offending source IP ${packet.srcIp} on boundary firewall.`,
          indicators,
          top_features,
          icon: '🚫'
        };

      case 'Probe':
        return {
          attack_name: 'Network Probing / Port Scanning',
          severity: 'HIGH',
          narrative: `Reconnaissance scanning pattern observed from ${packet.srcIp}: contacted ${hostStats.distinctDstPorts} distinct ports across ${hostStats.distinctDstHosts} host(s) in the 10-second sliding window. Rule: ${ruleTriggered}.`,
          mitigation: `Enforce port-scan drop rules in iptables/Windows Defender Firewall. Verify perimeter services on target host ${packet.dstIp} are properly filtered.`,
          indicators,
          top_features,
          icon: '🔍'
        };

      case 'R2L':
        return {
          attack_name: 'Remote-to-Local (R2L) Unauthorized Access',
          severity: 'HIGH',
          narrative: `Brute-force credential interrogation or unauthorized connection attempts detected against sensitive authentication service on port ${packet.dstPort} (${hostStats.authAttempts} attempts, ${hostStats.authFailedResets} resets). Rule: ${ruleTriggered}.`,
          mitigation: `Enforce Fail2ban or IP lockout after 3 consecutive failures. Require Multi-Factor Authentication (MFA) on service port ${packet.dstPort}.`,
          indicators,
          top_features,
          icon: '🔓'
        };

      case 'U2R':
        return {
          attack_name: 'User-to-Root (U2R) Proxy Signal',
          severity: 'CRITICAL',
          narrative: `[PROXY HEURISTIC] Anomalous sustained data burst (${(hostStats.privilegedPortBytes / 1024).toFixed(1)} KB) on administrative management channel ${packet.dstPort}. Note: Network packets cannot observe kernel syscalls directly; host audit logs (auditd/Sysmon) required for verification.`,
          mitigation: `Audit process execution and privilege changes on target host ${packet.dstIp}. Review sudo/su logs and isolate endpoint if unauthorized.`,
          indicators,
          top_features,
          icon: '👑'
        };

      case 'NORMAL':
      default:
        return {
          attack_name: 'Normal Traffic',
          severity: 'NORMAL',
          narrative: `Traffic from ${packet.srcIp} to ${packet.dstIp}:${packet.dstPort} (${packet.protocol}) is within standard operational baselines (PPS: ${hostStats.packetsPerSecond.toFixed(1)}, Ports: ${hostStats.distinctDstPorts}).`,
          mitigation: 'No mitigation required. System is operating within baseline parameters.',
          indicators,
          top_features,
          icon: '🛡️'
        };
    }
  }

  /**
   * Generates a deterministic explanation for a simulated/hypothetical attack vector
   * to power the "Explain Alert" view with transparent, real-world metrics.
   *
   * Uses skipDosStateMachine=true to always produce DoS explanations regardless
   * of the state machine's current state for this IP.
   */
  public static explainVector(category: AttackCategory): AttackExplanation {
    const dummyPacket: DecodedPacketHeader = {
      srcIp: category === 'NORMAL' ? '192.168.1.105' : '198.51.100.42',
      dstIp: '192.168.1.1',
      srcPort: 49200,
      dstPort: category === 'R2L' ? 22 : category === 'U2R' ? 445 : category === 'DoS' ? 80 : 8080,
      protocol: 'TCP',
      flags: ['SYN'],
      payloadLength: category === 'U2R' ? 45000 : 64,
      totalLength: category === 'U2R' ? 45040 : 104,
      ttl: 64,
      isFragment: false
    };

    const dummyStats: HostWindowStats = {
      srcIp: dummyPacket.srcIp,
      packetsInWindow: category === 'DoS' ? 2500 : category === 'Probe' ? 25 : category === 'R2L' ? 12 : 5,
      bytesInWindow: category === 'DoS' ? 400000 : category === 'U2R' ? 65000 : 2500,
      packetsPerSecond: category === 'DoS' ? 250.0 : category === 'Probe' ? 18.0 : category === 'R2L' ? 4.2 : 1.1,
      bytesPerSecond: category === 'DoS' ? 2500000 : category === 'U2R' ? 45000 : 1200,
      distinctDstPorts: category === 'Probe' ? 14 : 1,
      distinctDstHosts: category === 'Probe' ? 6 : 1,
      portsToCurrentDst: category === 'Probe' ? 14 : 1,
      avgBytesPerPacket: category === 'DoS' ? 160 : category === 'U2R' ? 800 : 500,
      observedSpanSeconds: 0,
      synCountInWindow: category === 'DoS' ? 95 : 3,
      ackCountInWindow: category === 'DoS' ? 10 : 3,
      rstCountInWindow: category === 'R2L' ? 6 : 0,
      synToAckRatio: category === 'DoS' ? 9.5 : 1.0,
      authAttempts: category === 'R2L' ? 7 : 0,
      authFailedResets: category === 'R2L' ? 5 : 0,
      privilegedPortBytes: category === 'U2R' ? 52000 : 0,
      isBurstTraffic: category === 'DoS' || category === 'U2R',
      windowDurationSeconds: 10
    };

    const dummyFlow: FlowState = {
      key: `${dummyPacket.srcIp}:${dummyPacket.srcPort}->${dummyPacket.dstIp}:${dummyPacket.dstPort}:TCP`,
      reverseKey: `${dummyPacket.dstIp}:${dummyPacket.dstPort}->${dummyPacket.srcIp}:${dummyPacket.srcPort}:TCP`,
      srcIp: dummyPacket.srcIp,
      dstIp: dummyPacket.dstIp,
      srcPort: dummyPacket.srcPort,
      dstPort: dummyPacket.dstPort,
      protocol: 'TCP',
      packetCount: dummyStats.packetsInWindow,
      byteCount: dummyStats.bytesInWindow,
      synCount: dummyStats.synCountInWindow,
      ackCount: dummyStats.ackCountInWindow,
      rstCount: dummyStats.rstCountInWindow,
      finCount: 0,
      startTime: Date.now() - 10000,
      lastSeenTime: Date.now(),
      durationSeconds: 10,
      state: 'ESTABLISHED'
    };

    const result = this.evaluate(dummyPacket, dummyFlow, dummyStats, Date.now(), true);
    return result.explanation;
  }
}
