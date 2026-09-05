'use client';

import React from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { TrustSecuritySection } from '@/components/website/TrustSecuritySection';
import { FaqSection } from '@/components/website/FaqSection';
import { Shield, Lock, Eye, CheckCircle2, Code2, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col">
      <WebsiteNav />

      {/* Page Header */}
      <section className="pt-16 pb-12 bg-[#090e1a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Mission &amp; Philosophy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-mono tracking-tight">
            ABOUT AEGIS AI CYBER-DEFENSE
          </h1>
          <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Building open, transparent, and high-performance network security tools for modern cyber defenders, engineers, and researchers.
          </p>
        </div>
      </section>

      {/* Main Mission Section */}
      <section className="py-16 bg-[#070b14] border-b border-[#1e293b]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-xs sm:text-sm leading-relaxed text-[#cbd5e1]">
          <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white font-mono uppercase">
              Our Vision: Real Network Visibility Without Cloud Bloat
            </h2>
            <p>
              Traditional network monitoring solutions often suffer from two extremes: either they are cumbersome enterprise suites requiring dedicated server farms and cloud data forwarding, or basic command-line packet dumps that are hard to interpret in real time.
            </p>
            <p>
              Aegis AI was designed to deliver the best of both worlds: a lightweight, responsive desktop application with native promiscuous link-layer capture, sub-millisecond 5-tuple flow aggregation, and an integrated host SIEM that runs entirely on your local workstation with zero telemetry exfiltration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />
                <span>Deterministic Rigor</span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                We reject opaque AI black boxes that produce unexplainable security alerts. Every threat detection rule in Aegis is deterministic, auditable, and grounded in concrete TCP/IP RFC specifications.
              </p>
            </div>

            <div className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-sm uppercase">
                <Lock className="w-4 h-4 text-[#00ff88]" />
                <span>Uncompromising Privacy</span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Your network packets contain sensitive organizational traffic. Aegis never sends raw payloads or internal IP telemetry to remote servers. Everything is processed and stored locally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Principles */}
      <TrustSecuritySection />

      {/* FAQs */}
      <FaqSection />

      <WebsiteFooter />
    </div>
  );
}
