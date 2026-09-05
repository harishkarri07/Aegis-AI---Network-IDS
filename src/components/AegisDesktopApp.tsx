'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Activity,
  BarChart3,
  Brain,
  Search,
  List,
  Play,
  Square,
  Clock,
  Download,
  AlertTriangle,
  Laptop,
  Terminal,
  X,
  Layers,
  Server,
  FileCode,
  FileText,
  Zap,
  Radio,
  RefreshCw,
  ArrowLeft,
  ExternalLink
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

export function AegisDesktopApp({ showWebsiteNavReturn = true }: AegisDesktopAppProps) {
  // Primary default view is the Network IDS Live Monitor
  const [activeTab, setActiveTab] = useState<TabType>('pcap_monitor');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Network IDS State
  const [isRunning, setIsRunning] = useState(false);
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

  const tabs = [
    { id: 'pcap_monitor', label: 'Live Monitor', icon: Activity },
    { id: 'pcap_analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'pcap_rules', label: 'Detection Engine', icon: Brain },
    { id: 'explain', label: 'Explain Alert', icon: Search },
    { id: 'logs', label: 'Traffic Logs', icon: List, badge: history.length > 0 ? history.length : undefined },
    { id: 'soc_overview', label: 'SOC Command', icon: Shield },
    { id: 'events', label: 'Telemetry Logs', icon: Radio, badge: siemEvents.length },
    {
      id: 'alerts',
      label: 'Alerts & Triage',
      icon: AlertTriangle,
      badge: socMetrics?.total_open_alerts || siemAlerts.filter((a) => a.status === 'OPEN').length
    },
    {
      id: 'incidents',
      label: 'Attack Chains',
      icon: Layers,
      badge: siemIncidents.length,
      badgeColor: 'bg-[#ff3366]'
    },
    { id: 'devices', label: 'Endpoints', icon: Server, badge: socMetrics?.online_devices || monitoredDevices.length },
    { id: 'rules', label: 'SIEM Rules', icon: FileCode, badge: detectionRules.length },
    { id: 'reports', label: 'Audit Reports', icon: FileText }
  ];

  return (
    <div className="min-h-screen flex flex-col text-[#e0e6f0] bg-[#0a0e1a]">
      {/* Top Navigation / Breadcrumb to Website */}
      {showWebsiteNavReturn && (
        <div className="bg-[#070b14] border-b border-[#1e293b] px-6 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[#7090b0] hover:text-[#00d4ff] font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Product Website</span>
            </Link>
            <span className="text-[#1e293b]">|</span>
            <span className="text-[#00d4ff] font-mono text-[11px] font-bold">
              OPERATIONAL ENVIRONMENT: {isElectron ? 'ELECTRON NATIVE (LOCAL IDS)' : 'SOC WEB CONSOLE PREVIEW'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/documentation"
              className="text-[#7090b0] hover:text-white transition-colors text-[11px]"
            >
              Docs &amp; Setup Guide
            </Link>
            <Link
              href="/downloads"
              className="px-2.5 py-1 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 rounded text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Get Desktop Runner
            </Link>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-[#0d1220] border-b border-[#1e3a5f] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#00d4ff]/10 p-2 rounded-lg border border-[#00d4ff]/30">
            <Shield className="w-6 h-6 text-[#00d4ff]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black neon-gradient-text tracking-tighter uppercase">
                Aegis AI — Network IDS
              </h1>
              <span className="px-2 py-0.5 bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-[10px] font-bold rounded uppercase">
                v2.0 Core
              </span>
            </div>
            <p className="text-[10px] text-[#7090b0] font-bold uppercase tracking-widest">
              High-Performance Stateful 5-Tuple Network Traffic Classifier &amp; Host Telemetry SIEM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="flex items-center gap-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Attack Simulator
          </button>

          <button
            onClick={() => refreshSiemData()}
            disabled={isSiemLoading}
            className="flex items-center gap-1.5 bg-[#1e3a5f]/60 hover:bg-[#1e3a5f] text-[#b0c4de] px-2.5 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-50"
            title="Refresh SIEM Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSiemLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="download-desktop-btn"
            suppressHydrationWarning
            onClick={() => setShowDownloadModal(true)}
            className="hidden sm:flex items-center gap-2 bg-[#1e3a5f]/60 hover:bg-[#1e3a5f] text-white border border-[#1e3a5f] px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Desktop Runner &amp; Agent
          </button>

          <div className="hidden md:flex flex-col items-end border-l border-[#1e3a5f] pl-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#00ff88] animate-pulse' : 'bg-[#7090b0]'}`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${isRunning ? 'text-[#00ff88]' : 'text-[#7090b0]'}`}>
                {isRunning ? 'PCAP Capturing Active' : 'IDS Standby'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#7090b0] font-mono">
              <Clock className="w-3 h-3" />
              {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'} UTC
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="bg-[#0f172a] border-b border-[#1e3a5f] px-6">
        <div className="flex max-w-7xl mx-auto overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                suppressHydrationWarning
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#00d4ff] text-[#00d4ff] bg-[#00d4ff]/5'
                    : 'border-transparent text-[#7090b0] hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded text-[10px] font-black ${
                      tab.badgeColor ? `${tab.badgeColor} text-white` : 'bg-[#1e3a5f] text-[#00d4ff]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* 1. Network IDS: Live Monitor */}
        {activeTab === 'pcap_monitor' && (
          <div className="space-y-6">
            <div className="p-4 bg-[#111827] border border-[#1e3a5f] rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-[#7090b0] uppercase">
                  Network Interface
                </span>
                <select
                  id="traffic-interface-select"
                  suppressHydrationWarning
                  value={selectedInterface}
                  onChange={(e) => setSelectedInterface(e.target.value)}
                  className="bg-[#0a0e1a] border border-[#1e3a5f] rounded-md px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00d4ff]"
                >
                  {interfaces.length > 0 ? (
                    interfaces.map((iface) => (
                      <option key={iface.id} value={iface.id}>
                        {iface.name}
                      </option>
                    ))
                  ) : (
                    <option value="any">No Network Adapters Detected</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-3">
                {!isRunning ? (
                  <button
                    id="start-monitoring-btn"
                    suppressHydrationWarning
                    onClick={handleToggleMonitoring}
                    className="flex items-center gap-2 bg-[#00ff88] text-[#0a0e1a] px-4 py-1.5 rounded-md font-bold text-xs hover:bg-white transition-all glow-green"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Start PCAP Capture
                  </button>
                ) : (
                  <button
                    id="stop-system-btn"
                    suppressHydrationWarning
                    onClick={handleToggleMonitoring}
                    className="flex items-center gap-2 bg-[#ff3333] text-white px-4 py-1.5 rounded-md font-bold text-xs hover:bg-white hover:text-[#0a0e1a] transition-all glow-red"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    Stop PCAP Capture
                  </button>
                )}
              </div>
            </div>

            {captureError && (
              <div className="p-4 bg-red-950/40 border border-red-500/50 rounded-xl text-red-300 text-xs font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <div>
                  <strong className="text-white">CAPTURE UNAVAILABLE: </strong>
                  {captureError}
                </div>
              </div>
            )}

            <LiveMonitor
              history={history}
              anomalyScores={anomalyScores}
              totalPackets={totalPackets}
              attackCounts={attackCounts}
              isRunning={isRunning}
              latestSecurityAlert={latestSecurityAlert}
            />
          </div>
        )}

        {/* 2. Network IDS: Analytics */}
        {activeTab === 'pcap_analytics' && (
          <Analytics history={history} />
        )}

        {/* 3. Network IDS: Detection Engine & Model Performance */}
        {activeTab === 'pcap_rules' && (
          <ModelPerformance />
        )}

        {/* 4. Network IDS: Explain Alert Vector */}
        {activeTab === 'explain' && (
          <ExplainAlert />
        )}

        {/* 5. Network IDS: Traffic Inspection Logs */}
        {activeTab === 'logs' && (
          <LogsPanel history={history} />
        )}

        {/* 6. SIEM: SOC Overview */}
        {activeTab === 'soc_overview' && (
          <SocOverview
            metrics={socMetrics}
            incidents={siemIncidents}
            recentAlerts={siemAlerts}
            onSelectAlert={() => setActiveTab('alerts')}
            onNavigateTab={(t) => setActiveTab(t as TabType)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
          />
        )}

        {/* 7. SIEM: Live Telemetry Events */}
        {activeTab === 'events' && (
          <LiveEventsView
            events={siemEvents}
            isLoading={isSiemLoading}
            onRefresh={refreshSiemData}
          />
        )}

        {/* 8. SIEM: Security Alerts Investigation */}
        {activeTab === 'alerts' && (
          <AlertsInvestigationView
            alerts={siemAlerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onRefresh={refreshSiemData}
          />
        )}

        {/* 9. SIEM: Correlated Incidents */}
        {activeTab === 'incidents' && (
          <IncidentsView
            incidents={siemIncidents}
            onRefresh={refreshSiemData}
          />
        )}

        {/* 10. SIEM: Monitored Endpoints */}
        {activeTab === 'devices' && (
          <DevicesView
            devices={monitoredDevices}
            onRefresh={refreshSiemData}
          />
        )}

        {/* 11. SIEM: Detection Rules Repository */}
        {activeTab === 'rules' && (
          <DetectionRulesView rules={detectionRules} />
        )}

        {/* 12. SIEM: Reports & Compliance */}
        {activeTab === 'reports' && (
          <ReportsView />
        )}
      </main>

      {/* Attack Simulator Modal */}
      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onSuccess={refreshSiemData}
      />

      {/* Download Desktop App Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1220] border border-[#1e3a5f] rounded-xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowDownloadModal(false)}
              className="text-[#7090b0] hover:text-white transition-colors absolute top-4 right-4"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="bg-[#00d4ff]/10 p-3 rounded-lg border border-[#00d4ff]/30">
                <Laptop className="w-6 h-6 text-[#00d4ff]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Desktop IDS &amp; Endpoint Agent
                </h3>
                <p className="text-xs text-[#7090b0]">
                  Connect external Linux/Windows endpoints or run real-time promiscuous PCAP capture natively.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Windows Card */}
              <div className="flex flex-col items-center justify-between p-4 bg-[#111827] border border-[#1e3a5f] rounded-lg text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-2">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-white">Windows</span>
                  <span className="text-[10px] text-[#7090b0] mb-3">.exe Installer</span>
                </div>
                {windowsDownloadUrl ? (
                  <a
                    href={windowsDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#00d4ff] hover:bg-white text-[#0a0e1a] rounded text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Windows
                  </a>
                ) : (
                  <div className="w-full py-1.5 px-3 bg-[#1e3a5f]/40 border border-[#1e3a5f] text-[#7090b0] rounded text-xs font-semibold uppercase tracking-wider">
                    Available in Repo
                  </div>
                )}
              </div>

              {/* macOS Card */}
              <div className="flex flex-col items-center justify-between p-4 bg-[#111827] border border-[#1e3a5f] rounded-lg text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-2">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-white">macOS</span>
                  <span className="text-[10px] text-[#7090b0] mb-3">.dmg Universal</span>
                </div>
                {macosDownloadUrl ? (
                  <a
                    href={macosDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#00d4ff] hover:bg-white text-[#0a0e1a] rounded text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download macOS
                  </a>
                ) : (
                  <div className="w-full py-1.5 px-3 bg-[#1e3a5f]/40 border border-[#1e3a5f] text-[#7090b0] rounded text-xs font-semibold uppercase tracking-wider">
                    Available in Repo
                  </div>
                )}
              </div>

              {/* Linux Card */}
              <div className="flex flex-col items-center justify-between p-4 bg-[#111827] border border-[#1e3a5f] rounded-lg text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#00d4ff]/10 flex items-center justify-center text-[#00d4ff] mb-2">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-white">Linux</span>
                  <span className="text-[10px] text-[#7090b0] mb-3">Agent / AppImage</span>
                </div>
                {linuxDownloadUrl ? (
                  <a
                    href={linuxDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#00d4ff] hover:bg-white text-[#0a0e1a] rounded text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Linux
                  </a>
                ) : (
                  <div className="w-full py-1.5 px-3 bg-[#1e3a5f]/40 border border-[#1e3a5f] text-[#7090b0] rounded text-xs font-semibold uppercase tracking-wider">
                    Available in Repo
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#111827] p-4 rounded-lg border border-[#1e3a5f] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                <Terminal className="w-4 h-4 text-[#00ff88]" />
                Running the Local Endpoint Agent
              </div>
              <p className="text-xs text-[#b0c4de]">
                To stream genuine local auth/syslog telemetry directly to this SIEM, run:
              </p>
              <pre className="p-2.5 bg-[#0a0e1a] rounded border border-[#1e3a5f] font-mono text-xs text-[#00ff88]">
                python3 agent/agent.py --server http://localhost:3000 --interval 2
              </pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-md text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0d1220] border-t border-[#1e3a5f] px-6 py-3 flex items-center justify-between text-[10px] text-[#7090b0] font-bold uppercase tracking-widest">
        <div>© 2026 Aegis Cyber-Defense Systems. Real-Time Network Intrusion Detection.</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            5-Tuple Packet Classifier: Active
          </span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
            SQLite WAL Database: Online
          </span>
        </div>
      </footer>
    </div>
  );
}

export default AegisDesktopApp;
