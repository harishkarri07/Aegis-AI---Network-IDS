'use client';

import React from 'react';
import {
  Cpu,
  Layers,
  Terminal,
  Database,
  Server,
  Activity,
  Code2,
  CheckCircle2,
  Lock,
  Box,
  Monitor
} from 'lucide-react';

export function TechnologyStack() {
  const stack = [
    {
      layer: 'Desktop Application Layer',
      icon: Monitor,
      technologies: [
        {
          name: 'Electron 43',
          role: 'Cross-Platform Desktop Runtime',
          details: 'Context-isolated IPC bridge between Node.js kernel bindings and secure Next.js renderer.'
        },
        {
          name: 'Next.js 14 & React 18',
          role: 'Modern Reactive UI Engine',
          details: 'Fast, responsive interface with Tailwind CSS utility classes and Lucide cybersecurity iconography.'
        },
        {
          name: 'TypeScript',
          role: 'Strict Type-Safe Codebase',
          details: 'Zero runtime type errors across all packet decoders, 5-tuple structures, and SIEM schemas.'
        }
      ]
    },
    {
      layer: 'Packet Capture & Kernel Layer',
      icon: Cpu,
      technologies: [
        {
          name: 'Npcap (Windows x64)',
          role: 'Kernel-Mode Packet Filter Driver',
          details: 'Promiscuous mode NDIS 6 filter driver for Windows 10/11 network adapter capture and loopback.'
        },
        {
          name: 'libpcap (Linux / macOS)',
          role: 'Standard POSIX Packet Capture',
          details: 'Direct raw socket binding to Linux AF_PACKET and macOS BPF devices.'
        },
        {
          name: 'node-cap (Native C++ Addon)',
          role: 'Low-Overhead Node Binding',
          details: 'Direct binary bindings interfacing libpcap/Npcap buffers directly to TypeScript user space.'
        }
      ]
    },
    {
      layer: 'Stateful Detection & Analysis Core',
      icon: Activity,
      technologies: [
        {
          name: '5-Tuple LRU Flow Tracker',
          role: 'Sliding Temporal Windows',
          details: 'Memory-bounded hash table tracking bidirectional connections across 10-second active windows.'
        },
        {
          name: 'Deterministic Heuristics Engine',
          role: 'Sub-Millisecond Classifier',
          details: 'Evaluates SYN rates, port diversity, reset ratios, and byte velocities without cloud dependencies.'
        },
        {
          name: 'Explainable Anomaly Scorer',
          role: 'Statistical Vector Analysis',
          details: 'Calculates anomaly scores (0-100%) with transparent feature-importance breakdowns for SOC triage.'
        }
      ]
    },
    {
      layer: 'Host SIEM & Telemetry Storage',
      icon: Database,
      technologies: [
        {
          name: 'SQLite 3 (WAL Mode)',
          role: 'Embedded High-Concurrency DB',
          details: 'Zero-configuration ACID storage for audit events, alerts, incident chains, and device records.'
        },
        {
          name: 'Python 3.10 & FastAPI SIEM',
          role: 'Endpoint Telemetry Aggregator',
          details: 'Fast RESTful ingestion daemon correlating endpoint logs with network-layer intrusion signals.'
        },
        {
          name: 'Endpoint Agent Daemon',
          role: 'Host Log Collector',
          details: 'Lightweight cross-platform daemon streaming auth.log, syslog, and process executions to SIEM.'
        }
      ]
    }
  ];

  return (
    <section className="py-20 bg-[#090e1a] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Code2 className="w-3.5 h-3.5" />
            <span>Honest Technical Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            BUILT ON PROVEN, HIGH-PERFORMANCE CYBERSECURITY TOOLS
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Every component in the Aegis architecture is chosen for raw speed, deterministic reliability, and strict privacy. No bloated runtimes or unnecessary cloud middleware.
          </p>
        </div>

        {/* Stack Layers */}
        <div className="space-y-8">
          {stack.map((layer, idx) => (
            <div
              key={idx}
              className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <layer.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wide">
                  {layer.layer}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {layer.technologies.map((tech, tIdx) => (
                  <div
                    key={tIdx}
                    className="bg-[#070b14] border border-[#1e293b] rounded-xl p-5 space-y-2 hover:border-[#00d4ff]/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white font-mono">{tech.name}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-[#131d33] text-[#00d4ff] font-mono border border-[#00d4ff]/20">
                        {tech.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] leading-relaxed font-sans">
                      {tech.details}
                    </p>
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
