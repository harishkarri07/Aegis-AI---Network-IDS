'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Shield,
  Download,
  Activity,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Terminal,
  Cpu,
  Layers,
  FileText,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface WebsiteNavProps {
  onLaunchIDS?: () => void;
}

export function WebsiteNav({ onLaunchIDS }: WebsiteNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/technology', label: 'Technology' },
    { href: '/network-ids', label: 'Network IDS' },
    { href: '/documentation', label: 'Documentation' },
    { href: '/downloads', label: 'Downloads' },
    { href: '/about', label: 'About & Trust' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-[#1e293b]">
      {/* Top Security Banner */}
      <div className="bg-[#0b1329] border-b border-[#1e293b]/60 px-4 py-1.5 text-center text-[11px] font-medium text-[#94a3b8] flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1 text-[#00ff88] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          Aegis AI v1.0.0 Architecture
        </span>
        <span className="hidden sm:inline text-[#475569]">•</span>
        <span className="hidden sm:inline text-[#cbd5e1]">
          Deterministic 5-Tuple Network Packet Analysis &amp; Host SIEM Telemetry
        </span>
        <span className="text-[#475569]">•</span>
        <Link
          href="/downloads"
          className="text-[#00d4ff] hover:underline font-bold inline-flex items-center gap-0.5"
        >
          Download Desktop App <ChevronRight className="w-3 h-3 inline" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff] group-hover:border-[#00d4ff] group-hover:bg-[#00d4ff]/20 transition-all shadow-[0_0_15px_rgba(0,212,255,0.15)]">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-white uppercase font-mono">
                  AEGIS<span className="text-[#00d4ff]">.AI</span>
                </span>
                <span className="px-1.5 py-0.2 bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-[9px] font-bold rounded uppercase">
                  NIDS
                </span>
              </div>
              <span className="text-[10px] text-[#64748b] font-medium tracking-wide uppercase">
                Cyber-Defense Systems
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#131b2e]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {onLaunchIDS ? (
              <button
                onClick={onLaunchIDS}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-white border border-[#1e293b] rounded-lg text-xs font-bold transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Launch Operational IDS</span>
              </button>
            ) : (
              <Link
                href="/app"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131b2e] hover:bg-[#1e293b] text-[#cbd5e1] hover:text-white border border-[#1e293b] rounded-lg text-xs font-bold transition-all"
              >
                <Activity className="w-3.5 h-3.5 text-[#00ff88]" />
                <span>Explore Live Console</span>
              </Link>
            )}

            <Link
              href="/downloads"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-bold rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(0,212,255,0.25)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Aegis</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/downloads"
              className="flex items-center gap-1 px-3 py-1.5 bg-[#00d4ff] text-[#070b14] rounded-md text-xs font-bold"
            >
              <Download className="w-3 h-3" />
              <span>Get Aegis</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#94a3b8] hover:text-white hover:bg-[#131b2e] rounded-lg border border-[#1e293b]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070b14] border-b border-[#1e293b] px-4 pt-3 pb-6 space-y-2">
          <div className="grid grid-cols-2 gap-1 pb-3 border-b border-[#1e293b]">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold ${
                    active
                      ? 'text-[#00d4ff] bg-[#00d4ff]/10 font-bold'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#131b2e]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#131b2e] text-[#cbd5e1] border border-[#1e293b] rounded-lg text-xs font-bold"
            >
              <Activity className="w-4 h-4 text-[#00ff88]" />
              <span>Launch Operational IDS</span>
            </Link>

            <Link
              href="/downloads"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00d4ff] text-[#070b14] rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(0,212,255,0.2)]"
            >
              <Download className="w-4 h-4" />
              <span>Download Desktop Application</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
