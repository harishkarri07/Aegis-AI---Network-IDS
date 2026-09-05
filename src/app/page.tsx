'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import { HeroSection } from '@/components/website/HeroSection';
import { ArchitecturePipeline } from '@/components/website/ArchitecturePipeline';
import { FeaturesGrid } from '@/components/website/FeaturesGrid';
import { DetectionMatrix } from '@/components/website/DetectionMatrix';
import { TechnologyStack } from '@/components/website/TechnologyStack';
import { NetworkIdsExplainer } from '@/components/website/NetworkIdsExplainer';
import { TrustSecuritySection } from '@/components/website/TrustSecuritySection';
import { FaqSection } from '@/components/website/FaqSection';
import { DownloadsCenter } from '@/components/website/DownloadsCenter';
import AegisDesktopApp from '@/components/AegisDesktopApp';
import {
  Shield,
  Activity,
  ArrowRight,
  Download,
  Terminal,
  Cpu,
  Layers,
  X,
  Play,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function HomePage() {
  const [inAppView, setInAppView] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).aegisApi) {
      setIsElectron(true);
      // In native Electron environment, if query param or default wants dashboard:
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'ids') {
        setInAppView(true);
      }
    }
  }, []);

  if (inAppView) {
    return (
      <div className="relative min-h-screen bg-[#070b14]">
        {/* Top return bar */}
        <div className="bg-[#0b1329] border-b border-[#1e293b] px-4 py-2 flex items-center justify-between z-50 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase">
              Operational Aegis IDS Console Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/downloads"
              className="text-[11px] font-mono text-[#00d4ff] hover:underline font-bold"
            >
              Get Desktop Installer
            </Link>
            <button
              onClick={() => setInAppView(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] border border-[#1e293b] rounded-md text-xs font-mono font-bold transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
          </div>
        </div>
        <AegisDesktopApp />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col selection:bg-[#00d4ff]/20 selection:text-[#00d4ff]">
      {/* Top Navigation */}
      <WebsiteNav onLaunchIDS={() => setInAppView(true)} />

      {/* Hero Section */}
      <HeroSection onLaunchIDS={() => setInAppView(true)} />

      {/* Interactive Showcase Banner */}
      <section className="bg-[#0b1220] border-b border-[#1e293b] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#080d19] border border-[#1e3a5f] rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00ff88]">
                <Activity className="w-4 h-4" />
                <span>INTERACTIVE LIVE IDS CONSOLE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-mono tracking-tight">
                Experience The Aegis Security Console In Action
              </h3>
              <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
                Test drive the 5-tuple packet stream analyzer, review real-time MITRE ATT&amp;CK incident chains, and inspect explainable alert forensics right now.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => setInAppView(true)}
                className="w-full sm:w-auto px-6 py-3 bg-[#00ff88] hover:bg-[#34d399] text-[#070b14] font-black font-mono rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,136,0.25)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open Live Console</span>
              </button>
              <Link
                href="/downloads"
                className="w-full sm:w-auto px-5 py-3 bg-[#131b2e] hover:bg-[#1e293b] text-white border border-[#1e293b] rounded-xl text-xs font-mono font-bold text-center transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5 text-[#00d4ff]" />
                <span>Get Desktop App</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <FeaturesGrid />

      {/* Architecture & Pipeline Deep Dive */}
      <ArchitecturePipeline />

      {/* Detection Matrix */}
      <DetectionMatrix />

      {/* Network IDS Fundamentals */}
      <NetworkIdsExplainer />

      {/* Technology Stack */}
      <TechnologyStack />

      {/* Privacy & Trust Principles */}
      <TrustSecuritySection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Downloads Section */}
      <DownloadsCenter />

      {/* Footer */}
      <WebsiteFooter />
    </div>
  );
}
