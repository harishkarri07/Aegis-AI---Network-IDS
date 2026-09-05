'use client';

import React from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { NetworkIdsExplainer } from '@/components/website/NetworkIdsExplainer';
import { DetectionMatrix } from '@/components/website/DetectionMatrix';
import { Shield } from 'lucide-react';

export default function NetworkIdsPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col">
      <WebsiteNav />

      {/* Page Header */}
      <section className="pt-16 pb-12 bg-[#090e1a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>NIDS Deep Dive</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-mono tracking-tight">
            WHAT IS A NETWORK IDS?
          </h1>
          <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Understanding passive packet capture, link-layer promiscuous monitoring, and how network-level detection complements endpoint security.
          </p>
        </div>
      </section>

      <NetworkIdsExplainer />
      <DetectionMatrix />

      <WebsiteFooter />
    </div>
  );
}
