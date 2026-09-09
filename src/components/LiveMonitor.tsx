'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Activity, ChevronDown, List, Play, Radio, ShieldCheck, Square } from 'lucide-react';
import { Packet, AttackCategory, EngineStatus, NetworkInterfaceInfo } from '../types';
import { TrafficChart } from './TrafficChart';
import { AnomalyChart } from './AnomalyChart';
import { PlainAlert } from './AlertBox';
import { formatLocalTime, formatLocalTimeWithZone, timeAgo } from '../lib/time-format';
import {
  Button,
  Card,
  CardHeader,
  CategoryChip,
  Chip,
  cn,
  EmptyState,
  ErrorBanner,
  EvidenceList,
  InlineConfidence,
  MetricCard,
  Select,
  categoryLabel
} from './ui';

interface LiveMonitorProps {
  history: Packet[];
  anomalyScores: number[];
  totalPackets: number;
  attackCounts: Record<AttackCategory, number>;
  isRunning: boolean;
  latestSecurityAlert: Packet | null;
  interfaces: NetworkInterfaceInfo[];
  selectedInterface: string;
  onInterfaceChange: (id: string) => void;
  isElectron: boolean;
  onToggleMonitoring: () => void;
  captureError: string | null;
  onOpenDownloadModal: () => void;
  onOpenLogs?: () => void;
  engineStatus: EngineStatus | null;
}

function recentRate(packets: Packet[]): number | null {
  if (packets.length < 2) return null;
  let newest = -Infinity;
  let oldest = Infinity;
  for (const p of packets) {
    const t = new Date(p.timestamp).getTime();
    if (Number.isFinite(t)) {
      if (t > newest) newest = t;
      if (t < oldest) oldest = t;
    }
  }
  if (!Number.isFinite(newest)) return null;
  const spanMs = Math.max(newest - oldest, 250);
  return Math.round((packets.length / spanMs) * 1000);
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  history,
  anomalyScores,
  totalPackets,
  attackCounts,
  isRunning,
  latestSecurityAlert,
  interfaces,
  selectedInterface,
  onInterfaceChange,
  isElectron,
  onToggleMonitoring,
  captureError,
  onOpenDownloadModal,
  onOpenLogs,
  engineStatus
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalAttacks = (['DoS', 'Probe', 'R2L', 'U2R'] as AttackCategory[]).reduce(
    (acc, cat) => acc + (attackCounts[cat] || 0),
    0
  );

  const anomalies = useMemo(() => history.reduce((acc, p) => acc + (p.is_anomaly ? 1 : 0), 0), [history]);

  const rate = useMemo(() => recentRate(history), [history]);

  const minScore = anomalyScores.length ? Math.min(...anomalyScores) : null;

  const ifaceName =
    interfaces.find((i) => i.id === selectedInterface)?.name ||
    (selectedInterface === 'any' ? 'any interface' : selectedInterface === 'none' ? '—' : selectedInterface);

  const lastAlertAgo = timeAgo(latestSecurityAlert?.timestamp);
  const r2lU2r = attackCounts['R2L'] + attackCounts['U2R'];

  const feed = history.slice(0, 14);

  const attentionLabel = isRunning ? 'Needs attention' : 'Last detection';
  const hasAttention = Boolean(latestSecurityAlert);

  const renderAttention = () => {
    if (hasAttention && latestSecurityAlert) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-micro uppercase tracking-wider text-muted">{attentionLabel}</span>
            {lastAlertAgo && <span className="text-micro text-faint">detected {lastAlertAgo}</span>}
          </div>
          <PlainAlert packet={latestSecurityAlert} />
        </div>
      );
    }

    // Resting / all-clear state — calm, positive, never green-washed.
    const title = isRunning
      ? 'No threats detected'
      : totalPackets > 0
        ? 'Capture stopped'
        : 'Monitoring is on standby';
    const description = isRunning
      ? `Monitoring ${ifaceName} — recent traffic is within normal baselines.`
      : totalPackets > 0
        ? 'Capture has stopped. The session data below is frozen for review — press Start capture to resume.'
        : isElectron
          ? 'Choose a network interface and press Start capture to begin watching traffic for threats.'
          : 'Real packet capture runs in the native desktop app. Open the console there to monitor your network.';
    return (
      <Card className="p-5 flex items-start gap-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-control bg-surface-2 text-muted shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-subtitle font-semibold text-primary tracking-tight">{title}</h3>
            <Chip tone="success" className="hidden sm:inline-flex">All clear</Chip>
          </div>
          <p className="text-caption text-secondary leading-relaxed max-w-2xl">{description}</p>
          {!isElectron && !isRunning && (
            <Button variant="secondary" size="sm" className="mt-2.5" onClick={onOpenDownloadModal}>
              Get desktop runner
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── 1. Protection / capture state ─────────────────────────── */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Radio className="w-4 h-4 text-muted shrink-0" />
            <span className="text-caption text-muted shrink-0">Interface</span>
            <Select
              id="traffic-interface-select"
              suppressHydrationWarning
              value={selectedInterface}
              onChange={(e) => onInterfaceChange(e.target.value)}
              className="min-w-[190px] max-w-[260px]"
              aria-label="Network interface"
            >
              {interfaces.length > 0 ? (
                interfaces.map((iface) => (
                  <option key={iface.id} value={iface.id}>
                    {iface.name}
                  </option>
                ))
              ) : (
                <option value={selectedInterface || 'any'}>No network adapters detected</option>
              )}
            </Select>
          </div>

          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip tone={isRunning ? 'success' : 'neutral'} dot>
                {isRunning ? 'Capturing' : 'Standby'}
              </Chip>
              <span className="text-caption text-muted tabular-nums font-mono truncate">
                {isRunning
                  ? `${engineStatus?.activeFlows ?? 0} flows · ${engineStatus?.droppedPackets ?? 0} dropped`
                  : isElectron
                    ? 'Native capture ready'
                    : 'Web preview'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isRunning ? (
              <Button
                id="start-monitoring-btn"
                suppressHydrationWarning
                variant="primary"
                onClick={onToggleMonitoring}
              >
                <Play className="w-3.5 h-3.5" />
                Start PCAP Capture
              </Button>
            ) : (
              <Button
                id="stop-system-btn"
                suppressHydrationWarning
                variant="dangerOutline"
                onClick={onToggleMonitoring}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop PCAP Capture
              </Button>
            )}
          </div>
        </div>

        {captureError && (
          <div className="mt-3">
            <ErrorBanner
              title="Capture is unavailable"
              description="Start capture could not initialize. Check that the packet capture driver is installed and that the interface is available."
              detail={captureError}
              action={
                <Button variant="secondary" size="sm" onClick={onOpenDownloadModal}>
                  Desktop runner
                </Button>
              }
            />
          </div>
        )}
      </Card>

      {/* ── 2. What needs attention right now ─────────────────────── */}
      {renderAttention()}

      {/* ── 3. Session context — meaningful metrics ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <MetricCard
          label="Packets processed"
          value={totalPackets.toLocaleString()}
          icon={Activity}
          context={
            rate !== null && isRunning
              ? `≈ ${rate} pkts/s · last ${history.length} packets`
              : history.length > 0
                ? 'Session data · capture stopped'
                : 'Waiting for traffic'
          }
        />
        <MetricCard
          label="Threats detected"
          value={totalAttacks.toLocaleString()}
          context={
            totalAttacks > 0
              ? `${attackCounts['DoS']} DoS · ${attackCounts['Probe']} probes${r2lU2r > 0 ? ` · ${r2lU2r} access attempts` : ''}${lastAlertAgo ? ` · last ${lastAlertAgo}` : ''}`
              : 'None since capture started'
          }
        />
        <MetricCard
          label="Anomalous traffic"
          value={anomalies.toLocaleString()}
          context={
            anomalies > 0 && minScore !== null
              ? `Lowest anomaly score ${minScore.toFixed(3)} in current window`
              : minScore !== null
                ? `Recent window: min score ${minScore.toFixed(3)}`
                : 'No deviations observed yet'
          }
        />
      </div>

      {/* ── 4. Network activity ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <CardHeader
            title="Traffic by category"
            description="Session traffic, split by detection result"
          />
          <TrafficSection attackCounts={attackCounts} />
        </Card>
        <Card className="lg:col-span-2 p-5">
          <CardHeader
            title="Anomaly score"
            description="Recent samples — values below the dashed line deviate from the baseline"
          />
          <AnomalySection scores={anomalyScores} />
        </Card>
      </div>

      {/* ── 5. Recent security events ─────────────────────────────── */}
      <Card>
        <CardHeader
          title="Recent activity"
          description="Newest first — select a row to inspect its evidence"
          actions={
            onOpenLogs ? (
              <Button variant="tertiary" size="sm" onClick={onOpenLogs}>
                <List className="w-3.5 h-3.5" />
                Open Traffic Logs
              </Button>
            ) : undefined
          }
          className="px-5 pt-5 mb-0"
        />
        {feed.length === 0 ? (
          <EmptyState
            title="No traffic recorded yet"
            description="Once capture is running, packets will appear here with their detection result."
            className="py-12"
          />
        ) : (
          <div className="px-2 pb-2">
            {feed.map((p) => {
              const open = expandedId === p.id;
              const isAttack = p.category !== 'NORMAL';
              return (
                <div key={p.id} className="border-b border-hairline-faint last:border-0">
                  <button
                    onClick={() => setExpandedId(open ? null : p.id)}
                    aria-expanded={open}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-well transition-colors',
                      'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                      open && 'bg-surface-2'
                    )}
                  >
                    <span className="text-micro font-mono text-muted tabular-nums w-[62px] shrink-0 hidden sm:inline">
                      {formatLocalTime(p.timestamp)}
                    </span>
                    <CategoryChip category={p.category} className="shrink-0" />
                    <span className={cn('flex-1 min-w-0 truncate text-caption', isAttack ? 'text-primary font-medium' : 'text-secondary')}>
                      {categoryLabel[p.category] ?? p.category}
                      {p.explanation?.attack_name ? ` — ${p.explanation.attack_name}` : ''}
                    </span>
                    <span className="hidden md:inline text-micro font-mono text-muted truncate max-w-[220px] shrink-0">
                      {p.src_ip} → {p.dst_ip}:{p.dst_port}
                    </span>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-faint shrink-0 transition-transform', open && 'rotate-180')} />
                  </button>
                  {open && (
                    <div className="px-4 pb-4 pt-1 sm:pl-[148px]">
                      <div className="p-3.5 rounded-well bg-canvas-deep border border-hairline space-y-3">
                        <EvidenceList
                          items={[
                            { label: 'Source', value: p.src_ip },
                            { label: 'Destination', value: `${p.dst_ip}:${p.dst_port}` },
                            { label: 'Protocol', value: p.protocol },
                            ...(p.rule_triggered ? ([{ label: 'Rule', value: p.rule_triggered }] as const) : []),
                            ...(p.is_anomaly ? ([{ label: 'Anomaly score', value: p.iso_score?.toFixed(3) ?? '—' }] as const) : []),
                            { label: 'Detected at', value: formatLocalTimeWithZone(p.timestamp) }
                          ]}
                        />
                        <div className="pt-2 border-t border-hairline-faint">
                          <InlineConfidence confidence={p.confidence} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

/* Internal chart sections */

function TrafficSection({ attackCounts }: { attackCounts: Record<AttackCategory, number> }) {
  const data = (Object.keys(attackCounts) as AttackCategory[]).map((category) => ({
    category,
    count: attackCounts[category]
  }));
  return <TrafficChart data={data} />;
}

function AnomalySection({ scores }: { scores: number[] }) {
  return <AnomalyChart scores={scores} />;
}
