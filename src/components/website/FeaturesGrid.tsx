'use client';

import React from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  ShieldAlert,
  Layers,
  Search,
  FileText,
  Radio,
  Server,
  Zap,
  CheckCircle2,
  Lock,
  Cpu
} from 'lucide-react';

export function FeaturesGrid() {
  const features = [
    {
      icon: Activity,
      title: 'Real-Time Packet Monitoring',
      badge: 'Native PCAP',
      badgeColor: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30',
      description:
        'Captures raw layer-2 Ethernet frames directly from the network interface using native Npcap (Windows) or libpcap (macOS/Linux) bindings without synthetic emulation.',
      points: [
        'Promiscuous & native NIC binding',
        'Sub-millisecond packet dissection',
        'Ethernet, IPv4, TCP, UDP, ICMP support'
      ]
    },
    {
      icon: BarChart3,
      title: 'Deep Traffic & Flow Analysis',
      badge: '5-Tuple State',
      badgeColor: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
      description:
        'Inspects protocols, active flows, conversations, endpoints, destination ports, and bandwidth distributions across sliding 10-second temporal windows.',
      points: [
        'LRU memory-bounded flow tracker',
        'SYN-to-ACK handshake ratio tracking',
        'Entropy and port diversity calculations'
      ]
    },
    {
      icon: Brain,
      title: 'Deterministic Intrusion Detection',
      badge: 'Rule Engine',
      badgeColor: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30',
      description:
        'Evaluates traffic against deterministic, explainable security heuristics that guarantee reproducible results with zero hallucination or black-box drift.',
      points: [
        'Stateful sliding-window heuristics',
        'Auditable rule thresholds',
        'Deterministic classification pipeline'
      ]
    },
    {
      icon: ShieldAlert,
      title: 'Multi-Vector Threat Detection',
      badge: 'Threat Matrix',
      badgeColor: 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/30',
      description:
        'Identifies real-world adversary behaviors including vertical/horizontal port scans, TCP SYN floods, volumetric bandwidth anomalies, and credential brute-forcing.',
      points: [
        'Port sweep and scan detection',
        'SYN flood & volumetric DoS alerts',
        'R2L authentication probing recognition'
      ]
    },
    {
      icon: Layers,
      title: 'Local SIEM & Event Correlation',
      badge: 'Multi-Stage',
      badgeColor: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/30',
      description:
        'Aggregates raw security events into correlated attack chains and incidents, mapping multi-stage adversary progression across MITRE ATT&CK stages.',
      points: [
        'Correlation of network & host signals',
        'Automated incident grouping',
        'SQLite WAL event repository'
      ]
    },
    {
      icon: Search,
      title: 'Explainable Alert Investigation',
      badge: 'Triage Ready',
      badgeColor: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30',
      description:
        'Provides transparent, human-readable forensic explanations for every generated alert, highlighting exact triggering metrics, thresholds, and confidence values.',
      points: [
        'Feature contribution breakdowns',
        'Step-by-step forensic narratives',
        'Triaging state machine (Open/Ack/Resolved)'
      ]
    },
    {
      icon: FileText,
      title: 'Security Auditing & Reporting',
      badge: 'Compliance',
      badgeColor: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/30',
      description:
        'Generates comprehensive operational summaries, protocol distributions, and threat matrices suitable for SOC handoffs, compliance records, and management reviews.',
      points: [
        'Executive threat summaries',
        'Incident severity breakdowns',
        'Exportable audit records'
      ]
    },
    {
      icon: Server,
      title: 'Multi-Endpoint Telemetry Support',
      badge: 'Agent Daemon',
      badgeColor: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
      description:
        'Extends network visibility with optional lightweight endpoint agents that stream local authentication logs, syslog, and process events directly into the SIEM.',
      points: [
        'Cross-platform Python/C collector',
        'Secure local REST API ingestion',
        'Heartbeat & device health monitoring'
      ]
    },
    {
      icon: Lock,
      title: 'Zero Cloud Data Exfiltration',
      badge: 'Local-First',
      badgeColor: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30',
      description:
        'Designed from the ground up to protect user privacy. Raw packet payloads and security logs remain 100% confined to your local desktop and local storage.',
      points: [
        'No external telemetry harvesting',
        'Runs completely offline on LANs',
        'Zero cloud dependency for detection'
      ]
    }
  ];

  return (
    <section className="py-20 bg-[#070b14] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Zap className="w-3.5 h-3.5" />
            <span>Operational Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            ENGINEERED FOR DEEP VISIBILITY &amp; DETERMINISTIC DEFENSE
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Aegis combines real-time raw packet analysis with an integrated host telemetry SIEM to deliver comprehensive network security without unnecessary complexity.
          </p>
        </div>

        {/* Features 3x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="bg-[#0b1220] border border-[#1e293b] hover:border-[#00d4ff]/40 rounded-2xl p-6 space-y-4 transition-all duration-200 hover:shadow-[0_0_25px_rgba(0,212,255,0.08)] flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#131d33] border border-[#1e3a5f] flex items-center justify-center text-[#00d4ff] group-hover:scale-105 transition-transform">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase border ${feat.badgeColor}`}
                  >
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white tracking-tight font-mono">
                  {feat.title}
                </h3>

                <p className="text-xs text-[#94a3b8] leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1e293b]/60 space-y-2">
                {feat.points.map((pt, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2 text-[11px] text-[#cbd5e1]">
                    <CheckCircle2 className="w-3 h-3 text-[#00ff88] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
