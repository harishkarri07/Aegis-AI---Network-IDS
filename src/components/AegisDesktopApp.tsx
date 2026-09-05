'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Activity,
  BarChart3,
  Brain,
  List,
  Download,
  AlertTriangle,
  Laptop,
  Terminal,
  Layers,
  Server,
  FileCode,
  FileText,
  Zap,
  Radio,
  RefreshCw,
  ArrowLeft,
  Clock,
  FlaskConical
} from 'lucide-react';
import Link from 'next/link';
import {
  Packet,
  AttackCategory,
  NetworkInterfaceInfo,
  EngineStatus,
  SOCMetrics,
  SecurityEvent,
  SecurityAlert,
  CorrelatedIncident,
  MonitoredDevice,
  SIEMDetectionRule
} from '@/types';
import { cn, Button, Chip, IconButton } from './ui';

// Network IDS Components
import { LiveMonitor } from './LiveMonitor';
import { Analytics } from './Analytics';
import { ModelPerformance } from './ModelPerformance';
import { ExplainAlert } from './ExplainAlert';
import { LogsPanel } from './LogsPanel';

// SIEM Components
import { SocOverview } from './siem/SocOverview';
import { LiveEventsView } from './siem/LiveEventsView';
import { AlertsInvestigationView } from './siem/AlertsInvestigationView';
import { IncidentsView } from './siem/IncidentsView';
import { DevicesView } from './siem/DevicesView';
import { DetectionRulesView } from './siem/DetectionRulesView';
import { ReportsView } from './siem/ReportsView';
import { AttackSimulatorModal } from './siem/AttackSimulatorModal';
import { Dialog } from './ui';

type TabType =
  | 'pcap_monitor'
  | 'pcap_analytics'
  | 'pcap_rules'
  | 'explain'
  | 'logs'
  | 'soc_overview'
  | 'events'
  | 'alerts'
  | 'incidents'
  | 'devices'
  | 'rules'
  | 'reports';

interface AegisDesktopAppProps {
  showWebsiteNavReturn?: boolean;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function AegisDesktopApp({ showWebsiteNavReturn = true }: AegisDesktopAppProps) {
  // Primary default view is the Network IDS Live Monitor
  const [activeTab, setActiveTab] = useState<TabType>('pcap_monitor');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Network IDS State
  const [isRunning, setIsRunning] = useState(false);
  // Ref mirror of isRunning so the stable flushPacketBuffer callback (driven by
  // the periodic interval) can gate on the latest running state. Kept in sync
  // by the effect below and updated synchronously at the start/stop handoff so
  // the gate is correct the instant capture state changes.
  const runningRef = useRef(false);
  const [history, setHistory] = useState<Packet[]>([]);
  const [anomalyScores, setAnomalyScores] = useState<number[]>([]);
  const [totalPackets, setTotalPackets] = useState(0);
  const [attackCounts, setAttackCounts] = useState<Record<AttackCategory, number>>({
    NORMAL: 0,
    DoS: 0,
    Probe: 0,
    R2L: 0,
    U2R: 0
  });
  const [selectedInterface, setSelectedInterface] = useState<string>('any');
  const [packetsPerSecond, setPacketsPerSecond] = useState(2);
  const [interfaces, setInterfaces] = useState<NetworkInterfaceInfo[]>([]);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [latestSecurityAlert, setLatestSecurityAlert] = useState<Packet | null>(null);

  // --- UI-side packet batching ---
  // Incoming IPC packets are buffered and flushed to React state at ~20Hz
  // to prevent the renderer from becoming overwhelmed under high PCAP traffic.
  // The CaptureService/DetectionEngine continue processing at full speed;
  // only the UI update frequency is controlled.
  // MAX_RENDERER_BATCH caps per-flush to prevent a single massive React
  // state update from blocking the renderer event loop.
  const packetBufferRef = useRef<Packet[]>([]);
  const MAX_RENDERER_BATCH = 100;

  // SIEM State
  const [socMetrics, setSocMetrics] = useState<SOCMetrics | null>(null);
  const [siemEvents, setSiemEvents] = useState<SecurityEvent[]>([]);
  const [siemAlerts, setSiemAlerts] = useState<SecurityAlert[]>([]);
  const [siemIncidents, setSiemIncidents] = useState<CorrelatedIncident[]>([]);
  const [monitoredDevices, setMonitoredDevices] = useState<MonitoredDevice[]>([]);
  const [detectionRules, setDetectionRules] = useState<SIEMDetectionRule[]>([]);
  const [isSiemLoading, setIsSiemLoading] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  // Optional download URLs
  const windowsDownloadUrl = (process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL || '').trim();
  const macosDownloadUrl = (process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL || '').trim();
  const linuxDownloadUrl = (process.env.NEXT_PUBLIC_LINUX_DOWNLOAD_URL || '').trim();

  // Clock ticker
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch SIEM Core Data
  const refreshSiemData = useCallback(async () => {
    setIsSiemLoading(true);
    try {
      const [
        metricsRes,
        eventsRes,
        alertsRes,
        incidentsRes,
        devicesRes,
        rulesRes
      ] = await Promise.all([
        fetch('/api/siem/overview').then((r) => r.json()),
        fetch('/api/siem/events?limit=100').then((r) => r.json()),
        fetch('/api/siem/alerts?limit=50').then((r) => r.json()),
        fetch('/api/siem/incidents').then((r) => r.json()),
        fetch('/api/siem/devices').then((r) => r.json()),
        fetch('/api/siem/rules').then((r) => r.json())
      ]);

      if (metricsRes && !metricsRes.error) setSocMetrics(metricsRes);
      if (eventsRes && eventsRes.events) setSiemEvents(eventsRes.events);
      if (alertsRes && alertsRes.alerts) setSiemAlerts(alertsRes.alerts);
      if (incidentsRes && incidentsRes.incidents) setSiemIncidents(incidentsRes.incidents);
      if (devicesRes && devicesRes.devices) setMonitoredDevices(devicesRes.devices);
      if (rulesRes && rulesRes.rules) setDetectionRules(rulesRes.rules);
    } catch (err) {
      console.warn('SIEM Data sync notice:', err);
    } finally {
      setIsSiemLoading(false);
    }
  }, []);

  // Initial load and periodic refresh
  useEffect(() => {
    refreshSiemData();
    const interval = setInterval(refreshSiemData, 10000);
    return () => clearInterval(interval);
  }, [refreshSiemData]);

  // Detect runtime environment (Electron vs Web Browser)
  useEffect(() => {
    const checkEnvironmentAndLoad = async () => {
      const hasElectronApi = typeof window !== 'undefined' && Boolean(window.aegisApi?.isElectron);
      setIsElectron(hasElectronApi);

      try {
        if (hasElectronApi && window.aegisApi) {
          const ifaces = await window.aegisApi.listInterfaces();
          if (ifaces && ifaces.length > 0) {
            setInterfaces(ifaces);
            setSelectedInterface(ifaces[0].id);
          }
          const currentStatus = await window.aegisApi.getStatus();
          if (currentStatus) {
            setEngineStatus(currentStatus);
            setIsRunning(currentStatus.isCapturing);
          }
        } else {
          setInterfaces([]);
          setSelectedInterface('none');
          setEngineStatus({
            isCapturing: false,
            selectedInterface: 'none',
            totalCaptured: 0,
            totalProcessed: 0,
            activeFlows: 0,
            droppedPackets: 0,
            captureMode: 'unavailable',
            privilegeLevel: 'standard',
            statusMessage: 'CAPTURE UNAVAILABLE: Real network interface capture runs natively in Electron via Npcap (Windows) or libpcap (macOS/Linux).'
          });
        }
      } catch (error) {
        console.warn('Could not query network adapters:', error);
      }
    };

    checkEnvironmentAndLoad();
  }, []);

  // Flush the packet buffer into React state (called by the periodic interval
  // and also exposed so we can force-flush on stop).
  const flushPacketBuffer = useCallback(() => {
    const buffer = packetBufferRef.current;
    if (buffer.length === 0) return;

    // Gate: once capture has stopped, anything still buffered is stale traffic
    // captured before/during the stop handshake. Drop the backlog without
    // touching history/counters/anomaly state so the console freezes at the
    // moment capture ends instead of draining stale packets.
    if (!runningRef.current) {
      packetBufferRef.current = [];
      return;
    }

    // Drain up to MAX_RENDERER_BATCH packets per tick.
    // Excess packets remain in the buffer for the next 50ms flush.
    const count = Math.min(MAX_RENDERER_BATCH, buffer.length);
    const packets = buffer.splice(0, count);

    // Compute combined statistics from the batch
    let dosCount = 0;
    let probeCount = 0;
    let r2lCount = 0;
    let u2rCount = 0;
    let normalCount = 0;
    let anomalyCount = 0;
    let lastNonNormal: Packet | null = null;
    const scores: number[] = [];

    for (let i = 0; i < count; i++) {
      const p = packets[i];
      switch (p.category) {
        case 'DoS': dosCount++; break;
        case 'Probe': probeCount++; break;
        case 'R2L': r2lCount++; break;
        case 'U2R': u2rCount++; break;
        default: normalCount++; break;
      }
      if (p.is_anomaly) anomalyCount++;
      scores.push(p.iso_score);
      // Track the latest genuine security detection in this batch
      // IMPORTANT: Only non-NORMAL detections update latestSecurityAlert
      if (p.category !== 'NORMAL') {
        lastNonNormal = p;
      }
    }

    // Single batched state update — one React re-render instead of 5 × N
    // Precompute anomaly count to avoid expensive history.filter() on every render
    setHistory((prev) => {
      const next = [...packets, ...prev];
      return next.length > 500 ? next.slice(0, 500) : next;
    });
    setTotalPackets((prev) => prev + count);
    setAttackCounts((prev) => ({
      NORMAL: prev.NORMAL + normalCount,
      DoS: prev.DoS + dosCount,
      Probe: prev.Probe + probeCount,
      R2L: prev.R2L + r2lCount,
      U2R: prev.U2R + u2rCount,
    }));
    setAnomalyScores((prev) => {
      const next = prev.length > 0 ? [...prev, ...scores] : scores;
      return next.length > 60 ? next.slice(next.length - 60) : next;
    });
    setCaptureError(null);
    // Only update Latest System Alert for genuine security detections
    if (lastNonNormal) {
      setLatestSecurityAlert(lastNonNormal);
    }
  }, []);

  // Keep runningRef in sync with the latest isRunning state.
  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  // Listen to Electron IPC streams when in desktop app
  useEffect(() => {
    if (typeof window !== 'undefined' && window.aegisApi) {
      // Buffer incoming packets; the periodic flush pushes them to React state
      const unsubPacket = window.aegisApi.onPacket((packet: Packet) => {
        packetBufferRef.current.push(packet);
      });

      // Flush the buffer every 50 ms (~20 UI updates per second)
      const flushInterval = setInterval(flushPacketBuffer, 50);

      const unsubStatus = window.aegisApi.onStatus((status: EngineStatus) => {
        setEngineStatus(status);
        setIsRunning(status.isCapturing);
        if (status.errorMessage) {
          setCaptureError(status.errorMessage);
        }
      });

      const unsubError = window.aegisApi.onCaptureError((err: string) => {
        setCaptureError(err);
        setIsRunning(false);
      });

      return () => {
        unsubPacket();
        clearInterval(flushInterval);
        unsubStatus();
        unsubError();
      };
    }
  }, [flushPacketBuffer]);

  const handleToggleMonitoring = async () => {
    setCaptureError(null);
    if (isRunning) {
      // Flush any remaining buffered packets before stopping
      flushPacketBuffer();
      if (typeof window !== 'undefined' && window.aegisApi) {
        await window.aegisApi.stopCapture();
      }
      // Capture has now ended. Discard any packets that arrived while the stop
      // IPC was in flight and gate the periodic flush off immediately so no
      // stale buffered traffic is rendered after Stop. setIsRunning(false)
      // mirrors this into the runningRef via the effect below.
      packetBufferRef.current = [];
      runningRef.current = false;
      setIsRunning(false);
    } else {
      if (!isElectron) {
        setShowDownloadModal(true);
        return;
      }
      if (typeof window !== 'undefined' && window.aegisApi) {
        const result = await window.aegisApi.startCapture(selectedInterface, packetsPerSecond);
        if (result && !result.success) {
          setCaptureError(result.error || result.message || 'Failed to initialize native packet capture');
          setIsRunning(false);
        } else {
          // Mark capturing synchronously so the flush gate never drops the
          // first real packets arriving right after Start resolves.
          runningRef.current = true;
          setIsRunning(true);
        }
      }
    }
  };

  const handleUpdateAlertStatus = async (
    alertId: string,
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
  ) => {
    try {
      await fetch('/api/siem/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, status })
      });
      await refreshSiemData();
    } catch (err) {
      console.error(err);
    }
  };

  const openAlerts = socMetrics?.total_open_alerts ?? siemAlerts.filter((a) => a.status === 'OPEN').length;

  // Navigation model — grouped, per FINAL_AEGIS_UI_BLUEPRINT.md §9.
  const navGroups: NavGroup[] = [
    {
      label: 'Network protection',
      items: [
        { id: 'pcap_monitor', label: 'Live Monitor', icon: Activity },
        { id: 'logs', label: 'Traffic Logs', icon: List },
        { id: 'pcap_analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'pcap_rules', label: 'Detection Engine', icon: Brain }
      ]
    },
    {
      label: 'SOC / endpoints',
      items: [
        { id: 'soc_overview', label: 'SOC Overview', icon: Shield },
        { id: 'alerts', label: 'Alerts & Triage', icon: AlertTriangle, badge: openAlerts },
        { id: 'incidents', label: 'Attack Chains', icon: Layers, badge: siemIncidents.length },
        { id: 'events', label: 'Telemetry Events', icon: Radio },
        { id: 'devices', label: 'Endpoints', icon: Server, badge: socMetrics?.online_devices ?? monitoredDevices.length },
        { id: 'rules', label: 'SIEM Rules', icon: FileCode, badge: detectionRules.length },
        { id: 'reports', label: 'Audit Reports', icon: FileText }
      ]
    }
  ];

  const activeNavLabel = navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ?? 'Live Monitor';

  const renderView = () => {
    switch (activeTab) {
      case 'pcap_monitor':
        return (
          <LiveMonitor
            history={history}
            anomalyScores={anomalyScores}
            totalPackets={totalPackets}
            attackCounts={attackCounts}
            isRunning={isRunning}
            latestSecurityAlert={latestSecurityAlert}
            interfaces={interfaces}
            selectedInterface={selectedInterface}
            onInterfaceChange={setSelectedInterface}
            isElectron={isElectron}
            onToggleMonitoring={handleToggleMonitoring}
            captureError={captureError}
            onOpenDownloadModal={() => setShowDownloadModal(true)}
            onOpenLogs={() => setActiveTab('logs')}
            engineStatus={engineStatus}
          />
        );
      case 'pcap_analytics':
        return <Analytics history={history} />;
      case 'pcap_rules':
        return <DetectionEngineView activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'explain':
        return <ExplainAlert />;
      case 'logs':
        return <LogsPanel history={history} />;
      case 'soc_overview':
        return (
          <SocOverview
            metrics={socMetrics}
            incidents={siemIncidents}
            recentAlerts={siemAlerts}
            onSelectAlert={() => setActiveTab('alerts')}
            onNavigateTab={(t) => setActiveTab(t as TabType)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        );
      case 'events':
        return (
          <LiveEventsView
            events={siemEvents}
            isLoading={isSiemLoading}
            onRefresh={refreshSiemData}
          />
        );
      case 'alerts':
        return (
          <AlertsInvestigationView
            alerts={siemAlerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onRefresh={refreshSiemData}
          />
        );
      case 'incidents':
        return <IncidentsView incidents={siemIncidents} onRefresh={refreshSiemData} />;
      case 'devices':
        return <DevicesView devices={monitoredDevices} onRefresh={refreshSiemData} />;
      case 'rules':
        return <DetectionRulesView rules={detectionRules} />;
      case 'reports':
        return <ReportsView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-canvas text-primary overflow-hidden">
      {/* Slim return strip — web preview only. Never rendered inside the Electron app. */}
      {showWebsiteNavReturn && !isElectron && (
        <div className="shrink-0 bg-canvas-deep border-b border-hairline px-4 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-caption text-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to public product website
            </Link>
            <span className="text-micro text-faint">|</span>
            <Chip tone="neutral" className="font-normal">Web preview — full packet capture requires the desktop app</Chip>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/documentation"
              className="text-caption text-muted hover:text-primary transition-colors whitespace-nowrap"
            >
              Documentation
            </Link>
            <Link
              href="/downloads"
              className="text-caption text-accent hover:text-accent-hover font-medium transition-colors whitespace-nowrap"
            >
              Get desktop runner
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* ───────────────── Sidebar ───────────────── */}
        <aside className="w-[232px] shrink-0 bg-surface-1 border-r border-hairline flex flex-col min-h-0">
          <div className="h-14 shrink-0 flex items-center gap-2.5 px-4 border-b border-hairline">
            <div className="flex items-center justify-center w-7 h-7 rounded-control bg-accent/15 text-accent">
              <Shield className="w-4 h-4" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-subtitle font-semibold tracking-tight text-primary truncate">Aegis</div>
              <div className="text-micro text-muted truncate">Network IDS console</div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2 pb-1.5 text-micro text-faint">{group.label}</div>
                <div className="space-y-0.5">
                  {group.items.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`tab-btn-${tab.id}`}
                        suppressHydrationWarning
                        onClick={() => setActiveTab(tab.id as TabType)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-control px-2.5 h-8 text-caption font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                          isActive
                            ? 'bg-accent-soft text-accent'
                            : 'text-muted hover:text-primary hover:bg-surface-2'
                        )}
                      >
                        <tab.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-muted')} />
                        <span className="flex-1 text-left truncate">{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <span className="px-1.5 py-0.5 rounded-well bg-surface-3 text-micro text-secondary font-medium tabular-nums shrink-0">
                            {tab.badge > 999 ? '999+' : tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="shrink-0 px-4 py-3 border-t border-hairline space-y-1">
            <div className="flex items-center gap-1.5 text-micro text-muted">
              <Chip tone="neutral" className="gap-1.5 !py-0.5 !px-2 text-micro">
                {isElectron ? 'Native capture' : 'Web preview'}
              </Chip>
            </div>
            <div className="text-micro text-faint">Aegis AI — Network IDS v2.0</div>
          </div>
        </aside>

        {/* ───────────────── Main column ───────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top app bar */}
          <header className="shrink-0 h-14 bg-surface-1/95 border-b border-hairline flex items-center justify-between gap-4 px-5">
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-subtitle font-semibold text-primary tracking-tight truncate">{activeNavLabel}</h1>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="hidden md:flex items-center gap-2.5 mr-1">
                <Chip tone={isRunning ? 'success' : 'neutral'} dot className="font-medium">
                  {isRunning ? 'PCAP capturing' : 'IDS standby'}
                </Chip>
                <div className="flex items-center gap-1 text-micro text-muted tabular-nums font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'} UTC
                </div>
              </div>

              <Button
                id="download-desktop-btn"
                suppressHydrationWarning
                variant="tertiary"
                className="hidden lg:inline-flex text-caption"
                onClick={() => setShowDownloadModal(true)}
              >
                <Download className="w-3.5 h-3.5" />
                Desktop runner
              </Button>

              <IconButton label={isSiemLoading ? 'Refreshing telemetry' : 'Refresh telemetry data'} onClick={() => refreshSiemData()} disabled={isSiemLoading}>
                <RefreshCw className={cn('w-4 h-4', isSiemLoading && 'animate-spin')} />
              </IconButton>

              <Button variant="secondary" size="sm" onClick={() => setIsSimulatorOpen(true)} title="Run simulated security scenarios">
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Attack Simulator</span>
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{renderView()}</div>
          </main>
        </div>
      </div>

      {/* Attack Simulator Modal */}
      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={refreshSiemData}
      />

      {/* Download Desktop App Modal */}
      {showDownloadModal && (
        <Dialog
          onClose={() => setShowDownloadModal(false)}
          eyebrow="Desktop & endpoint agent"
          title="Run capture natively"
          footer={
            <Button variant="secondary" onClick={() => setShowDownloadModal(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-5">
            <p className="text-body text-secondary leading-relaxed">
              Real promiscuous packet capture and the local endpoint agent run inside the native desktop app.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Windows', meta: '.exe installer', url: windowsDownloadUrl },
                { label: 'macOS', meta: '.dmg universal', url: macosDownloadUrl },
                { label: 'Linux', meta: 'Agent / AppImage', url: linuxDownloadUrl }
              ].map((os) => (
                <div key={os.label} className="flex flex-col items-center gap-2 p-4 rounded-card border border-hairline bg-surface-1 text-center">
                  <div className="w-9 h-9 rounded-control bg-surface-2 text-muted flex items-center justify-center">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-caption font-semibold text-primary">{os.label}</div>
                    <div className="text-micro text-muted">{os.meta}</div>
                  </div>
                  {os.url ? (
                    <a
                      href={os.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 h-7 px-3 rounded-control bg-accent text-white text-caption font-medium hover:bg-accent-hover transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  ) : (
                    <span className="mt-1 px-3 py-1.5 rounded-control bg-surface-2 border border-hairline text-micro text-faint">
                      Available in repo
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-card border border-hairline bg-surface-1 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-caption font-semibold text-primary">
                <Terminal className="w-4 h-4 text-muted" />
                Running the local endpoint agent
              </div>
              <p className="text-caption text-secondary leading-relaxed">
                Stream genuine local auth / syslog telemetry to this console:
              </p>
              <pre className="px-3 py-2.5 rounded-well bg-canvas-deep border border-hairline font-mono text-micro text-success overflow-x-auto">
                python3 agent/agent.py --server http://localhost:3000 --interval 2
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Detection Engine — one nav item, two internal segments              */
/* ------------------------------------------------------------------ */

function DetectionEngineView({
  activeTab,
  setActiveTab
}: {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
}) {
  const segment: 'overview' | 'explain' = activeTab === 'explain' ? 'explain' : 'overview';
  return (
    <div className="space-y-5">
      <div className="inline-flex items-center gap-1 p-1 rounded-control bg-surface-2 border border-hairline">
        <button
          id="tab-btn-pcap_rules"
          suppressHydrationWarning
          onClick={() => setActiveTab('pcap_rules')}
          className={cn(
            'h-7 px-3 rounded-[6px] text-caption font-medium transition-colors focus-visible:outline-none',
            segment === 'overview'
              ? 'bg-surface-3 text-primary shadow-none'
              : 'text-muted hover:text-primary'
          )}
        >
          Engine overview
        </button>
        <button
          id="tab-btn-explain"
          suppressHydrationWarning
          onClick={() => setActiveTab('explain')}
          className={cn(
            'h-7 px-3 rounded-[6px] text-caption font-medium transition-colors focus-visible:outline-none',
            segment === 'explain'
              ? 'bg-surface-3 text-primary'
              : 'text-muted hover:text-primary'
          )}
        >
          Explain a detection
        </button>
      </div>
      {segment === 'overview' ? <ModelPerformance /> : <ExplainAlert />}
    </div>
  );
}

export default AegisDesktopApp;
