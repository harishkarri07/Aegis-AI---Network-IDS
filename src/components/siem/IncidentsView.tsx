'use client';

import React from 'react';
import {
  ShieldAlert,
  Layers,
  ArrowRight,
  Server,
  Radio,
  User,
  CheckCircle2,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { CorrelatedIncident } from '@/types';

interface IncidentsViewProps {
  incidents: CorrelatedIncident[];
  onRefresh: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ff3366]" />
            Correlated Multi-Stage Attack Incidents
          </h2>
          <p className="text-xs text-[#7090b0] mt-0.5">
            Aggregated attack progressions correlating multiple alerts into unified high-confidence security incidents.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {incidents.map((inc) => (
          <div
            key={inc.incident_id}
            className="p-6 bg-[#111827] border border-[#ff3366]/40 rounded-xl space-y-4 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e3a5f] pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#ff3366] text-[#0a0e1a] text-xs font-black uppercase rounded-lg">
                  {inc.severity} ({inc.risk_score}/100)
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[#00d4ff] font-bold">
                      {inc.incident_id}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {inc.title}
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7090b0]">
                    First Seen: {inc.first_seen.substring(11, 19)} UTC | Last Activity: {inc.last_seen.substring(11, 19)} UTC
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] text-xs font-bold uppercase self-start sm:self-auto">
                {inc.status}
              </span>
            </div>

            <p className="text-xs text-[#b0c4de] leading-relaxed">
              {inc.summary}
            </p>

            {/* Attack Chain Progression Visualizer */}
            <div>
              <span className="text-[11px] font-bold text-[#7090b0] uppercase tracking-wider block mb-2">
                Attack Progression Chain
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {inc.stages.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <div className="px-3 py-1.5 bg-[#0a0e1a] border border-[#00d4ff]/40 rounded-lg text-xs font-bold text-[#00d4ff] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
                      {stage}
                    </div>
                    {idx < inc.stages.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-[#ff3366]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Context & MITRE ATT&CK chain */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Victim Host</span>
                <span className="font-mono text-white text-xs">{inc.hostname}</span>
              </div>
              <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Attacker IP</span>
                <span className="font-mono text-[#ff3366] text-xs">{inc.source_ip || 'Internal'}</span>
              </div>
              <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">MITRE Chain</span>
                <span className="font-mono text-[#00ff88] text-xs">
                  {inc.mitre_attack_chain?.join(', ') || 'N/A'}
                </span>
              </div>
            </div>

            {/* Actionable Remediation */}
            <div className="p-3.5 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg">
              <span className="text-xs font-bold text-[#ff3366] uppercase tracking-wider block mb-1">
                Incident Response Action Item
              </span>
              <p className="text-xs text-white">
                {inc.recommendation}
              </p>
            </div>
          </div>
        ))}

        {incidents.length === 0 && (
          <div className="p-12 bg-[#111827] border border-[#1e3a5f] rounded-xl text-center text-xs text-[#7090b0]">
            No multi-stage correlated incidents detected. Individual security alerts are monitored continuously.
          </div>
        )}
      </div>
    </div>
  );
};
