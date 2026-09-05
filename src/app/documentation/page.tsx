'use client';

import React, { useState } from 'react';
import { WebsiteNav } from '@/components/website/WebsiteNav';
import { WebsiteFooter } from '@/components/website/WebsiteFooter';
import {
  FileText,
  Terminal,
  Cpu,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Server,
  Layers,
  BookOpen
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedCmd(id);
      setTimeout(() => setCopiedCmd(null), 2000);
    }
  };

  const navItems = [
    { id: 'quickstart', label: '1. Quick Start Guide' },
    { id: 'npcap', label: '2. Windows Npcap Setup' },
    { id: 'heuristics', label: '3. Detection Heuristics & Flows' },
    { id: 'siem', label: '4. Host SIEM & Telemetry Agent' },
    { id: 'troubleshooting', label: '5. Troubleshooting & FAQ' }
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-[#cbd5e1] flex flex-col">
      <WebsiteNav />

      {/* Header */}
      <section className="pt-16 pb-10 bg-[#090e1a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Technical Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase font-mono tracking-tight">
            AEGIS OPERATIONAL &amp; DEVELOPER MANUAL
          </h1>
          <p className="text-sm text-[#94a3b8] max-w-2xl mx-auto">
            Comprehensive setup guides, packet capture driver requirements, detection rule specifications, and SIEM endpoint integrations.
          </p>
        </div>
      </section>

      {/* Main Content Layout with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Left Navigation */}
          <div className="lg:col-span-3 sticky top-24 space-y-2 bg-[#0b1220] border border-[#1e293b] p-4 rounded-xl">
            <span className="text-[10px] font-bold font-mono text-[#64748b] uppercase tracking-wider block px-2 pb-2">
              Documentation Index
            </span>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`block px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeSection === item.id
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 font-bold'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#131b2e]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-9 space-y-12">
            {/* 1. QUICK START */}
            <section id="quickstart" className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">
                    1. Quick Start Guide
                  </h2>
                  <span className="text-xs text-[#94a3b8] font-mono">
                    Install, configure network adapter, and start real-time monitoring
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-[#cbd5e1]">
                <p>
                  Aegis AI runs as a native desktop application powered by Electron and C++ packet capture bindings. Follow these three steps to begin monitoring live network traffic:
                </p>

                <div className="space-y-4 pt-2">
                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">
                      Step 1: Install Packet Capture Driver
                    </span>
                    <p className="text-xs text-[#94a3b8]">
                      On Windows, install Npcap 1.70+ from{' '}
                      <a href="https://npcap.com" target="_blank" rel="noreferrer" className="text-[#00d4ff] hover:underline font-bold">
                        npcap.com
                      </a>
                      . On Linux, ensure `libpcap-dev` is installed. On macOS, capture drivers are included natively.
                    </p>
                  </div>

                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">
                      Step 2: Launch Aegis &amp; Select Network Interface
                    </span>
                    <p className="text-xs text-[#94a3b8]">
                      Open Aegis with Administrator/root privileges. In the top toolbar, open the Interface selector dropdown. Select your active network adapter (e.g., `Wi-Fi`, `Ethernet`, or `eth0`).
                    </p>
                  </div>

                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2">
                    <span className="text-xs font-bold text-white font-mono uppercase">
                      Step 3: Click &quot;Start Capture&quot;
                    </span>
                    <p className="text-xs text-[#94a3b8]">
                      Click the green &quot;Start Capture&quot; button. Live layer-2 frames will immediately stream into the 5-tuple flow analyzer, telemetry charts, and deterministic rule evaluators.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. WINDOWS NPCAP GUIDE */}
            <section id="npcap" className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center justify-center text-[#00ff88]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">
                    2. Windows Npcap Guide
                  </h2>
                  <span className="text-xs text-[#94a3b8] font-mono">
                    NDIS 6 kernel driver installation &amp; interface mapping
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-[#cbd5e1]">
                <p>
                  Windows operating systems restrict raw socket packet capture by default in user-mode applications. Npcap provides a secure kernel-mode filter driver that permits Aegis to capture Ethernet frames in promiscuous mode.
                </p>

                <div className="bg-[#0f172a] border border-[#1e3a5f] p-4 rounded-xl space-y-2">
                  <span className="font-bold text-white font-mono uppercase block">
                    Important Npcap Installation Checkboxes:
                  </span>
                  <ul className="space-y-1.5 list-disc list-inside text-[#94a3b8]">
                    <li>
                      <strong className="text-white">Install Npcap in WinPcap API-compatible Mode:</strong>{' '}
                      Checked (Enables compatibility with node-cap bindings).
                    </li>
                    <li>
                      <strong className="text-white">Support raw 802.11 traffic (and monitor mode):</strong>{' '}
                      Optional (Recommended for Wi-Fi analysis).
                    </li>
                    <li>
                      <strong className="text-white">Restrict Npcap driver's access to Administrators only:</strong>{' '}
                      Recommended for hardened enterprise deployments.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-white font-mono uppercase">
                    Windows Interface Mapping Explained:
                  </h4>
                  <p className="text-[#94a3b8]">
                    Windows OS reports friendly adapter names (e.g., &apos;Wi-Fi&apos; or &apos;Ethernet 2&apos;), while Npcap internally exposes hardware GUID strings such as <code>\Device\NPF_&#123;GUID&#125;</code>. Aegis includes an intelligent adapter mapper that resolves friendly names to the exact underlying Npcap device ID, guaranteeing zero capture failures.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. HEURISTICS & FLOWS */}
            <section id="heuristics" className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center text-[#00d4ff]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">
                    3. Detection Heuristics &amp; Flow Tracking
                  </h2>
                  <span className="text-xs text-[#94a3b8] font-mono">
                    Deterministic sliding temporal windows and rule specifications
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-[#cbd5e1]">
                <p>
                  Aegis maintains an active in-memory LRU cache of bidirectional 5-tuple flows: `(Source IP, Destination IP, Source Port, Destination Port, Protocol)`. Over sliding 10-second temporal windows, the engine calculates:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                    <span className="font-bold text-[#00d4ff] font-mono uppercase">SYN / ACK Handshake Ratio</span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Monitors unanswered TCP connection requests. Low ACK ratios (&lt; 0.1) under high SYN velocities trigger DoS flood alerts.
                    </p>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                    <span className="font-bold text-[#00d4ff] font-mono uppercase">Port Entropy &amp; Diversity</span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Tracks distinct destination port contacts per source IP. Contacting &gt;15 unique ports within 10s triggers Port Scan heuristics.
                    </p>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                    <span className="font-bold text-[#00d4ff] font-mono uppercase">Volumetric Byte Velocity</span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Measures kilobyte throughput per endpoint. Extreme spikes (&gt;200 kB/s on unaccustomed ports) trigger volumetric anomaly alerts.
                    </p>
                  </div>
                  <div className="bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
                    <span className="font-bold text-[#00d4ff] font-mono uppercase">TCP RST Teardown Frequency</span>
                    <p className="text-[11px] text-[#94a3b8]">
                      Repeated connection aborts on SSH (22), RDP (3389), or SMB (445) trigger Remote-to-Local (R2L) Brute Force classification.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. SIEM & HOST AGENT */}
            <section id="siem" className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 border border-[#a855f7]/30 flex items-center justify-center text-[#a855f7]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">
                    4. Host SIEM &amp; Telemetry Agent
                  </h2>
                  <span className="text-xs text-[#94a3b8] font-mono">
                    Correlating endpoint syslog and authentication events
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-[#cbd5e1]">
                <p>
                  The Aegis SIEM daemon accepts JSON telemetry payloads over local REST endpoints from lightweight endpoint collector daemons.
                </p>

                <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#00d4ff] uppercase">Running the Endpoint Agent:</span>
                    <button
                      onClick={() => handleCopy('python3 agent/agent.py --server http://localhost:3000', 'agent')}
                      className="text-[#94a3b8] hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedCmd === 'agent' ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-[#00ff88] text-[11px] overflow-x-auto p-2 bg-[#090e1a] rounded">
                    python3 agent/agent.py --server http://localhost:3000 --interval 2
                  </pre>
                </div>

                <p className="text-[#94a3b8]">
                  The agent monitors `/var/log/auth.log` (Linux) or Security Event Log (Windows), extracting login failures, sudo invocations, and service startups, streaming them to the SQLite WAL database for multi-stage MITRE ATT&amp;CK correlation.
                </p>
              </div>
            </section>

            {/* 5. TROUBLESHOOTING */}
            <section id="troubleshooting" className="bg-[#0b1220] border border-[#1e293b] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-[#1e293b] pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 flex items-center justify-center text-[#ff3366]">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-mono uppercase">
                    5. Troubleshooting &amp; Diagnostics
                  </h2>
                  <span className="text-xs text-[#94a3b8] font-mono">
                    Common operational issues and resolution steps
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-[#cbd5e1]">
                <div className="space-y-3">
                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-1">
                    <span className="font-bold text-white font-mono uppercase block">
                      Issue: &quot;Npcap not found or driver failed to open&quot;
                    </span>
                    <p className="text-[#94a3b8]">
                      <strong>Fix:</strong> Verify Npcap is installed from npcap.com with &quot;WinPcap API-compatible Mode&quot; enabled. Ensure the Aegis desktop application is launched by right-clicking and selecting &quot;Run as Administrator&quot;.
                    </p>
                  </div>

                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-1">
                    <span className="font-bold text-white font-mono uppercase block">
                      Issue: &quot;Capture started but 0 packets are incrementing&quot;
                    </span>
                    <p className="text-[#94a3b8]">
                      <strong>Fix:</strong> Confirm that you selected the active network adapter that has current default gateway IP routing (e.g. Wi-Fi adapter vs unused VirtualBox host adapter). Open a web browser to generate sample traffic.
                    </p>
                  </div>

                  <div className="bg-[#070b14] p-4 rounded-xl border border-[#1e293b] space-y-1">
                    <span className="font-bold text-white font-mono uppercase block">
                      Issue: &quot;Permission denied on Linux socket capture&quot;
                    </span>
                    <p className="text-[#94a3b8]">
                      <strong>Fix:</strong> Run Aegis with `sudo` or grant packet capture capabilities to the binary using: <br />
                      <code className="text-[#00ff88] font-mono text-[11px]">sudo setcap cap_net_raw,cap_net_admin=eip /path/to/aegis-binary</code>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <WebsiteFooter />
    </div>
  );
}
