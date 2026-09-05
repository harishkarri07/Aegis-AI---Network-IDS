'use client';

import React from 'react';
import {
  Shield,
  Activity,
  Cpu,
  Search,
  CheckCircle2,
  HelpCircle,
  Zap,
  ArrowRight,
  Radio,
  FileCode2,
  Lock
} from 'lucide-react';

export function NetworkIdsExplainer() {
  const cards = [
    {
      title: 'What is an IDS?',
      subtitle: 'Intrusion Detection vs. Prevention',
      icon: Shield,
      content:
        'An Intrusion Detection System (IDS) acts as a high-speed passive digital sentinel. Unlike an inline firewall or IPS that drops packets, a passive IDS observes network wire traffic out-of-band without introducing transmission latency, detecting stealthy reconnaissance and lateral attacks that bypass firewalls.'
    },
    {
      title: 'What is a Network IDS (NIDS)?',
      subtitle: 'Network-Level vs. Endpoint Antivirus',
      icon: Activity,
      content:
        'While endpoint antivirus inspects files and processes on a single machine, a Network IDS monitors raw traffic across an entire network segment. It can detect scans against unmanaged devices, IoT hardware, printers, and servers where installing security agents is impossible.'
    },
    {
      title: 'Why Packet Capture Matters',
      subtitle: 'The Ground Truth of Network Defense',
      icon: Radio,
      content:
        'Log files can be tampered with or disabled by attackers with root access. Raw packet captures (PCAP) directly from the network wire cannot be modified post-facto, providing cryptographic ground truth for forensic analysis, timing verification, and tamper-resistant incident response.'
    },
    {
      title: 'What Aegis Monitors',
      subtitle: '5-Tuple Flow Metadata & Temporal Patterns',
      icon: Cpu,
      content:
        'Aegis decodes Ethernet, IPv4, TCP, UDP, and ICMP headers. It indexes 5-tuples (Src IP, Dst IP, Src Port, Dst Port, Protocol), calculates packet velocity, flags SYN/ACK ratios, analyzes destination port entropy, and tracks anomalous byte distributions over sliding 10s windows.'
    },
    {
      title: 'What Aegis Detects',
      subtitle: 'Recognizing Malicious Adversary TTPs',
      icon: Zap,
      content:
        'Aegis detects volumetric Denial-of-Service floods, TCP SYN exhaustion attacks, vertical port scans, horizontal subnet sweeps, SSH/RDP brute-force credential stuffing, and unusual high-frequency privileged port bursts.'
    },
    {
      title: 'How Alerts Are Generated',
      subtitle: 'Deterministic Heuristics & Explainable Scoring',
      icon: Search,
      content:
        'When active flow metrics exceed deterministic thresholds, Aegis fires an alert containing the exact 5-tuple identifier, triggering rule name, calculated anomaly score, and a plain-text forensic explanation of what triggered the rule.'
    }
  ];

  return (
    <section className="py-20 bg-[#070b14] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Cybersecurity Primer</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            UNDERSTANDING NETWORK INTRUSION DETECTION
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Essential concepts for security analysts, network engineers, and students exploring network defense fundamentals.
          </p>
        </div>

        {/* Concept Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c, idx) => (
            <div
              key={idx}
              className="bg-[#0b1220] border border-[#1e293b] hover:border-[#00d4ff]/40 rounded-2xl p-6 space-y-4 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#131d33] border border-[#1e3a5f] flex items-center justify-center text-[#00d4ff]">
                  <c.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{c.title}</h3>
                  <span className="text-[10px] text-[#00d4ff] font-mono block">
                    {c.subtitle}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {c.content}
              </p>
            </div>
          ))}
        </div>

        {/* NIDS vs HIDS Comparison Banner */}
        <div className="mt-12 bg-[#090e1a] border border-[#1e3a5f] rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white uppercase font-mono mb-4 text-center">
            How Aegis Unifies Network IDS &amp; Host SIEM
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00d4ff] font-mono uppercase">
                <Radio className="w-4 h-4" />
                <span>1. Network IDS (Packet Sensor)</span>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Analyzes live network packets, detects port scans, DoS volumetric bursts, and unexpected connection attempts across the physical and virtual wire.
              </p>
            </div>

            <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00ff88] font-mono uppercase">
                <Shield className="w-4 h-4" />
                <span>2. Host SIEM (Telemetry Ingestion)</span>
              </div>
              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                Ingests local host authentication logs, sudo failures, and system events, correlating network alerts with endpoint telemetry into unified incident chains.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
