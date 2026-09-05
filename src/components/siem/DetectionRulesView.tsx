'use client';

import React, { useState } from 'react';
import { SIEMDetectionRule } from '@/types';
import {
  Card,
  Chip,
  EmptyState,
  SearchInput,
  SectionHeader,
  SeverityChip,
  StatusChip
} from '../ui';

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
    <div className="space-y-5">
      <SectionHeader
        title="SIEM rules"
        description="Deterministic, explainable detection criteria evaluated by the stateful time-window engine."
        actions={<SearchInput placeholder="Search rules, MITRE techniques…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />}
      />

      {filteredRules.length === 0 ? (
        <Card>
          <EmptyState title="No rules match" description="Try a different search term." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => (
            <Card key={rule.rule_id} className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-micro font-mono text-muted">{rule.rule_id}</span>
                    <SeverityChip severity={rule.severity} />
                  </div>
                  <h3 className="text-caption font-semibold text-primary">{rule.name}</h3>
                </div>
                <StatusChip status={rule.enabled ? 'Enabled' : 'Disabled'} className="shrink-0" />
              </div>

              <p className="text-caption text-secondary leading-relaxed">{rule.description}</p>

              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Timeframe" value={`${rule.timeframe}s`} mono />
                <MiniStat label="Count threshold" value={`≥ ${rule.count}`} mono />
                <MiniStat label="Group by" value={rule.group_by || 'global'} mono />
              </div>

              <div>
                <div className="text-caption text-muted mb-1.5">Trigger conditions</div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(rule.conditions || {}).map(([k, v]) => (
                    <Chip key={k} tone="neutral" className="font-mono text-micro !py-[3px]">
                      {k}={String(v)}
                    </Chip>
                  ))}
                  {rule.preceding_rule && (
                    <Chip tone="medium" className="font-mono text-micro !py-[3px]">
                      requires prior: {rule.preceding_rule}
                    </Chip>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 text-caption pt-2 border-t border-hairline-faint">
                <span className="text-muted">MITRE mapping</span>
                <span className="font-mono text-secondary truncate">
                  {rule.mitre_technique || 'N/A'} ({rule.mitre_tactic || 'General'})
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

function MiniStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded-well bg-canvas-deep border border-hairline">
      <div className="text-micro text-muted">{label}</div>
      <div className={'text-caption font-medium text-primary tabular-nums ' + (mono ? 'font-mono' : '')}>{value}</div>
    </div>
  );
}
