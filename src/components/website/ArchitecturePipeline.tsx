'use client';

import React, { useState } from 'react';
import {
  Radio,
  Cpu,
  Layers,
  Brain,
  ShieldCheck,
  Server,
  Activity,
  Terminal,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Search
} from 'lucide-react';

export function ArchitecturePipeline() {
  const [selectedStage, setSelectedStage] = useState(0);

  const stages = [
    {
      id: 'wire',
      number: '01',
      title: 'Physical Network Wire',
      subtitle: 'NIC Promiscuous Ingestion',
      icon: Radio,
      badge: 'Physical / Virtual',
      description:
        'Raw Ethernet electrical and optical signals arrive at the Network Interface Card (Wi-Fi, Ethernet, or Virtual Adapter).',
      technicalDetails: {
        input: 'Physical 802.3 Ethernet or 802.11 Wi-Fi frames',
        processing: 'Hardware transceiver demultiplexes packets into kernel ring buffer',
        output: 'Raw byte buffers passed to OS kernel packet filter'
      }
    },
    {
      id: 'driver',
      number: '02',
      title: 'Npcap / libpcap Kernel Driver',
      subtitle: 'Low-Level Packet Filter Driver',
      icon: Cpu,
      badge: 'Kernel Mode',
      description:
        'The kernel-level capture driver intercepts link-layer frames and delivers them into user-space via native C/C++ bindings.',
      technicalDetails: {
        input: 'Kernel network buffer pointer & capture filter (e.g. "ip")',
        processing: 'Promiscuous mode packet filtering via BPF engine',
        output: 'Raw binary frame chunk via native C++ Cap handle'
      }
    },
    {
      id: 'decoder',
      number: '03',
      title: 'Packet Decoder & Header Parser',
      subtitle: 'Layer-2/3/4 Dissection',
      icon: Terminal,
      badge: 'Sub-Millisecond',
      description:
        'Parses Ethernet preamble, IPv4 header flags, TTL, protocol numbers, and TCP/UDP port headers into strongly-typed data structures.',
      technicalDetails: {
        input: 'Raw byte buffer array',
        processing: 'Bitmask extraction: Ethernet (14B) + IPv4 (20B) + TCP/UDP (20B/8B)',
        output: 'Structured Packet object with 5-tuple identifiers'
      }
    },
    {
      id: 'flow',
      number: '04',
      title: '5-Tuple Stateful Flow Tracker',
      subtitle: 'Sliding Temporal Windows',
      icon: Layers,
      badge: 'Stateful Memory',
      description:
        'Aggregates packets into bidirectional flow records indexed by (Src IP, Dst IP, Src Port, Dst Port, Protocol) over a 10s sliding window.',
      technicalDetails: {
        input: 'Continuous stream of decoded Packet objects',
        processing: 'Calculates SYN/ACK ratios, packet counts, byte rates, port entropy',
        output: 'Stateful FlowRecord with temporal statistical metadata'
      }
    },
    {
      id: 'detection',
      number: '05',
      title: 'Deterministic Detection Engine',
      subtitle: 'Threat Heuristic Evaluation',
      icon: Brain,
      badge: 'Zero Hallucination',
      description:
        'Executes rule-based heuristics against active flows to detect DoS floods, port scans, host sweeps, and authentication brute-forcing.',
      technicalDetails: {
        input: 'Decoded packet & active flow state summary',
        processing: 'Evaluates thresholds: SYN burst rates, port diversity, reset ratios',
        output: 'Deterministic attack classification (NORMAL, DoS, Probe, R2L, U2R)'
      }
    },
    {
      id: 'risk',
      number: '06',
      title: 'Explainable Risk Scoring',
      subtitle: 'Forensic Factor Weighting',
      icon: Search,
      badge: 'Forensic Analysis',
      description:
        'Computes a transparent confidence score (0-100%) based on volumetric rates, TCP flag anomalies, and historical flow deviations.',
      technicalDetails: {
        input: 'Triggered rule conditions and metric deviations',
        processing: 'Composite weighted scoring of packet velocity and anomalous flags',
        output: 'Explainable narrative vector with key contributing factors'
      }
    },
    {
      id: 'siem',
      number: '07',
      title: 'Local SIEM & Event Correlation',
      subtitle: 'Multi-Stage Attack Chains',
      icon: Database,
      badge: 'SQLite WAL DB',
      description:
        'Correlates network alerts with endpoint telemetry logs into consolidated incident attack chains stored in a persistent SQLite database.',
      technicalDetails: {
        input: 'Network alerts & host agent telemetry events',
        processing: 'MITRE ATT&CK stage mapping and multi-event clustering',
        output: 'CorrelatedIncident record ready for SOC investigation'
      }
    },
    {
      id: 'dashboard',
      number: '08',
      title: 'Aegis Desktop Dashboard',
      subtitle: 'Real-Time SOC Command Console',
      icon: Activity,
      badge: 'Electron UI',
      description:
        'Displays real-time live traffic gauges, interactive analytics, alert investigation workflows, and compliance reports.',
      technicalDetails: {
        input: 'Electron IPC event stream & local REST SIEM endpoints',
        processing: 'Next.js/React rendering with optimized sliding buffer history',
        output: 'Unified security operations console for active defenders'
      }
    }
  ];

  return (
    <section className="py-20 bg-[#090e1a] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Cpu className="w-3.5 h-3.5" />
            <span>End-to-End Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            HOW AEGIS ANALYZES NETWORK TRAFFIC
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            From physical network wire frames to explainable SOC alerts, see how each layer of the Aegis pipeline transforms raw packets into actionable cyber intelligence.
          </p>
        </div>

        {/* Visual Pipeline Stepper Horizontal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-10">
          {stages.map((st, idx) => {
            const isSelected = selectedStage === idx;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStage(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-[#111c33] border-[#00d4ff] shadow-[0_0_20px_rgba(0,212,255,0.2)]'
                    : 'bg-[#0b1220] border-[#1e293b] hover:border-[#334155] hover:bg-[#0f172a]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      isSelected ? 'text-[#00d4ff]' : 'text-[#64748b]'
                    }`}
                  >
                    {st.number}
                  </span>
                  <st.icon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-[#00d4ff]' : 'text-[#64748b] group-hover:text-white'
                    }`}
                  />
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold font-mono line-clamp-1 ${
                      isSelected ? 'text-white' : 'text-[#cbd5e1]'
                    }`}
                  >
                    {st.title}
                  </h4>
                  <span className="text-[9px] text-[#64748b] font-mono block">
                    {st.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Detail Inspector Card */}
        {stages[selectedStage] && (
          <div className="bg-[#0b1220] border border-[#1e3a5f] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] shrink-0">
                  {React.createElement(stages[selectedStage].icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#00d4ff]">
                      STAGE {stages[selectedStage].number}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#1e293b] text-[#94a3b8] text-[10px] font-mono font-bold uppercase">
                      {stages[selectedStage].badge}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-mono tracking-tight">
                    {stages[selectedStage].title}
                  </h3>
                  <p className="text-xs text-[#94a3b8] font-mono">
                    {stages[selectedStage].subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => setSelectedStage((prev) => (prev > 0 ? prev - 1 : stages.length - 1))}
                  className="px-3 py-1.5 bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b] rounded-lg text-xs font-mono font-bold"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setSelectedStage((prev) => (prev < stages.length - 1 ? prev + 1 : 0))}
                  className="px-3 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 rounded-lg text-xs font-mono font-bold"
                >
                  Next Stage →
                </button>
              </div>
            </div>

            <p className="text-sm text-[#cbd5e1] leading-relaxed">
              {stages[selectedStage].description}
            </p>

            {/* Technical Specifications Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-[#64748b] uppercase tracking-wider block">
                  Stage Input
                </span>
                <p className="text-xs text-white font-mono leading-relaxed">
                  {stages[selectedStage].technicalDetails.input}
                </p>
              </div>

              <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-[#00d4ff] uppercase tracking-wider block">
                  Core Processing Logic
                </span>
                <p className="text-xs text-[#cbd5e1] font-mono leading-relaxed">
                  {stages[selectedStage].technicalDetails.processing}
                </p>
              </div>

              <div className="bg-[#070b14] border border-[#1e293b] rounded-xl p-4 space-y-1.5">
                <span className="text-[10px] font-bold font-mono text-[#00ff88] uppercase tracking-wider block">
                  Stage Output
                </span>
                <p className="text-xs text-white font-mono leading-relaxed">
                  {stages[selectedStage].technicalDetails.output}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
