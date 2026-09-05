'use client';

import React from 'react';
import {
  Lock,
  ShieldCheck,
  EyeOff,
  Server,
  FileCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function TrustSecuritySection() {
  const principles = [
    {
      icon: EyeOff,
      title: 'No Payload Harvesting',
      description:
        'Aegis focuses on network layer metadata (5-tuples, packet rates, TCP flags, header lengths). We do not record or harvest application passwords, private encryption keys, session cookies, or personal documents.'
    },
    {
      icon: Lock,
      title: 'Local-First Execution',
      description:
        'All packet decoding, flow tracking, rule evaluation, and SIEM correlation occur strictly inside local RAM and local SQLite storage on your machine. No raw traffic or logs are uploaded to any cloud backend.'
    },
    {
      icon: Server,
      title: 'Explicit Endpoint Telemetry Consent',
      description:
        'Endpoint monitoring is entirely opt-in. The host collection agent requires explicit administrator privileges and user installation before streaming local auth/syslog telemetry to the SIEM.'
    },
    {
      icon: FileCheck,
      title: 'Deterministic & Auditable Rules',
      description:
        'Detection rules and heuristic thresholds are open and transparent. Analysts can inspect every condition, eliminating unexplainable black-box decisions or model hallucinations.'
    }
  ];

  return (
    <section className="py-20 bg-[#090e1a] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-bold font-mono uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy &amp; Security Principles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            BUILT ON LOCAL-FIRST TRUST &amp; TRANSPARENCY
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Network packet analysis requires high trust. Here is our straightforward pledge regarding your network privacy, data residency, and capture boundaries.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {principles.map((p, idx) => (
            <div
              key={idx}
              className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white font-mono">{p.title}</h3>
              </div>
              <p className="text-xs text-[#94a3b8] leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Technical Capture Bounds Box */}
        <div className="mt-8 p-5 bg-[#0d1424] border border-[#1e3a5f] rounded-2xl flex items-start gap-4 text-xs text-[#cbd5e1]">
          <AlertCircle className="w-5 h-5 text-[#00d4ff] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white font-mono uppercase block">
              Capture Scope &amp; Operating System Privileges
            </span>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Packet capture visibility is strictly bounded by the network adapter chosen and the host OS security model. On Windows, Npcap requires administrative privileges to bind to NDIS drivers. On Linux/macOS, raw socket access requires root or `CAP_NET_RAW` capability. In standard web browser mode, network sandboxing safely disables promiscuous packet capture.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
