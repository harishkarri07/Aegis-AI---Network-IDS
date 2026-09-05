'use client';

import React from 'react';
import { Layers, ArrowRight, ShieldAlert } from 'lucide-react';
import { CorrelatedIncident } from '@/types';
import {
  Button,
  Card,
  cn,
  EmptyState,
  EvidenceList,
  SectionHeader,
  SeverityChip,
  StatusChip
} from '../ui';

interface IncidentsViewProps {
  incidents: CorrelatedIncident[];
  onRefresh: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onRefresh
}) => {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Attack chains"
        description="Correlated, multi-stage attack progressions that combine several alerts into a single high-confidence incident."
        actions={
          <Button variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <div className="space-y-4">
        {incidents.map((inc) => (
          <Card key={inc.incident_id} className="p-5 border-l-2 border-l-critical space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <SeverityChip severity={inc.severity} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-micro font-mono text-muted">{inc.incident_id}</span>
                    <h3 className="text-subtitle font-semibold text-primary tracking-tight">{inc.title}</h3>
                  </div>
                  <div className="text-micro text-muted mt-0.5 tabular-nums">
                    First seen {inc.first_seen.substring(11, 19)} UTC · Last activity {inc.last_seen.substring(11, 19)} UTC
                  </div>
                </div>
              </div>
              <StatusChip status={inc.status} className="self-start sm:self-auto" />
            </div>

            <p className="text-caption text-secondary leading-relaxed">{inc.summary}</p>

            {/* Attack progression chain */}
            <div>
              <div className="text-caption text-muted mb-2">Attack progression</div>
              <div className="flex flex-wrap items-center gap-2">
                {inc.stages.map((stage, idx) => (
                  <React.Fragment key={idx}>
                    <span
                      className={cn(
                        'px-3 py-1.5 rounded-well border text-caption font-medium',
                        idx === inc.stages.length - 1
                          ? 'bg-critical-soft text-critical border-critical/30'
                          : 'bg-canvas-deep text-secondary border-hairline'
                      )}
                    >
                      {stage}
                    </span>
                    {idx < inc.stages.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-faint shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <EvidenceList
              items={[
                { label: 'Victim host', value: inc.hostname },
                { label: 'Attacker IP', value: inc.source_ip || 'Internal' },
                { label: 'MITRE chain', value: inc.mitre_attack_chain?.join(' → ') || 'N/A' }
              ]}
            />

            {/* Action item */}
            <div className="p-3.5 rounded-card bg-surface-2 border border-hairline">
              <div className="flex items-center gap-1.5 text-caption font-semibold text-primary mb-1">
                <ShieldAlert className="w-4 h-4 text-critical" />
                Incident response action
              </div>
              <p className="text-caption text-secondary leading-relaxed">{inc.recommendation}</p>
            </div>
          </Card>
        ))}

        {incidents.length === 0 && (
          <Card>
            <EmptyState
              title="No attack chains"
              description="No multi-stage correlated incidents detected. Individual security alerts are monitored continuously."
            />
          </Card>
        )}
      </div>
    </div>
  );
};
