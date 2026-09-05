'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is Aegis AI?',
      a: 'Aegis AI is a high-performance desktop Network Intrusion Detection System (NIDS) and host SIEM. It captures raw network packets directly from your network interface, tracks stateful 5-tuple flows, applies deterministic threat heuristics, and aggregates security alerts into correlated attack chains.'
    },
    {
      q: 'Is Aegis an antivirus?',
      a: 'No. Traditional antivirus software scans files, processes, and disk memory on a host endpoint. Aegis operates primarily as a Network IDS that passively inspects wire traffic across network interfaces to detect scans, volumetric floods, and lateral movement. Aegis can complement endpoint antivirus.'
    },
    {
      q: 'What is a Network IDS (NIDS)?',
      a: 'A Network Intrusion Detection System monitors packets passing through a network adapter in promiscuous mode. By analyzing packet headers, handshake timings, port distributions, and velocity without inline blocking, it identifies malicious activity while maintaining zero packet latency.'
    },
    {
      q: 'Does Aegis monitor my network in real time?',
      a: 'Yes. When running natively in the Aegis desktop application, packets are captured from the kernel driver, decoded, and evaluated across active 10-second sliding temporal windows with sub-millisecond latency.'
    },
    {
      q: 'What operating systems are supported?',
      a: 'Aegis desktop is built for Windows 10/11 64-bit (via Npcap), Linux (via libpcap), and macOS 12+ (via BPF). Windows x64 is the primary validated target.'
    },
    {
      q: 'Does Windows require Npcap?',
      a: 'Yes. Windows does not support promiscuous raw link-layer packet capture natively out of user space. Npcap provides the required NDIS 6 filter driver. Npcap can be downloaded from npcap.com and installed with "WinPcap API-compatible Mode" enabled.'
    },
    {
      q: 'Does Aegis send my network traffic to the cloud?',
      a: 'No. Aegis is strictly local-first. Raw packet bytes, headers, flow statistics, and SIEM logs remain 100% on your local machine in local RAM and SQLite storage. No traffic is uploaded to external clouds.'
    },
    {
      q: 'Can Aegis monitor other computers on my local network?',
      a: 'Yes, depending on your network topology. On a standard switched Ethernet network, you can monitor other machines by connecting to a SPAN/mirror port on a managed switch, using a network TAP, or deploying the lightweight Aegis endpoint agent on those remote machines to stream telemetry to the central SIEM.'
    },
    {
      q: 'What is the difference between the Network IDS and the SIEM in Aegis?',
      a: 'The Network IDS passively captures and analyzes link-layer/IP packets. The SIEM (Security Information & Event Management) collects and correlates alerts from both the Network IDS and host agent logs (e.g., failed sudo, auth brute-force) into unified attack incidents.'
    },
    {
      q: 'Can I run Aegis completely offline?',
      a: 'Yes. The entire detection engine, sliding window tracker, packet decoders, and SQLite SIEM backend are self-contained. Aegis requires zero internet connectivity to perform deep packet inspection and intrusion detection.'
    },
    {
      q: 'Where can I download Aegis?',
      a: 'You can download the desktop application from our official Downloads page at /downloads. We provide direct installer packages for Windows, macOS, and Linux.'
    }
  ];

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-[#070b14] border-b border-[#1e293b]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 text-[#00d4ff] text-xs font-bold font-mono uppercase">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-mono">
            QUESTIONS &amp; ANSWERS
          </h2>
          <p className="text-sm text-[#94a3b8]">
            Everything you need to know about Aegis architecture, requirements, and deployment.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-[#0b1220] border border-[#1e293b] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-[#131b2e]/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white font-mono">
                    {faq.q}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-[#131d33] flex items-center justify-center text-[#00d4ff] shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed border-t border-[#1e293b]/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-xs text-[#64748b]">
          Have more technical questions? Check out the{' '}
          <Link href="/documentation" className="text-[#00d4ff] hover:underline font-bold">
            Technical Documentation
          </Link>{' '}
          or explore the{' '}
          <Link href="/technology" className="text-[#00d4ff] hover:underline font-bold">
            Technology Stack
          </Link>
          .
        </div>
      </div>
    </section>
  );
}
