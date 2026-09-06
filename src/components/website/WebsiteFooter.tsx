'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Download,
  Activity,
  Github,
  Terminal,
  FileText,
  Lock,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export function WebsiteFooter() {
  return (
    <footer className="bg-[#050810] border-t border-[#1e293b] text-[#94a3b8] text-xs">
      {/* Top CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#1e293b]/60">
        <div className="bg-gradient-to-r from-[#0d1527] to-[#091122] border border-[#1e3a5f] rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
              <Shield className="w-3.5 h-3.5" />
              <span>Native Security Architecture</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
              Protect Your Local Network Wire With Aegis AI
            </h3>
            <p className="text-sm text-[#cbd5e1] leading-relaxed">
              Experience deterministic stateful 5-tuple flow analysis, sub-millisecond threat heuristics, and local-first SIEM telemetry with zero cloud data harvesting.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0">
            <Link
              href="/downloads"
              className="w-full sm:w-auto px-6 py-3 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-bold rounded-xl text-xs sm:text-sm text-center transition-all shadow-[0_0_25px_rgba(0,212,255,0.25)] flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Desktop App</span>
            </Link>
            <Link
              href="/app"
              className="w-full sm:w-auto px-5 py-3 bg-[#131b2e] hover:bg-[#1e293b] text-white border border-[#1e293b] rounded-xl text-xs sm:text-sm font-semibold text-center transition-all flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4 text-[#00ff88]" />
              <span>Launch Live IDS Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand & Security Pledge */}
        <div className="col-span-2 space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-base font-black text-white tracking-tight font-mono uppercase">
              AEGIS<span className="text-[#00d4ff]">.AI</span>
            </span>
          </Link>
          <p className="text-xs text-[#64748b] leading-relaxed max-w-sm">
            Aegis is an open, high-performance Network Intrusion Detection System &amp; Host Telemetry SIEM engineered for cybersecurity practitioners, security operations centers, and modern network defenders.
          </p>

          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#cbd5e1]">
              <Lock className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
              <span>Local-first architecture — zero raw packet telemetry exfiltration</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#cbd5e1]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff88] shrink-0" />
              <span>Deterministic detection logic — no black-box hallucinations</span>
            </div>
          </div>
        </div>

        {/* Product Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Product
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/features" className="hover:text-[#00d4ff] transition-colors">
                Core Features
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-[#00d4ff] transition-colors">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="/technology" className="hover:text-[#00d4ff] transition-colors">
                Technology Stack
              </Link>
            </li>
            <li>
              <Link href="/network-ids" className="hover:text-[#00d4ff] transition-colors">
                Network IDS Deep Dive
              </Link>
            </li>
            <li>
              <Link href="/downloads" className="hover:text-[#00d4ff] transition-colors font-bold text-[#00d4ff]">
                Downloads &amp; Releases
              </Link>
            </li>
          </ul>
        </div>

        {/* Technical Documentation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Documentation
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/documentation#quickstart" className="hover:text-[#00d4ff] transition-colors">
                Quick Start Guide
              </Link>
            </li>
            <li>
              <Link href="/documentation#npcap" className="hover:text-[#00d4ff] transition-colors">
                Windows Npcap Guide
              </Link>
            </li>
            <li>
              <Link href="/documentation#heuristics" className="hover:text-[#00d4ff] transition-colors">
                Detection Heuristics
              </Link>
            </li>
            <li>
              <Link href="/documentation#siem" className="hover:text-[#00d4ff] transition-colors">
                SIEM &amp; Host Agents
              </Link>
            </li>
            <li>
              <Link href="/documentation#troubleshooting" className="hover:text-[#00d4ff] transition-colors">
                Troubleshooting
              </Link>
            </li>
          </ul>
        </div>

        {/* Developers & Community */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Developers
          </h4>
          <ul className="space-y-2">
            <li>
              <Link href="/about" className="hover:text-[#00d4ff] transition-colors">
                About &amp; Security Pledge
              </Link>
            </li>
            <li>
              <Link href="/app" className="hover:text-[#00d4ff] transition-colors flex items-center gap-1">
                <span>Operational IDS</span>
                <Activity className="w-3 h-3 text-[#00ff88]" />
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/harishkarri07/Aegis-AI---Network-IDS"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5 text-[#94a3b8]" />
                <span>Source Code (GitHub)</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </li>
            <li>
              <a
                href="https://npcap.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Npcap Driver (npcap.com)</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-[#1e293b]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748b]">
        <div className="flex items-center gap-2">
          <span>© 2026 Aegis Cyber-Defense Systems. Built for modern network defense.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span>Architecture v1.0.0 Stable</span>
          </span>
          <span className="text-[#334155]">•</span>
          <span>Windows Npcap x64 &amp; Unix libpcap</span>
        </div>
      </div>
    </footer>
  );
}
