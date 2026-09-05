'use client';

import React, { useState } from 'react';
import { Check, Eye, ShieldAlert, RotateCcw, HelpCircle } from 'lucide-react';
import { SecurityAlert } from '@/types';
import {
  Button,
  Card,
  Chip,
  cn,
  EmptyState,
  EvidenceList,
  SearchInput,
  SectionHeader,
  Select,
  SeverityChip,
  StatusChip
} from '../ui';

interface AlertsInvestigationViewProps {
  alerts: SecurityAlert[];
  onUpdateStatus: (alertId: string, status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED') => Promise<void>;
  onRefresh: () => void;
}

export const AlertsInvestigationView: React.FC<AlertsInvestigationViewProps> = ({
  alerts,
  onUpdateStatus,
  onRefresh
}) => {
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(
    alerts.length > 0 ? alerts[0] : null
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.hostname.toLowerCase().includes(q) ||
        a.rule_id.toLowerCase().includes(q) ||
        (a.source_ip && a.source_ip.includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = async (newStatus: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    if (!selectedAlert) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(selectedAlert.alert_id, newStatus);
      setSelectedAlert({ ...selectedAlert, status: newStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Alerts & triage"
        description="Investigate and acknowledge security alerts. Every alert explains what happened, why it fired, and what to do next."
        actions={
          <Button variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
          <SearchInput
            placeholder="Search title, rule ID, host, or source IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px]"
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </Select>
          <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} aria-label="Filter by severity">
            <option value="ALL">All severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* List */}
          <div className="lg:col-span-5 space-y-2">
            {filteredAlerts.map((alert) => {
              const isSelected = selectedAlert?.alert_id === alert.alert_id;
              return (
                <button
                  key={alert.alert_id}
                  onClick={() => setSelectedAlert(alert)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-card border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                    isSelected
                      ? 'bg-surface-2 border-hairline-strong'
                      : 'bg-surface-1 border-hairline hover:border-hairline-strong'
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <SeverityChip severity={alert.severity} />
                      <span className="text-micro font-mono text-muted truncate">{alert.rule_id}</span>
                    </div>
                    <StatusChip status={alert.status} />
                  </div>
                  <h4 className="text-caption font-medium text-primary leading-snug mb-1.5">{alert.title}</h4>
                  <div className="flex items-center justify-between gap-2 text-micro text-muted">
                    <span className="font-mono truncate">{alert.hostname}</span>
                    <span className="shrink-0 tabular-nums">{alert.event_count} events · {alert.last_seen.substring(11, 19)} UTC</span>
                  </div>
                </button>
              );
            })}
            {filteredAlerts.length === 0 && (
              <EmptyState
                title="No alerts found"
                description="No alerts match the current filters."
                className="py-10"
              />
            )}
          </div>

          {/* Detail */}
          <div className="lg:col-span-7">
            {selectedAlert ? (
              <Card className="p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-micro font-mono text-muted px-2 py-0.5 rounded-well bg-surface-2">
                        {selectedAlert.alert_id}
                      </span>
                      <span className="text-micro text-muted font-mono">Rule: {selectedAlert.rule_id}</span>
                    </div>
                    <h2 className="text-subtitle font-semibold text-primary tracking-tight">{selectedAlert.title}</h2>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('ACKNOWLEDGED')}
                      disabled={isUpdating || selectedAlert.status === 'ACKNOWLEDGED'}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Acknowledge
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStatusChange('RESOLVED')}
                      disabled={isUpdating || selectedAlert.status === 'RESOLVED'}
                    >
                      <Check className="w-3.5 h-3.5 text-success" />
                      Resolve
                    </Button>
                    {selectedAlert.status !== 'OPEN' && (
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleStatusChange('OPEN')}
                        disabled={isUpdating}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Re-open
                      </Button>
                    )}
                  </div>
                </div>

                {/* Why did this fire */}
                <div className="p-4 rounded-card bg-canvas-deep border border-hairline space-y-3">
                  <h4 className="flex items-center gap-1.5 text-caption font-semibold text-primary">
                    <HelpCircle className="w-4 h-4 text-muted" />
                    Why did this alert fire?
                  </h4>
                  <p className="text-caption text-secondary leading-relaxed">{selectedAlert.description}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <Stat label="Risk score" value={`${selectedAlert.risk_score}/100`} />
                    <Stat label="Event count" value={String(selectedAlert.event_count)} />
                    <Stat label="MITRE technique" value={selectedAlert.mitre_technique || 'N/A'} mono />
                    <Stat label="MITRE tactic" value={selectedAlert.mitre_tactic || 'General'} />
                  </div>
                </div>

                {/* Matched conditions */}
                <div>
                  <div className="text-caption text-muted mb-2">Matched engine conditions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedAlert.matched_conditions || []).map((cond, idx) => (
                      <Chip key={idx} tone="neutral" className="font-mono text-micro !py-[3px]">
                        {cond}
                      </Chip>
                    ))}
                    {(!selectedAlert.matched_conditions || selectedAlert.matched_conditions.length === 0) && (
                      <span className="text-caption text-muted italic">Standard threshold criteria met.</span>
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="p-4 rounded-card bg-surface-2 border border-hairline">
                  <h4 className="flex items-center gap-1.5 text-caption font-semibold text-primary mb-1.5">
                    <ShieldAlert className="w-4 h-4 text-muted" />
                    Recommended analyst response
                  </h4>
                  <p className="text-caption text-secondary leading-relaxed">{selectedAlert.recommendation}</p>
                </div>

                {/* Evidence */}
                <EvidenceList
                  items={[
                    { label: 'Target host', value: selectedAlert.hostname },
                    { label: 'Device ID', value: selectedAlert.device_id },
                    { label: 'Attacker source IP', value: selectedAlert.source_ip || 'Internal / local' },
                    { label: 'Target user', value: selectedAlert.username || 'System' }
                  ]}
                />
              </Card>
            ) : (
              <EmptyState
                title="Select an alert"
                description="Choose an alert from the list to review its investigation details."
                className="py-16 bg-canvas-deep border border-hairline rounded-card"
              />
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded-well bg-surface-1 border border-hairline min-w-0">
      <div className="text-micro text-muted mb-0.5">{label}</div>
      <div className={cn('text-caption font-semibold text-primary tabular-nums truncate', mono && 'font-mono text-accent')}>
        {value}
      </div>
    </div>
  );
}
