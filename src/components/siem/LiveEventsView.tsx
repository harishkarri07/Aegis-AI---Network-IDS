'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  Shield,
  Clock,
  Terminal,
  Server,
  User,
  Radio,
  FileCode
} from 'lucide-react';
import { SecurityEvent } from '@/types';

interface LiveEventsViewProps {
  events: SecurityEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const LiveEventsView: React.FC<LiveEventsViewProps> = ({
  events,
  isLoading,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filteredEvents = events.filter((ev) => {
    if (typeFilter !== 'ALL' && ev.event_type.toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'ALL' && ev.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchRaw = ev.raw_message?.toLowerCase().includes(q);
      const matchHost = ev.hostname?.toLowerCase().includes(q);
      const matchUser = ev.username?.toLowerCase().includes(q);
      const matchIp = ev.source_ip?.toLowerCase().includes(q);
      if (!matchRaw && !matchHost && !matchUser && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Control / Filter Bar */}
      <div className="p-4 bg-[#111827] border border-[#1e3a5f] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7090b0] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by log text, hostname, username, or source IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-white placeholder-[#7090b0] focus:outline-none focus:border-[#00d4ff]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-[#b0c4de] focus:outline-none focus:border-[#00d4ff]"
          >
            <option value="ALL">All Event Types</option>
            <option value="authentication">Authentication</option>
            <option value="privilege">Privilege (Sudo/Su)</option>
            <option value="connection">Connection / Scan</option>
            <option value="process">Process Execution</option>
            <option value="audit">Audit / Resource</option>
            <option value="system">System Logs</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-xs text-[#b0c4de] focus:outline-none focus:border-[#00d4ff]"
          >
            <option value="ALL">All Statuses</option>
            <option value="failure">Failure</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="attempt">Attempt</option>
          </select>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-[#111827] border border-[#1e3a5f] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d1220] border-b border-[#1e3a5f] text-[11px] font-bold text-[#7090b0] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-3">Host / Device</th>
                <th className="py-3 px-3">Event Type</th>
                <th className="py-3 px-3">Action / Status</th>
                <th className="py-3 px-3">User</th>
                <th className="py-3 px-3">Source IP</th>
                <th className="py-3 px-3">Raw Log Message</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f]/40 font-mono">
              {filteredEvents.map((ev) => {
                const isFail = ev.status === 'failure' || ev.status === 'denied';
                const isSuccess = ev.status === 'success';
                const statusColor = isFail
                  ? 'text-[#ff3366] bg-[#ff3366]/10 border-[#ff3366]/30'
                  : isSuccess
                  ? 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30'
                  : 'text-[#00d4ff] bg-[#00d4ff]/10 border-[#00d4ff]/30';

                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-[#1e3a5f]/20 transition-colors"
                  >
                    <td className="py-2.5 px-4 text-[#7090b0] whitespace-nowrap">
                      {ev.timestamp?.substring(11, 19) || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-white font-medium whitespace-nowrap">
                      {ev.hostname}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#1e3a5f]/60 text-[#00d4ff] rounded border border-[#1e3a5f] text-[10px] uppercase font-bold">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${statusColor}`}>
                        {ev.action} : {ev.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white whitespace-nowrap">
                      {ev.username || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#00d4ff] whitespace-nowrap">
                      {ev.source_ip || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#b0c4de] max-w-[320px] truncate text-[11px]">
                      {ev.raw_message || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(ev)}
                        className="px-2 py-1 bg-[#1e3a5f]/60 hover:bg-[#00d4ff] hover:text-[#0a0e1a] text-[#00d4ff] rounded transition-all font-sans font-bold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#7090b0] font-sans">
                    No security events match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Drawer Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e3a5f] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-[#1e3a5f] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#00d4ff]" />
                <h3 className="font-bold text-sm text-white">
                  Security Telemetry Event Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#7090b0] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Event ID</span>
                <span className="font-mono text-white text-[11px] truncate block">{selectedEvent.id}</span>
              </div>
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Timestamp (UTC)</span>
                <span className="font-mono text-[#00d4ff] text-[11px] block">{selectedEvent.timestamp}</span>
              </div>
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Host & Device</span>
                <span className="font-mono text-white text-[11px] block">{selectedEvent.hostname}</span>
              </div>
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Source IP / Port</span>
                <span className="font-mono text-white text-[11px] block">
                  {selectedEvent.source_ip || 'N/A'}:{selectedEvent.source_port || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Target User</span>
                <span className="font-mono text-[#00ff88] text-[11px] block">{selectedEvent.username || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg">
                <span className="text-[10px] uppercase font-bold text-[#7090b0] block">Taxonomy</span>
                <span className="font-mono text-[#00d4ff] text-[11px] block">
                  {selectedEvent.event_type} / {selectedEvent.action}
                </span>
              </div>
            </div>

            {/* Raw Log Line */}
            <div>
              <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider block mb-1.5">
                Raw Log String
              </span>
              <div className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg font-mono text-xs text-[#00ff88] break-all">
                {selectedEvent.raw_message || '(No raw log string attached)'}
              </div>
            </div>

            {/* JSON Metadata */}
            <div>
              <span className="text-xs font-bold text-[#7090b0] uppercase tracking-wider block mb-1.5">
                Parsed Normalized Attributes
              </span>
              <pre className="p-3 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg font-mono text-[11px] text-[#b0c4de] overflow-x-auto max-h-40">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
