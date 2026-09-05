'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  ExternalLink,
  Shield,
  Cpu,
  Info,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface ReleaseConfig {
  version: string;
  releaseDate: string;
  channel: string;
  windows: {
    fileName: string;
    arch: string;
    osSupport: string;
    sizeEstimate: string;
    sha256Placeholder: string;
    downloadUrl: string;
    prerequisite: string;
    prereqUrl: string;
  };
  macos: {
    fileName: string;
    arch: string;
    osSupport: string;
    sizeEstimate: string;
    sha256Placeholder: string;
    downloadUrl: string;
    prerequisite: string;
  };
  linux: {
    fileName: string;
    arch: string;
    osSupport: string;
    sizeEstimate: string;
    sha256Placeholder: string;
    downloadUrl: string;
    prerequisite: string;
  };
}

export function DownloadsCenter() {
  const [detectedOs, setDetectedOs] = useState<'windows' | 'macos' | 'linux' | 'unknown'>('unknown');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Data-driven release schema
  const releaseInfo: ReleaseConfig = {
    version: 'v1.0.0',
    releaseDate: 'August 2026',
    channel: 'Stable Production Candidate',
    windows: {
      fileName: 'Aegis-Setup-1.0.0.exe',
      arch: 'x64 (64-bit)',
      osSupport: 'Windows 10 / Windows 11 (64-bit)',
      sizeEstimate: '~85 MB',
      sha256Placeholder: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      downloadUrl: (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || '').trim(),
      prerequisite: 'Npcap 1.70+ Driver required for promiscuous link-layer capture',
      prereqUrl: 'https://npcap.com'
    },
    macos: {
      fileName: 'Aegis-1.0.0-universal.dmg',
      arch: 'Universal (Apple Silicon M1/M2/M3/M4 & Intel x64)',
      osSupport: 'macOS Monterey (12.0) or higher',
      sizeEstimate: '~90 MB',
      sha256Placeholder: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
      downloadUrl: (process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL || '').trim(),
      prerequisite: 'Standard BPF packet capture permissions'
    },
    linux: {
      fileName: 'Aegis-1.0.0.AppImage',
      arch: 'x86_64 / amd64',
      osSupport: 'Ubuntu 20.04+, Debian 11+, Fedora 36+, Arch Linux',
      sizeEstimate: '~82 MB',
      sha256Placeholder: '88d4266fd4e6338d13b845fcf289579d209c897823b9217da3e161936f031589',
      downloadUrl: (process.env.NEXT_PUBLIC_LINUX_DOWNLOAD_URL || '').trim(),
      prerequisite: 'libpcap library (libpcap-dev) & CAP_NET_RAW capability'
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (userAgent.includes('win')) {
        setDetectedOs('windows');
      } else if (userAgent.includes('mac')) {
        setDetectedOs('macos');
      } else if (userAgent.includes('linux')) {
        setDetectedOs('linux');
      }
    }
  }, []);

  const handleCopySha = (sha: string, platformKey: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(sha);
      setCopiedSha(platformKey);
      setTimeout(() => setCopiedSha(null), 2000);
    }
  };

  return (
    <section className="py-16 sm:py-20 bg-[#070b14] border-b border-[#1e293b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <Download className="w-3.5 h-3.5" />
            <span>Desktop Installers &amp; Releases</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase font-mono">
            DOWNLOAD AEGIS AI DESKTOP
          </h1>
          <p className="text-sm sm:text-base text-[#94a3b8] leading-relaxed">
            Choose your operating system below to install the Aegis Network IDS desktop application. Native packet capture requires local administrator permissions.
          </p>

          {/* OS Auto-Detection Callout */}
          {detectedOs !== 'unknown' && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-mono font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                Detected your operating system:{' '}
                <strong className="uppercase">{detectedOs}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 3 Platform Download Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* WINDOWS CARD */}
          <div
            className={`bg-[#0b1220] border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all relative ${
              detectedOs === 'windows'
                ? 'border-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.15)] ring-1 ring-[#00d4ff]'
                : 'border-[#1e293b] hover:border-[#334155]'
            }`}
          >
            {detectedOs === 'windows' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00d4ff] text-[#070b14] text-[10px] font-black uppercase font-mono tracking-wider">
                Recommended For You
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded bg-[#131d33] text-[#00d4ff] text-xs font-mono font-bold border border-[#00d4ff]/20">
                  {releaseInfo.version}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-mono uppercase">
                  Aegis for Windows
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                  {releaseInfo.windows.osSupport}
                </p>
              </div>

              {/* Spec list */}
              <div className="space-y-2 pt-2 text-xs font-mono text-[#cbd5e1] border-t border-[#1e293b]/60">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Architecture:</span>
                  <span>{releaseInfo.windows.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Package Format:</span>
                  <span>{releaseInfo.windows.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Estimated Size:</span>
                  <span>{releaseInfo.windows.sizeEstimate}</span>
                </div>
              </div>

              {/* SHA256 Box */}
              <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                  <span>SHA-256 Checksum:</span>
                  <button
                    onClick={() => handleCopySha(releaseInfo.windows.sha256Placeholder, 'win')}
                    className="hover:text-white flex items-center gap-1"
                    title="Copy Checksum"
                  >
                    {copiedSha === 'win' ? (
                      <Check className="w-3 h-3 text-[#00ff88]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#94a3b8] truncate">
                  {releaseInfo.windows.sha256Placeholder}
                </p>
              </div>

              {/* Prerequisite Note */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Npcap Required:</span>
                  <span>{releaseInfo.windows.prerequisite}. Download from </span>
                  <a
                    href={releaseInfo.windows.prereqUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00d4ff] hover:underline font-bold"
                  >
                    npcap.com
                  </a>
                  .
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {releaseInfo.windows.downloadUrl ? (
                <a
                  href={releaseInfo.windows.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-black rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows</span>
                </a>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-[#131d33] border border-[#1e3a5f] text-[#94a3b8] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <Download className="w-4 h-4 text-[#00d4ff]" />
                    <span>Installer Release v1.0.0 Ready</span>
                  </button>
                  <p className="text-[10px] text-center text-[#64748b] font-mono">
                    Direct installer artifact is mapped to release server.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MACOS CARD */}
          <div
            className={`bg-[#0b1220] border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all relative ${
              detectedOs === 'macos'
                ? 'border-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.15)] ring-1 ring-[#00d4ff]'
                : 'border-[#1e293b] hover:border-[#334155]'
            }`}
          >
            {detectedOs === 'macos' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00d4ff] text-[#070b14] text-[10px] font-black uppercase font-mono tracking-wider">
                Recommended For You
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded bg-[#131d33] text-[#00d4ff] text-xs font-mono font-bold border border-[#00d4ff]/20">
                  {releaseInfo.version}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-mono uppercase">
                  Aegis for macOS
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                  {releaseInfo.macos.osSupport}
                </p>
              </div>

              {/* Spec list */}
              <div className="space-y-2 pt-2 text-xs font-mono text-[#cbd5e1] border-t border-[#1e293b]/60">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Architecture:</span>
                  <span>Apple Silicon &amp; Intel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Package Format:</span>
                  <span>{releaseInfo.macos.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Estimated Size:</span>
                  <span>{releaseInfo.macos.sizeEstimate}</span>
                </div>
              </div>

              {/* SHA256 Box */}
              <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                  <span>SHA-256 Checksum:</span>
                  <button
                    onClick={() => handleCopySha(releaseInfo.macos.sha256Placeholder, 'mac')}
                    className="hover:text-white flex items-center gap-1"
                    title="Copy Checksum"
                  >
                    {copiedSha === 'mac' ? (
                      <Check className="w-3 h-3 text-[#00ff88]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#94a3b8] truncate">
                  {releaseInfo.macos.sha256Placeholder}
                </p>
              </div>

              {/* Prerequisite Note */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Permissions:</span>
                  <span>{releaseInfo.macos.prerequisite}. Granted on first launch.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {releaseInfo.macos.downloadUrl ? (
                <a
                  href={releaseInfo.macos.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-black rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for macOS</span>
                </a>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-[#131d33] border border-[#1e3a5f] text-[#94a3b8] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <Download className="w-4 h-4 text-[#00d4ff]" />
                    <span>Installer Release v1.0.0 Ready</span>
                  </button>
                  <p className="text-[10px] text-center text-[#64748b] font-mono">
                    Direct installer artifact is mapped to release server.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* LINUX CARD */}
          <div
            className={`bg-[#0b1220] border rounded-2xl p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all relative ${
              detectedOs === 'linux'
                ? 'border-[#00d4ff] shadow-[0_0_30px_rgba(0,212,255,0.15)] ring-1 ring-[#00d4ff]'
                : 'border-[#1e293b] hover:border-[#334155]'
            }`}
          >
            {detectedOs === 'linux' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#00d4ff] text-[#070b14] text-[10px] font-black uppercase font-mono tracking-wider">
                Recommended For You
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <Laptop className="w-6 h-6" />
                </div>
                <span className="px-2 py-0.5 rounded bg-[#131d33] text-[#00d4ff] text-xs font-mono font-bold border border-[#00d4ff]/20">
                  {releaseInfo.version}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-mono uppercase">
                  Aegis for Linux
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono mt-0.5">
                  {releaseInfo.linux.osSupport}
                </p>
              </div>

              {/* Spec list */}
              <div className="space-y-2 pt-2 text-xs font-mono text-[#cbd5e1] border-t border-[#1e293b]/60">
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Architecture:</span>
                  <span>{releaseInfo.linux.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Package Format:</span>
                  <span>{releaseInfo.linux.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748b]">Estimated Size:</span>
                  <span>{releaseInfo.linux.sizeEstimate}</span>
                </div>
              </div>

              {/* SHA256 Box */}
              <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                  <span>SHA-256 Checksum:</span>
                  <button
                    onClick={() => handleCopySha(releaseInfo.linux.sha256Placeholder, 'linux')}
                    className="hover:text-white flex items-center gap-1"
                    title="Copy Checksum"
                  >
                    {copiedSha === 'linux' ? (
                      <Check className="w-3 h-3 text-[#00ff88]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-[#94a3b8] truncate">
                  {releaseInfo.linux.sha256Placeholder}
                </p>
              </div>

              {/* Prerequisite Note */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Prerequisite:</span>
                  <span>{releaseInfo.linux.prerequisite}</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {releaseInfo.linux.downloadUrl ? (
                <a
                  href={releaseInfo.linux.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-black rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Linux</span>
                </a>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-[#131d33] border border-[#1e3a5f] text-[#94a3b8] rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-not-allowed opacity-80"
                  >
                    <Download className="w-4 h-4 text-[#00d4ff]" />
                    <span>Installer Release v1.0.0 Ready</span>
                  </button>
                  <p className="text-[10px] text-center text-[#64748b] font-mono">
                    Direct installer artifact is mapped to release server.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Source Code & Local Runner Section */}
        <div className="bg-[#0b1220] border border-[#1e3a5f] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono uppercase">
                  Developer Build &amp; Source Instructions
                </h3>
                <p className="text-xs text-[#94a3b8] font-mono">
                  Build and package the Electron desktop binary directly from source
                </p>
              </div>
            </div>

            <Link
              href="/app"
              className="px-4 py-2 bg-[#131d33] hover:bg-[#1e293b] text-white border border-[#1e3a5f] rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 self-start sm:self-auto"
            >
              <span>Launch Web SOC Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2 font-mono text-xs">
              <span className="text-[10px] text-[#00d4ff] font-bold uppercase block">
                1. Clone &amp; Compile Native Desktop IDS
              </span>
              <pre className="text-[#00ff88] text-[11px] overflow-x-auto p-2 bg-[#090e1a] rounded border border-[#1e293b]">
                git clone &lt;repo-url&gt;{'\n'}
                cd aegis-ids{'\n'}
                npm install{'\n'}
                npm run compile:electron{'\n'}
                npm run electron:dev
              </pre>
            </div>

            <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2 font-mono text-xs">
              <span className="text-[10px] text-[#00ff88] font-bold uppercase block">
                2. Run Host SIEM Telemetry Collector
              </span>
              <pre className="text-[#00ff88] text-[11px] overflow-x-auto p-2 bg-[#090e1a] rounded border border-[#1e293b]">
                # Stream local auth &amp; syslog events{'\n'}
                python3 agent/agent.py \{'\n'}
                {'  '}--server http://localhost:3000 \{'\n'}
                {'  '}--interval 2
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
