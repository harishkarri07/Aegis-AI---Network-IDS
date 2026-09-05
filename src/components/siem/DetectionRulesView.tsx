'use client';

import React, { useState } from 'react';
import {
  FileCode,
  Shield,
  Clock,
  Layers,
  Search,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { SIEMDetectionRule } from '@/types';

interface DetectionRulesViewProps {
  rules: SIEMDetectionRule[];
}

export const DetectionRulesView: React.FC<DetectionRulesViewProps> = ({ rules }) => {
  const [search, setSearch] = useState('');

  const filteredRules = rules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.rule_id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      (r.mitre_technique && r.mitre_technique.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
            <FileCode className="w-5 h-5 text-[#00d4ff]" />
            Active Detection Rules Repository
          </h2>
          <p className="text-xs text-[#7090b0] mt-0.5">
            Deterministic, explainable security detection criteria compiled into the stateful time-window engine.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-[#7090b0] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search rules, MITRE techniques..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-white placeholder-[#7090b0] focus:outline-none focus:border-[#00d4ff]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const isCrit = rule.severity === 'CRITICAL';
          const isHigh = rule.severity === 'HIGH';
          const badgeClass = isCrit
            ? 'bg-[#ff3366] text-[#0a0e1a]'
            : isHigh
            ? 'bg-[#ffaa00] text-[#0a0e1a]'
            : 'bg-[#00d4ff] text-[#0a0e1a]';

          return (
            <div
              key={rule.rule_id}
              className="p-5 bg-[#111827] border border-[#1e3a5f] rounded-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-[#00d4ff] font-bold">
                      {rule.rule_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeClass}`}>
                      {rule.severity} ({rule.risk_score})
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {rule.name}
                  </h3>
                </div>

                <span className="px-2 py-0.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-[10px] font-bold rounded uppercase">
                  Enabled
                </span>
              </div>

              <p className="text-xs text-[#b0c4de] leading-relaxed">
                {rule.description}
              </p>

              {/* Rule Parameters */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-center">
                  <span className="text-[10px] text-[#7090b0] uppercase font-bold block">Timeframe</span>
                  <span className="font-mono text-white font-bold">{rule.timeframe}s</span>
                </div>
                <div className="p-2 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-center">
                  <span className="text-[10px] text-[#7090b0] uppercase font-bold block">Count Threshold</span>
                  <span className="font-mono text-white font-bold">&ge; {rule.count}</span>
                </div>
                <div className="p-2 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-center">
                  <span className="text-[10px] text-[#7090b0] uppercase font-bold block">Group By</span>
                  <span className="font-mono text-[#00d4ff] font-bold">{rule.group_by || 'global'}</span>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block mb-1.5">
                  Trigger Conditions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(rule.conditions || {}).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2 py-0.5 bg-[#1e3a5f]/50 border border-[#1e3a5f] rounded text-[11px] font-mono text-[#00ff88]"
                    >
                      {k}={String(v)}
                    </span>
                  ))}
                  {rule.preceding_rule && (
                    <span className="px-2 py-0.5 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded text-[11px] font-mono text-[#ffaa00]">
                      requires_prior: {rule.preceding_rule}
                    </span>
                  )}
                </div>
              </div>

              {/* MITRE Mapping */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1e3a5f]/60">
                <span className="text-[#7090b0]">MITRE Technique:</span>
                <span className="font-mono font-bold text-[#00d4ff]">
                  {rule.mitre_technique || 'N/A'} ({rule.mitre_tactic || 'General'})
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
