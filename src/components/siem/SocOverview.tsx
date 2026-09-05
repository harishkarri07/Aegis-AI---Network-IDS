'use client';

import React from 'react';
import {
  ShieldAlert,
  Server,
  Activity,
  AlertTriangle,
  Layers,
  Radio,
  Zap,
  ArrowRight
} from 'lucide-react';
import { SOCMetrics, CorrelatedIncident, SecurityAlert } from '@/types';
import {
  Button,
  Card,
  CardHeader,
  Chip,
  cn,
  EmptyState,
  MetricCard,
  SeverityChip,
  StatusDot
} from '../ui';

interface SocOverviewProps {
  metrics: SOCMetrics | null;
  incidents: CorrelatedIncident[];
  recentAlerts: SecurityAlert[];
  onSelectAlert: (alert: SecurityAlert) => void;
  onNavigateTab: (tab: string) => void;
  onOpenSimulator: () => void;
}

export const SocOverview: React.FC<SocOverviewProps> = ({
  metrics,
  incidents,
  recentAlerts,
  onSelectAlert,
  onNavigateTab,
  onOpenSimulator
}) => {
  const totalEvents = metrics?.total_events ?? 0;
  const openAlerts = metrics?.total_open_alerts ?? 0;
  const criticalAlerts = metrics?.critical_alerts ?? 0;
  const onlineDevices = metrics?.online_devices ?? 0;
  const totalDevices = metrics?.total_devices ?? 0;

  const sevDist = metrics?.severity_distribution || {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  const topIncident = incidents.length > 0 ? incidents[0] : null;

  return (
    <div className="space-y-5">
      {/* Critical incident attention banner — calm, no pulse */}
      {topIncident && (
        <Card className="p-4 border-l-2 border-l-critical flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-control bg-critical-soft text-critical shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityChip severity={topIncident.severity} />
                <span className="text-caption font-semibold text-primary truncate">{topIncident.title}</span>
              </div>
              <p className="text-caption text-secondary leading-relaxed mt-0.5">{topIncident.summary}</p>
            </div>
          </div>
          <Button
            variant="dangerOutline"
            className="shrink-0 self-start md:self-center"
            onClick={() => onNavigateTab('incidents')}
          >
            Investigate incident
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Card>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Ingested telemetry"
          value={totalEvents.toLocaleString()}
          icon={Activity}
          context={
            <span className="inline-flex items-center gap-1.5 text-caption text-success">
              <StatusDot tone="success" />
              Live
            </span>
          }
        />
        <MetricCard
          label="Monitored endpoints"
          value={`${onlineDevices} / ${totalDevices}`}
          icon={Server}
          context={
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone={onlineDevices > 0 ? 'success' : 'neutral'} />
              <span className="text-caption text-muted">Heartbeat {onlineDevices > 0 ? 'healthy' : 'waiting'}</span>
            </span>
          }
        />
        <MetricCard
          label="Active alerts"
          value={openAlerts}
          icon={AlertTriangle}
          context={
            openAlerts > 0 ? (
              <span className="text-caption text-muted">Requiring analyst triage</span>
            ) : (
              <span className="text-caption text-success">No open alerts</span>
            )
          }
        />
        <MetricCard
          label="Critical severity"
          value={criticalAlerts}
          icon={ShieldAlert}
          context={
            criticalAlerts > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone="critical" />
                <span className="text-caption text-muted">High-risk detections</span>
              </span>
            ) : (
              <span className="text-caption text-success">No critical alerts</span>
            )
          }
        />
      </div>

      {/* Main 2-col section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          {/* Threat distribution */}
          <Card className="p-5">
            <CardHeader
              title="Threat severity distribution"
              description="Open security alerts by risk tier"
              icon={Layers}
              actions={
                <Button variant="secondary" size="sm" onClick={onOpenSimulator}>
                  <Zap className="w-3.5 h-3.5" />
                  Simulate scenario
                </Button>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'CRITICAL', count: sevDist.CRITICAL || 0, note: 'Risk ≥ 90' },
                { key: 'HIGH', count: sevDist.HIGH || 0, note: 'Risk 70–89' },
                { key: 'MEDIUM', count: sevDist.MEDIUM || 0, note: 'Risk 40–69' },
                { key: 'LOW', count: sevDist.LOW || 0, note: 'Risk 0–39' }
              ].map((tier) => (
                <div key={tier.key} className="p-3 rounded-card bg-canvas-deep border border-hairline text-center">
                  <div className="flex justify-center">
                    <SeverityChip severity={tier.key} />
                  </div>
                  <div className="text-title font-semibold text-primary tabular-nums mt-2">{tier.count}</div>
                  <div className="text-micro text-muted mt-0.5">{tier.note}</div>
                </div>
              ))}
            </div>

            {/* Taxonomy */}
            <div className="mt-5 pt-4 border-t border-hairline">
              <div className="text-caption text-muted mb-2">Ingested event taxonomy</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics?.event_type_distribution || {}).map(([type, count]) => (
                  <Chip key={type} tone="neutral" className="font-normal">
                    <span className="capitalize">{type}</span>
                    <span className="text-secondary tabular-nums font-medium">{count}</span>
                  </Chip>
                ))}
                {(!metrics?.event_type_distribution || Object.keys(metrics.event_type_distribution).length === 0) && (
                  <span className="text-caption text-muted italic">Awaiting endpoint telemetry streams…</span>
                )}
              </div>
            </div>
          </Card>

          {/* Top sources / hosts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <CardHeader title="Top originating threat IPs" icon={Radio} className="mb-3" />
              <div className="space-y-2">
                {(metrics?.top_source_ips || []).map((ip, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-well bg-canvas-deep border border-hairline">
                    <span className="font-mono text-caption text-primary truncate">{ip.ip}</span>
                    <Chip tone="neutral" className="!py-[2px] text-micro">
                      {ip.count} events
                    </Chip>
                  </div>
                ))}
                {(!metrics?.top_source_ips || metrics.top_source_ips.length === 0) && (
                  <p className="text-caption text-muted italic py-2">No malicious external IPs logged yet.</p>
                )}
              </div>
            </Card>
            <Card className="p-4">
              <CardHeader title="Top monitored host activity" icon={Server} className="mb-3" />
              <div className="space-y-2">
                {(metrics?.top_affected_hosts || []).map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-well bg-canvas-deep border border-hairline">
                    <span className="text-caption text-primary truncate">{h.hostname}</span>
                    <Chip tone="neutral" className="!py-[2px] text-micro">
                      {h.count} events
                    </Chip>
                  </div>
                ))}
                {(!metrics?.top_affected_hosts || metrics.top_affected_hosts.length === 0) && (
                  <p className="text-caption text-muted italic py-2">No endpoint telemetry logged yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Right: Recent alerts */}
        <Card className="p-5">
          <CardHeader
            title="Recent security alerts"
            icon={AlertTriangle}
            actions={
              <Button variant="tertiary" size="sm" onClick={() => onNavigateTab('alerts')}>
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            }
            className="mb-3"
          />
          <div className="space-y-2">
            {recentAlerts.slice(0, 5).map((alert) => (
              <button
                key={alert.alert_id}
                onClick={() => onSelectAlert(alert)}
                className={cn(
                  'w-full text-left p-3 rounded-card bg-canvas-deep border border-hairline',
                  'hover:border-hairline-strong hover:bg-surface-2 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <SeverityChip severity={alert.severity} />
                  <span className="text-micro font-mono text-muted tabular-nums">
                    {alert.last_seen.substring(11, 19)} UTC
                  </span>
                </div>
                <h5 className="text-caption font-medium text-primary leading-snug line-clamp-2">{alert.title}</h5>
                <div className="flex items-center justify-between gap-2 text-micro text-muted mt-1.5">
                  <span className="truncate">Host: {alert.hostname}</span>
                  <span className="shrink-0 tabular-nums">
                    {alert.event_count} events
                  </span>
                </div>
              </button>
            ))}
            {recentAlerts.length === 0 && (
              <EmptyState
                title="No active alerts"
                description="System telemetry is within normal security thresholds."
                className="py-10"
              />
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between gap-2">
            <span className="text-caption text-muted">Engine status</span>
            <span className="inline-flex items-center gap-1.5 text-caption text-success">
              <StatusDot tone="success" />
              Real-time stateful IDS active
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};
