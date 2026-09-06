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
    downloadUrl: string;
    prereqUrl: string;
  };
  macos: {
    fileName: string;
    arch: string;
    osSupport: string;
    sizeEstimate: string;
    downloadUrl: string;
    prereqUrl: string;
  };
  linux: {
    fileName: string;
    arch: string;
    osSupport: string;
    sizeEstimate: string;
    downloadUrl: string;
    prereqUrl: string;
  };
}

// Repo the public website links to. Keep in sync with the git remote.
const REPO_URL = 'https://github.com/harishkarri07/Aegis-AI---Network-IDS';
// Stable "always the newest published release" redirect. GitHub rewrites
// /releases/latest/download/<file> to the most recent non-prerelease, non-draft
// release that contains a matching asset. NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL can
// override this (e.g. for a mirror or a pinned version).
const LATEST_WINDOWS_URL =
  process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL ||
  `${REPO_URL}/releases/latest/download/Aegis-Network-IDS-Setup.exe`;
// Stable "all releases" page for users who want older builds or release notes.
const ALL_RELEASES_URL = `${REPO_URL}/releases`;

export function DownloadsCenter() {
  const [detectedOs, setDetectedOs] = useState<'windows' | 'macos' | 'linux' | 'unknown'>('unknown');

  // Data-driven release schema. File names and sizes come from the actual
  // electron-builder output (dist:win). SHA checksums are intentionally not
  // shown here — they are published in the GitHub Release notes when a release
  // is created and must never be a hardcoded placeholder.
  const releaseInfo: ReleaseConfig = {
    version: 'v1.0.0',
    releaseDate: 'September 2026',
    channel: 'Stable · unsigned build',
    windows: {
      fileName: 'Aegis-Network-IDS-Setup.exe',
      arch: 'x64 (64-bit)',
      osSupport: 'Windows 10 / Windows 11 (64-bit)',
      sizeEstimate: '~143 MB',
      downloadUrl: LATEST_WINDOWS_URL,
      prereqUrl: 'https://npcap.com'
    },
    macos: {
      fileName: 'Aegis-Network-IDS.dmg (not yet published)',
      arch: 'Universal (Apple Silicon M1/M2/M3/M4 & Intel x64)',
      osSupport: 'macOS Monterey (12.0) or higher',
      sizeEstimate: '~90 MB',
      downloadUrl: (process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL || '').trim(),
      prereqUrl: 'https://github.com/harishkarri07/Aegis-AI---Network-IDS/actions'
    },
    linux: {
      fileName: 'Aegis-Network-IDS.AppImage (not yet published)',
      arch: 'x86_64 / amd64',
      osSupport: 'Ubuntu 20.04+ / Debian 11+ / Fedora 36+',
      sizeEstimate: '~82 MB',
      downloadUrl: (process.env.NEXT_PUBLIC_LINUX_DOWNLOAD_URL || '').trim(),
      prereqUrl: 'https://github.com/harishkarri07/Aegis-AI---Network-IDS/actions'
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

              {/* Prerequisite + integrity note: no hardcoded fake SHA-256 */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Npcap required</span>
                  <span>Promiscuous capture needs the free </span>
                  <a
                    href={releaseInfo.windows.prereqUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00d4ff] hover:underline font-bold"
                  >
                    Npcap driver
                  </a>
                  {' '}installed first. Installer is a 64-bit NSIS build (unsigned — see notes).
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <div className="space-y-2">
                <a
                  href={releaseInfo.windows.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 bg-[#00d4ff] hover:bg-[#38bdf8] text-[#070b14] font-black rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for Windows</span>
                </a>
                <p className="text-[10px] text-center text-[#64748b] font-mono">
                  Latest stable release · Aegis-Network-IDS-Setup.exe
                </p>
              </div>
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
                  <span>{releaseInfo.macos.arch}</span>
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

              {/* Prerequisite Note */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Permissions:</span>
                  <span>BPF packet capture permission is granted on first launch.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <a
                href={ALL_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-[#131d33] hover:bg-[#1e293b] text-white border border-[#1e3a5f] rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-[#00d4ff]" />
                <span>macOS build — follow Releases</span>
              </a>
              <p className="text-[10px] text-center text-[#64748b] font-mono">
                Published when a macOS release is tagged (see GitHub Releases).
              </p>
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

              {/* Prerequisite Note */}
              <div className="p-3 bg-[#0f172a] rounded-lg border border-[#1e3a5f] text-[11px] text-[#cbd5e1] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#00d4ff] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Prerequisite:</span>
                  <span>libpcap library (libpcap-dev) and the CAP_NET_RAW capability.</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <a
                href={ALL_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-[#131d33] hover:bg-[#1e293b] text-white border border-[#1e3a5f] rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-[#00d4ff]" />
                <span>Linux build — follow Releases</span>
              </a>
              <p className="text-[10px] text-center text-[#64748b] font-mono">
                AppImage / .deb published when a Linux release is tagged.
              </p>
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
