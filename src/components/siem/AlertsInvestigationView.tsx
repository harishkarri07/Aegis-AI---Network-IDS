'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  Server,
  User,
  Radio,
  FileText,
  Zap,
  HelpCircle
} from 'lucide-react';
import { SecurityAlert } from '@/types';

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
    <div className="space-y-4">
      {/* Filter / Search Bar */}
      <div className="p-4 bg-[#111827] border border-[#1e3a5f] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#7090b0] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search alerts by title, rule ID, host, or source IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-white placeholder-[#7090b0] focus:outline-none focus:border-[#00d4ff]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-[#b0c4de] focus:outline-none focus:border-[#00d4ff]"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-[#b0c4de] focus:outline-none focus:border-[#00d4ff]"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* 2-Column Investigation Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Alerts List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredAlerts.map((alert) => {
            const isSelected = selectedAlert?.alert_id === alert.alert_id;
            const isCrit = alert.severity === 'CRITICAL';
            const isHigh = alert.severity === 'HIGH';
            const badgeColor = isCrit
              ? 'bg-[#ff3366] text-[#0a0e1a]'
              : isHigh
              ? 'bg-[#ffaa00] text-[#0a0e1a]'
              : 'bg-[#00d4ff] text-[#0a0e1a]';

            return (
              <div
                key={alert.alert_id}
                onClick={() => setSelectedAlert(alert)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1e293b] border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                    : 'bg-[#111827] border-[#1e3a5f] hover:border-[#7090b0]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badgeColor}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-mono text-[#7090b0]">
                      {alert.rule_id}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    alert.status === 'OPEN'
                      ? 'border-[#ff3366]/40 text-[#ff3366] bg-[#ff3366]/10'
                      : alert.status === 'ACKNOWLEDGED'
                      ? 'border-[#ffaa00]/40 text-[#ffaa00] bg-[#ffaa00]/10'
                      : 'border-[#00ff88]/40 text-[#00ff88] bg-[#00ff88]/10'
                  }`}>
                    {alert.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-2">
                  {alert.title}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-[#7090b0]">
                  <span className="flex items-center gap-1 font-mono">
                    <Server className="w-3 h-3 text-[#00d4ff]" />
                    {alert.hostname}
                  </span>
                  <span>
                    Events: <strong className="text-white">{alert.event_count}</strong>
                  </span>
                  <span className="font-mono">
                    {alert.last_seen.substring(11, 19)} UTC
                  </span>
                </div>
              </div>
            );
          })}

          {filteredAlerts.length === 0 && (
            <div className="p-8 bg-[#111827] border border-[#1e3a5f] rounded-xl text-center text-xs text-[#7090b0]">
              No alerts found matching filter.
            </div>
          )}
        </div>

        {/* Right Column: Deep Alert Investigation Drawer (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="bg-[#111827] border border-[#1e3a5f] p-6 rounded-xl space-y-6">
              {/* Header & Status Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e3a5f] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded bg-[#1e3a5f] text-[#00d4ff] text-xs font-mono font-bold">
                      {selectedAlert.alert_id}
                    </span>
                    <span className="text-xs text-[#7090b0] font-mono">
                      Rule: {selectedAlert.rule_id}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-white">
                    {selectedAlert.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleStatusChange('ACKNOWLEDGED')}
                    disabled={isUpdating || selectedAlert.status === 'ACKNOWLEDGED'}
                    className="px-3 py-1.5 bg-[#ffaa00]/10 hover:bg-[#ffaa00]/20 text-[#ffaa00] border border-[#ffaa00]/30 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    disabled={isUpdating || selectedAlert.status === 'RESOLVED'}
                    className="px-3 py-1.5 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                  >
                    Resolve
                  </button>
                  {selectedAlert.status !== 'OPEN' && (
                    <button
                      onClick={() => handleStatusChange('OPEN')}
                      disabled={isUpdating}
                      className="px-2.5 py-1.5 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold"
                    >
                      Re-open
                    </button>
                  )}
                </div>
              </div>

              {/* "Why did this alert fire?" Section */}
              <div className="p-4 bg-[#0a0e1a] border border-[#00d4ff]/30 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-[#00d4ff] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Why Did This Alert Fire? (Detection Rationale)
                </h4>
                <p className="text-xs text-[#b0c4de] leading-relaxed">
                  {selectedAlert.description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                  <div className="p-2 bg-[#111827] rounded border border-[#1e3a5f]">
                    <span className="text-[10px] text-[#7090b0] font-bold uppercase block">Risk Score</span>
                    <span className="text-lg font-black text-[#ff3366]">{selectedAlert.risk_score}/100</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1e3a5f]">
                    <span className="text-[10px] text-[#7090b0] font-bold uppercase block">Event Count</span>
                    <span className="text-lg font-black text-white">{selectedAlert.event_count}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1e3a5f]">
                    <span className="text-[10px] text-[#7090b0] font-bold uppercase block">MITRE Technique</span>
                    <span className="text-xs font-mono font-bold text-[#00d4ff] block mt-1">
                      {selectedAlert.mitre_technique || 'N/A'}
                    </span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-[#1e3a5f]">
                    <span className="text-[10px] text-[#7090b0] font-bold uppercase block">MITRE Tactic</span>
                    <span className="text-xs font-bold text-white block mt-1">
                      {selectedAlert.mitre_tactic || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Matched Rule Conditions */}
              <div>
                <h4 className="text-xs font-bold text-[#7090b0] uppercase tracking-wider mb-2">
                  Matched Engine Conditions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedAlert.matched_conditions || []).map((cond, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-[#1e3a5f]/40 border border-[#1e3a5f] rounded text-xs font-mono text-[#00ff88]"
                    >
                      {cond}
                    </span>
                  ))}
                  {(!selectedAlert.matched_conditions || selectedAlert.matched_conditions.length === 0) && (
                    <span className="text-xs text-[#7090b0] italic">
                      Standard threshold criteria met.
                    </span>
                  )}
                </div>
              </div>

              {/* Actionable Recommendation */}
              <div className="p-4 bg-[#1e293b]/60 border border-[#1e3a5f] rounded-xl space-y-2">
                <h4 className="text-xs font-black text-[#00ff88] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Recommended SOC Analyst Remediation
                </h4>
                <p className="text-xs text-[#b0c4de] leading-relaxed">
                  {selectedAlert.recommendation}
                </p>
              </div>

              {/* Evidence & Context Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Target Hostname</span>
                  <span className="font-mono text-white text-xs">{selectedAlert.hostname}</span>
                  <span className="text-[10px] text-[#7090b0] block pt-1">
                    Device ID: <code className="text-[#00d4ff]">{selectedAlert.device_id}</code>
                  </span>
                </div>

                <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Attacker Source IP</span>
                  <span className="font-mono text-[#00d4ff] text-xs">
                    {selectedAlert.source_ip || 'Internal / Local'}
                  </span>
                  <span className="text-[10px] text-[#7090b0] block pt-1">
                    Target User: <strong className="text-white">{selectedAlert.username || 'System'}</strong>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-[#111827] border border-[#1e3a5f] rounded-xl text-center text-xs text-[#7090b0]">
              Select an alert from the list on the left to review investigation details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
