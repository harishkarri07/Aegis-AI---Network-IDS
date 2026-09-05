'use client';

import React from 'react';
import {
  ShieldAlert,
  Server,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Layers,
  Terminal,
  Zap
} from 'lucide-react';
import { SOCMetrics, CorrelatedIncident, SecurityAlert } from '@/types';

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

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical Incidents exist */}
      {incidents.length > 0 && (
        <div className="p-4 bg-[#ff3366]/10 border border-[#ff3366]/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff3366]/20 rounded-lg text-[#ff3366]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#ff3366] text-[#0a0e1a] text-[10px] font-black uppercase rounded tracking-wider">
                  Critical Multi-Stage Incident
                </span>
                <span className="text-xs font-bold text-[#ff3366]">
                  {incidents[0].title}
                </span>
              </div>
              <p className="text-xs text-[#b0c4de] mt-0.5">
                {incidents[0].summary}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('incidents')}
            className="px-3.5 py-1.5 bg-[#ff3366] hover:bg-white text-[#0a0e1a] text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
          >
            Investigate Incident
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingested Events */}
        <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider">
              Ingested Telemetry
            </span>
            <div className="p-1.5 bg-[#00d4ff]/10 text-[#00d4ff] rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {totalEvents.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#00ff88] font-bold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-[#7090b0] mt-1">Normalized endpoint events</p>
        </div>

        {/* Monitored Endpoints */}
        <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider">
              Monitored Endpoints
            </span>
            <div className="p-1.5 bg-[#00ff88]/10 text-[#00ff88] rounded-lg">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {onlineDevices}
            </span>
            <span className="text-xs text-[#7090b0] font-semibold">
              / {totalDevices} Registered
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span className="text-[#00ff88] font-medium">Heartbeat healthy</span>
          </div>
        </div>

        {/* Open Security Alerts */}
        <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider">
              Active Alerts
            </span>
            <div className="p-1.5 bg-[#ffaa00]/10 text-[#ffaa00] rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#ffaa00]">
              {openAlerts}
            </span>
            <span className="text-xs text-[#7090b0] font-semibold">Open</span>
          </div>
          <p className="text-[11px] text-[#7090b0] mt-1">
            Requiring analyst triage
          </p>
        </div>

        {/* Critical Threat Tally */}
        <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider">
              Critical Severity
            </span>
            <div className="p-1.5 bg-[#ff3366]/10 text-[#ff3366] rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#ff3366]">
              {criticalAlerts}
            </span>
            <span className="text-xs text-[#ff3366] font-semibold">Urgent</span>
          </div>
          <p className="text-[11px] text-[#7090b0] mt-1">
            High-risk security detections
          </p>
        </div>
      </div>

      {/* Main SOC Dashboard 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Severity Breakdown & Top Target Hosts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Threat Distribution Card */}
          <div className="bg-[#111827] border border-[#1e3a5f] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00d4ff]" />
                  Threat Severity Distribution
                </h3>
                <p className="text-xs text-[#7090b0] mt-0.5">
                  Breakdown of generated security alerts by risk tier
                </p>
              </div>
              <button
                onClick={onOpenSimulator}
                className="px-3 py-1.5 bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-[#00d4ff]" />
                Simulate Scenario
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-[#ff3366]/10 border border-[#ff3366]/30 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-[#ff3366]">
                  Critical
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {sevDist.CRITICAL || 0}
                </div>
                <div className="text-[10px] text-[#7090b0] mt-0.5">Risk &ge; 90</div>
              </div>
              <div className="p-3 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-[#ffaa00]">
                  High
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {sevDist.HIGH || 0}
                </div>
                <div className="text-[10px] text-[#7090b0] mt-0.5">Risk 70-89</div>
              </div>
              <div className="p-3 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-[#00d4ff]">
                  Medium
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {sevDist.MEDIUM || 0}
                </div>
                <div className="text-[10px] text-[#7090b0] mt-0.5">Risk 40-69</div>
              </div>
              <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-center">
                <span className="text-[10px] uppercase font-bold text-[#00ff88]">
                  Low / Info
                </span>
                <div className="text-2xl font-black text-white mt-1">
                  {sevDist.LOW || 0}
                </div>
                <div className="text-[10px] text-[#7090b0] mt-0.5">Risk 0-39</div>
              </div>
            </div>

            {/* Event Taxonomy Bar */}
            <div className="mt-5 pt-4 border-t border-[#1e3a5f]/60">
              <span className="text-[11px] font-bold text-[#7090b0] uppercase tracking-wider block mb-2">
                Ingested Event Taxonomy Breakdown
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(metrics?.event_type_distribution || {}).map(([type, count]) => (
                  <div
                    key={type}
                    className="px-2.5 py-1 bg-[#1e3a5f]/40 border border-[#1e3a5f] rounded text-xs text-[#b0c4de] flex items-center gap-1.5"
                  >
                    <span className="capitalize font-semibold text-white">{type}:</span>
                    <span className="text-[#00d4ff] font-bold">{count}</span>
                  </div>
                ))}
                {(!metrics?.event_type_distribution || Object.keys(metrics.event_type_distribution).length === 0) && (
                  <span className="text-xs text-[#7090b0] italic">
                    Awaiting endpoint telemetry streams...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Top Threat Sources & Monitored Assets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Top Source IPs */}
            <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#ffaa00]" />
                Top Originating Threat IPs
              </h4>
              <div className="space-y-2">
                {(metrics?.top_source_ips || []).map((ip, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-[#1e3a5f]/50 rounded-lg text-xs"
                  >
                    <span className="font-mono text-[#00d4ff] font-semibold">
                      {ip.ip}
                    </span>
                    <span className="px-2 py-0.5 bg-[#1e3a5f] text-white font-bold rounded text-[11px]">
                      {ip.count} events
                    </span>
                  </div>
                ))}
                {(!metrics?.top_source_ips || metrics.top_source_ips.length === 0) && (
                  <p className="text-xs text-[#7090b0] italic py-2">
                    No malicious external IPs logged yet.
                  </p>
                )}
              </div>
            </div>

            {/* Top Affected Hosts */}
            <div className="bg-[#111827] border border-[#1e3a5f] p-4 rounded-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-[#00ff88]" />
                Top Monitored Host Activity
              </h4>
              <div className="space-y-2">
                {(metrics?.top_affected_hosts || []).map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-[#0a0e1a] border border-[#1e3a5f]/50 rounded-lg text-xs"
                  >
                    <span className="font-mono text-white font-medium">
                      {h.hostname}
                    </span>
                    <span className="px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30 font-bold rounded text-[11px]">
                      {h.count} events
                    </span>
                  </div>
                ))}
                {(!metrics?.top_affected_hosts || metrics.top_affected_hosts.length === 0) && (
                  <p className="text-xs text-[#7090b0] italic py-2">
                    No endpoint telemetry logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Alerts Feed */}
        <div className="bg-[#111827] border border-[#1e3a5f] p-5 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#ffaa00]" />
                Recent Security Alerts
              </h3>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-xs font-bold text-[#00d4ff] hover:underline"
              >
                View All &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {recentAlerts.slice(0, 5).map((alert) => {
                const isCrit = alert.severity === 'CRITICAL';
                const isHigh = alert.severity === 'HIGH';
                const badgeBg = isCrit
                  ? 'bg-[#ff3366] text-[#0a0e1a]'
                  : isHigh
                  ? 'bg-[#ffaa00] text-[#0a0e1a]'
                  : 'bg-[#00d4ff] text-[#0a0e1a]';

                return (
                  <div
                    key={alert.alert_id}
                    onClick={() => onSelectAlert(alert)}
                    className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] hover:border-[#00d4ff] rounded-lg cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeBg}`}>
                        {alert.severity} ({alert.risk_score})
                      </span>
                      <span className="text-[10px] text-[#7090b0] font-mono">
                        {alert.last_seen.substring(11, 19)} UTC
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">
                      {alert.title}
                    </h5>
                    <div className="flex items-center justify-between text-[11px] text-[#7090b0]">
                      <span>Host: <code className="text-[#00d4ff]">{alert.hostname}</code></span>
                      <span>Count: <strong className="text-white">{alert.event_count}</strong></span>
                    </div>
                  </div>
                );
              })}

              {recentAlerts.length === 0 && (
                <div className="py-8 text-center text-xs text-[#7090b0]">
                  No active alerts. System telemetry is within normal security thresholds.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#1e3a5f]">
            <div className="flex items-center justify-between text-xs text-[#7090b0]">
              <span>Engine Status:</span>
              <span className="text-[#00ff88] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
                Real-Time Stateful IDS Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
