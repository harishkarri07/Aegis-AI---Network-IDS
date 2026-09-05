'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Activity,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Radio,
  Server,
  AlertTriangle
} from 'lucide-react';

interface HeroSectionProps {
  onLaunchIDS?: () => void;
}

export function HeroSection({ onLaunchIDS }: HeroSectionProps) {
  // Interactive mock packet stream for visual technical showcase
  const [packetTick, setPacketTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPacketTick((prev) => (prev + 1) % 1000);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  const mockStream = [
    {
      time: '+0.00ms',
      src: '192.168.1.104:52341',
      dst: '10.0.0.1:443',
      proto: 'TCP',
      flags: 'ACK',
      rate: '184 pps',
      state: 'ESTABLISHED',
      threat: 'NORMAL',
      color: 'text-[#00ff88]'
    },
    {
      time: '+1.20ms',
      src: '172.16.4.88:49152',
      dst: '10.0.0.1:80',
      proto: 'TCP',
      flags: 'SYN',
      rate: '1.4k pps',
      state: 'BURST_DETECTED',
      threat: 'DoS SYN_FLOOD',
      color: 'text-[#ff3366]'
    },
    {
      time: '+2.80ms',
      src: '192.168.1.205:58210',
      dst: '10.0.0.1:22',
      proto: 'TCP',
      flags: 'SYN_RST',
      rate: '34 pps',
      state: 'PROBE_SCAN',
      threat: 'R2L_BRUTEFORCE',
      color: 'text-[#ffaa00]'
    },
    {
      time: '+4.10ms',
      src: '10.0.0.45:41992',
      dst: '8.8.8.8:53',
      proto: 'UDP',
      flags: '---',
      rate: '12 pps',
      state: 'DNS_RESOLVE',
      threat: 'NORMAL',
      color: 'text-[#00ff88]'
    }
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-[#1e293b]">
      {/* Subtle Background Circuit Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a5f_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00d4ff]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-mono font-bold tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              <span>NATIVE PACKET CAPTURE &amp; HOST SIEM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1] font-mono">
              AEGIS AI <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#38bdf8] to-[#00ff88]">
                NETWORK INTRUSION DETECTION
              </span>{' '}
              <br />
              <span className="text-2xl sm:text-3xl lg:text-4xl text-[#94a3b8] font-bold">
                FOR THE MODERN NETWORK
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#cbd5e1] leading-relaxed max-w-2xl">
              Real-time network visibility, intelligent deterministic detection, and security monitoring from a lightweight desktop platform. Engineered with native Npcap packet capture, 5-tuple stateful flow tracking, and local SIEM correlation.
            </p>

            {/* Value Pillars List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-[#94a3b8]">
                <div className="w-5 h-5 rounded bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-white font-medium">Promiscuous PCAP via Npcap / libpcap</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#94a3b8]">
                <div className="w-5 h-5 rounded bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-white font-medium">Deterministic Sliding-Window Rules</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#94a3b8]">
                <div className="w-5 h-5 rounded bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-white font-medium">Zero Cloud Packet Exfiltration</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#94a3b8]">
                <div className="w-5 h-5 rounded bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-white font-medium">Integrated Host SIEM &amp; Telemetry</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/downloads"
                className="px-8 py-3.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-black rounded-xl text-sm transition-all shadow-[0_0_30px_rgba(0,212,255,0.3)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] flex items-center justify-center gap-2.5 tracking-wide uppercase font-mono"
              >
                <Download className="w-4 h-4" />
                <span>Download Aegis</span>
              </Link>

              {onLaunchIDS ? (
                <button
                  onClick={onLaunchIDS}
                  className="px-6 py-3.5 bg-[#131b2e] hover:bg-[#1e293b] text-white border border-[#1e3a5f] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 text-[#00ff88]" />
                  <span>Launch Operational IDS</span>
                </button>
              ) : (
                <Link
                  href="/app"
                  className="px-6 py-3.5 bg-[#131b2e] hover:bg-[#1e293b] text-white border border-[#1e3a5f] rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4 text-[#00ff88]" />
                  <span>Explore Live Console</span>
                </Link>
              )}
            </div>

            {/* Quick spec footer */}
            <div className="pt-2 flex items-center gap-6 text-[11px] text-[#64748b] font-mono">
              <span>Platforms: Windows 10/11 x64, macOS, Linux</span>
              <span>•</span>
              <span>License: Open Architecture</span>
            </div>
          </div>

          {/* Right Column: Live Telemetry Pipeline Display */}
          <div className="lg:col-span-5">
            <div className="bg-[#090e1a] border border-[#1e3a5f] rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    AEGIS PCAP DISSECTOR
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#00d4ff] bg-[#00d4ff]/10 px-2 py-0.5 rounded border border-[#00d4ff]/20">
                  <span>DRIVER: NPCAP_X64</span>
                </div>
              </div>

              {/* Real-Time Metrics Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d1424] p-2.5 rounded-lg border border-[#1e293b] text-center">
                  <span className="block text-[9px] text-[#64748b] font-mono uppercase">Flow Windows</span>
                  <span className="text-sm font-bold text-white font-mono">1,420 / 10s</span>
                </div>
                <div className="bg-[#0d1424] p-2.5 rounded-lg border border-[#1e293b] text-center">
                  <span className="block text-[9px] text-[#64748b] font-mono uppercase">Dissect Latency</span>
                  <span className="text-sm font-bold text-[#00ff88] font-mono">&lt; 0.42 ms</span>
                </div>
                <div className="bg-[#0d1424] p-2.5 rounded-lg border border-[#1e293b] text-center">
                  <span className="block text-[9px] text-[#64748b] font-mono uppercase">Threat Heuristics</span>
                  <span className="text-sm font-bold text-[#00d4ff] font-mono">5 Stateful</span>
                </div>
              </div>

              {/* Live Flow Stream Table */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-[10px] text-[#64748b] uppercase tracking-wider flex justify-between px-1">
                  <span>Packet 5-Tuple</span>
                  <span>Rate / Classifier</span>
                </div>

                {mockStream.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#0c1220] border border-[#1e293b] rounded-lg flex items-center justify-between text-[11px] transition-all hover:border-[#00d4ff]/40"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <span className="text-[#00d4ff]">{item.proto}</span>
                        <span>{item.src}</span>
                        <ArrowRight className="w-3 h-3 text-[#64748b]" />
                        <span>{item.dst}</span>
                      </div>
                      <div className="text-[10px] text-[#64748b]">
                        Flags: <span className="text-[#94a3b8]">{item.flags}</span> • State: {item.state}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className={`text-[10px] font-bold block ${item.color}`}>
                        {item.threat}
                      </span>
                      <span className="text-[10px] text-[#64748b]">{item.rate}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert Summary Box */}
              <div className="p-3 bg-[#111c33] border border-[#1e3a5f] rounded-xl flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-[#ff3366]/20 text-[#ff3366] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase font-mono">RULE_SYN_FLOOD_TRIGGERED</span>
                    <span className="text-[10px] text-[#ff3366] font-bold font-mono">HIGH SEV (89.2%)</span>
                  </div>
                  <p className="text-[11px] text-[#94a3b8] leading-tight">
                    Volumetric TCP SYN burst detected from 172.16.4.88:49152 with zero ACK completion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
