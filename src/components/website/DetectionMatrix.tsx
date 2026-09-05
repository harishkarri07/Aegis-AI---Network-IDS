'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Terminal,
  Activity,
  Layers,
  Server
} from 'lucide-react';

export function DetectionMatrix() {
  const [filterType, setFilterType] = useState<'all' | 'network' | 'endpoint'>('all');

  const detections = [
    {
      id: 'syn_flood',
      type: 'network',
      threat: 'TCP SYN Flood DoS',
      category: 'DoS',
      observedBehavior:
        'Rapid surge (>100 pps) of TCP SYN packets originating from one or more IP addresses without subsequent ACK handshakes.',
      detectionLogic:
        '5-tuple flow window evaluates SYN rate > 50 pps and SYN-to-ACK handshake ratio < 0.1 over a 10-second sliding temporal window.',
      alertName: 'RULE_SYN_FLOOD_DETECTED',
      risk: 'HIGH (85-95%)',
      mitre: 'T1498.001 (Network Denial of Service: Direct Flood)',
      scope: 'Network Layer-4'
    },
    {
      id: 'volumetric_flood',
      type: 'network',
      threat: 'Volumetric Bandwidth Flood',
      category: 'DoS',
      observedBehavior:
        'Abnormal volume of jumbo UDP or ICMP payloads saturating interface throughput to a single internal destination host.',
      detectionLogic:
        'Byte rate exceeds baseline threshold (>200 kB/s) across single destination IP with high packet repetition frequency.',
      alertName: 'RULE_VOLUMETRIC_DOS_FLOOD',
      risk: 'CRITICAL (90-98%)',
      mitre: 'T1498 (Network Denial of Service)',
      scope: 'Network Layer-3/4'
    },
    {
      id: 'vertical_scan',
      type: 'network',
      threat: 'Vertical Port Scan',
      category: 'Probe',
      observedBehavior:
        'Single source IP sending sequential probe packets (SYN, NULL, FIN) across multiple destination ports on a target host within seconds.',
      detectionLogic:
        'Sliding window monitors unique destination port count per source IP; triggers when distinct_ports > 15 within 10 seconds.',
      alertName: 'RULE_PROBE_PORT_SCAN',
      risk: 'MEDIUM (70-85%)',
      mitre: 'T1046 (Network Service Discovery)',
      scope: 'Network Layer-4'
    },
    {
      id: 'horizontal_sweep',
      type: 'network',
      threat: 'Horizontal Subnet Sweep',
      category: 'Probe',
      observedBehavior:
        'Single host attempting ICMP Echo or TCP SYN connection to port 445/3389/22 across multiple adjacent IPs in the local subnet.',
      detectionLogic:
        'Flow tracker correlates distinct destination host count from a single internal source IP exceeding subnet baseline.',
      alertName: 'RULE_HOST_SWEEP_DISCOVERY',
      risk: 'MEDIUM (65-80%)',
      mitre: 'T1018 (Remote System Discovery)',
      scope: 'Network Layer-3'
    },
    {
      id: 'r2l_bruteforce',
      type: 'network',
      threat: 'Remote-to-Local (R2L) Brute Force',
      category: 'R2L',
      observedBehavior:
        'Repeated connection attempts to privileged service ports (SSH 22, Telnet 23, RDP 3389) immediately followed by TCP RST teardowns.',
      detectionLogic:
        'Correlates repeated reset count (syn_rst_ratio > 0.75) against authentication port endpoints over sliding window.',
      alertName: 'RULE_R2L_AUTH_BRUTE_FORCE',
      risk: 'HIGH (80-92%)',
      mitre: 'T1110 (Brute Force: Password Guessing)',
      scope: 'Network Layer-4 & Service Port'
    },
    {
      id: 'u2r_burst',
      type: 'network',
      threat: 'Privileged Service Burst Signal',
      category: 'U2R',
      observedBehavior:
        'Sustained rapid packet exchange with local management and remote execution ports indicating interactive shell or proxy activity.',
      detectionLogic:
        'Flags sustained bidirectional high-rate flows on administrative ports without preceding interactive DNS discovery.',
      alertName: 'RULE_U2R_PRIVILEGED_BURST',
      risk: 'HIGH (75-88%)',
      mitre: 'T1068 (Exploitation for Privilege Escalation)',
      scope: 'Network Proxy Signal (Host Confirmation Required)'
    },
    {
      id: 'auth_failed_host',
      type: 'endpoint',
      threat: 'Host SSH / Sudo Auth Failure Spikes',
      category: 'Endpoint',
      observedBehavior:
        'Endpoint agent monitors `/var/log/auth.log` or Windows Security Event ID 4625 for multiple failed password attempts.',
      detectionLogic:
        'Agent aggregation counts failed authentication attempts for single username/IP exceeding 5 within 60 seconds.',
      alertName: 'HOST_AUTH_FAIL_EXCEEDED',
      risk: 'HIGH (85%)',
      mitre: 'T1110.001 (Password Spraying)',
      scope: 'Endpoint Host Telemetry'
    },
    {
      id: 'priv_esc_sudo',
      type: 'endpoint',
      threat: 'Unauthorized Sudo / Privilege Elevation',
      category: 'Endpoint',
      observedBehavior:
        'User executing unauthorized administrative commands or sudoers modification reported by local host syslog collector.',
      detectionLogic:
        'Matches audit events containing `sudo: auth failure` or root command invocation by non-whitelisted service accounts.',
      alertName: 'HOST_PRIV_ESC_ATTEMPT',
      risk: 'CRITICAL (92%)',
      mitre: 'T1548.003 (Abuse Elevation Control Mechanism: Sudo)',
      scope: 'Endpoint Host Telemetry'
    }
  ];

  const filteredDetections = detections.filter((d) => {
    if (filterType === 'all') return true;
    return d.type === filterType;
  });

  return (
    <section className="py-20 bg-[#070b14] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Deterministic Detection Rules</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            SUPPORTED THREAT DETECTIONS &amp; HEURISTICS
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Aegis clearly distinguishes between network-layer wire signals and host-layer endpoint events, providing explainable detection without inflated marketing claims.
          </p>

          {/* Filter Pills */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterType === 'all'
                  ? 'bg-[#00d4ff] text-[#070b14]'
                  : 'bg-[#0d1424] text-[#94a3b8] hover:text-white border border-[#1e293b]'
              }`}
            >
              All Detections ({detections.length})
            </button>
            <button
              onClick={() => setFilterType('network')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterType === 'network'
                  ? 'bg-[#00d4ff] text-[#070b14]'
                  : 'bg-[#0d1424] text-[#94a3b8] hover:text-white border border-[#1e293b]'
              }`}
            >
              Network IDS ({detections.filter((d) => d.type === 'network').length})
            </button>
            <button
              onClick={() => setFilterType('endpoint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterType === 'endpoint'
                  ? 'bg-[#00d4ff] text-[#070b14]'
                  : 'bg-[#0d1424] text-[#94a3b8] hover:text-white border border-[#1e293b]'
              }`}
            >
              Host SIEM Agent ({detections.filter((d) => d.type === 'endpoint').length})
            </button>
          </div>
        </div>

        {/* Threat Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDetections.map((det) => (
            <div
              key={det.id}
              className="bg-[#0b1220] border border-[#1e293b] hover:border-[#00d4ff]/40 rounded-2xl p-6 space-y-4 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 border-b border-[#1e293b]/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        det.type === 'network'
                          ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
                          : 'bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30'
                      }`}
                    >
                      {det.scope}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748b]">{det.mitre}</span>
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">{det.threat}</h3>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#64748b] font-mono block">Severity</span>
                  <span className="text-xs font-bold font-mono text-[#ff3366]">{det.risk}</span>
                </div>
              </div>

              {/* Behavior & Logic Step Sequence */}
              <div className="space-y-3 text-xs">
                <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                  <span className="text-[10px] font-bold font-mono text-[#94a3b8] uppercase tracking-wider block">
                    1. Observed Traffic Behavior
                  </span>
                  <p className="text-white font-mono leading-relaxed">{det.observedBehavior}</p>
                </div>

                <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                  <span className="text-[10px] font-bold font-mono text-[#00d4ff] uppercase tracking-wider block">
                    2. Deterministic Rule Evaluation
                  </span>
                  <p className="text-[#cbd5e1] font-mono leading-relaxed">{det.detectionLogic}</p>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] font-mono">
                  <span className="text-[#64748b]">Generated Alert:</span>
                  <span className="text-[#00ff88] font-bold">{det.alertName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
