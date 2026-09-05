'use client';

import React from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { TechnologyStack } from '@/components/website/TechnologyStack';
import { TrustSecuritySection } from '@/components/website/TrustSecuritySection';
import { Code2 } from 'lucide-react';

export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col">
      <WebsiteNav />

      {/* Page Header */}
      <section className="pt-16 pb-12 bg-[#090e1a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Code2 className="w-3.5 h-3.5" />
            <span>Engineering Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-mono tracking-tight">
            AEGIS TECHNOLOGY STACK
          </h1>
          <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto leading-relaxed">
            Detailed specifications of our low-level C++ packet capture bindings, TypeScript stateful flow tracker, SQLite WAL storage, and Electron desktop runtime.
          </p>
        </div>
      </section>

      <TechnologyStack />
      <TrustSecuritySection />

      <WebsiteFooter />
    </div>
  );
}
