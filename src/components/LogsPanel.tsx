'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import { Packet } from '../types';

interface LogsPanelProps {
  history: Packet[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ history }) => {
  const [filter, setFilter] = useState<'all' | 'attacks' | 'normal'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(p => {
    const matchesFilter = filter === 'all' || (filter === 'attacks' ? p.binary === 1 : p.binary === 0);
    const matchesSearch = p.src_ip.includes(searchTerm) || p.dst_ip.includes(searchTerm) || p.category.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Source IP', 'Destination IP', 'Port', 'Protocol', 'Category', 'Confidence', 'Anomaly'];
    const rows = filteredHistory.map(p => [
      p.timestamp, p.src_ip, p.dst_ip, p.dst_port, p.protocol, p.category, p.confidence, p.is_anomaly
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ids_logs_${new Date().getTime()}.csv`);
    link.click();
  };

  return (
    <div className="ids-card space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-bg-primary border border-border-dim rounded-lg p-1">
            <button 
              id="filter-all-btn"
              suppressHydrationWarning
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'all' ? 'bg-neon-blue text-bg-primary' : 'text-text-dim hover:text-white'}`}
            >
              All Traffic
            </button>
            <button 
              id="filter-attacks-btn"
              suppressHydrationWarning
              onClick={() => setFilter('attacks')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'attacks' ? 'bg-neon-red text-white' : 'text-text-dim hover:text-white'}`}
            >
              Attacks
            </button>
            <button 
              id="filter-normal-btn"
              suppressHydrationWarning
              onClick={() => setFilter('normal')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'normal' ? 'bg-neon-green text-bg-primary' : 'text-text-dim hover:text-white'}`}
            >
              Normal
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              id="logs-search-input"
              suppressHydrationWarning
              type="text" 
              placeholder="Search IP or Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-primary border border-border-dim rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-neon-blue w-64"
            />
          </div>
        </div>

        <button 
          id="download-logs-csv-btn"
          suppressHydrationWarning
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all text-xs font-bold"
        >
          <Download className="w-3 h-3" />
          Download Logs
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white/5 text-text-dim uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Source IP</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Port</th>
              <th className="px-4 py-3">Protocol</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {filteredHistory.slice(0, 50).map((p) => (
              <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.binary === 1 ? 'bg-neon-red/5' : ''}`}>
                <td className="px-4 py-2.5 text-text-muted">{new Date(p.timestamp).toLocaleTimeString()}</td>
                <td className="px-4 py-2.5 font-bold">{p.src_ip}</td>
                <td className="px-4 py-2.5">{p.dst_ip}</td>
                <td className="px-4 py-2.5 text-text-muted">{p.dst_port}</td>
                <td className="px-4 py-2.5 text-text-muted">{p.protocol}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    p.category === 'NORMAL' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-red/10 text-neon-red'
                  }`}>
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-2.5">{(p.confidence * 100).toFixed(1)}%</td>
                <td className="px-4 py-2.5">
                  {p.is_anomaly ? (
                    <span className="text-neon-pink font-bold">ANOMALY</span>
                  ) : (
                    <span className="text-text-muted">CLEAN</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHistory.length === 0 && (
          <div className="py-20 text-center text-text-muted italic">
            No matching logs found.
          </div>
        )}
      </div>
    </div>
  );
};
