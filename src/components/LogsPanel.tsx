'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Packet } from '../types';
import {
  Button,
  Card,
  CategoryChip,
  Chip,
  cn,
  EmptyState,
  SearchInput,
  SectionHeader,
  tdClass,
  thClass
} from './ui';

interface LogsPanelProps {
  history: Packet[];
}

const FILTERS = [
  { id: 'all', label: 'All traffic' },
  { id: 'attacks', label: 'Attacks' },
  { id: 'normal', label: 'Normal' }
] as const;

type FilterId = 'all' | 'attacks' | 'normal';

export const LogsPanel: React.FC<LogsPanelProps> = ({ history }) => {
  const [filter, setFilter] = useState<FilterId>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter((p) => {
    const matchesFilter = filter === 'all' || (filter === 'attacks' ? p.binary === 1 : p.binary === 0);
    const matchesSearch =
      p.src_ip.includes(searchTerm) ||
      p.dst_ip.includes(searchTerm) ||
      p.category.includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Source IP', 'Destination IP', 'Port', 'Protocol', 'Category', 'Confidence', 'Anomaly'];
    const rows = filteredHistory.map((p) => [
      p.timestamp, p.src_ip, p.dst_ip, p.dst_port, p.protocol, p.category, p.confidence, p.is_anomaly
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ids_logs_${new Date().getTime()}.csv`);
    link.click();
  };

  const rows = filteredHistory.slice(0, 50);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Traffic logs"
        description={`Packet-level record of the current session — showing the first ${Math.min(50, history.length)} of ${history.length} captured packets.`}
        actions={
          <Button id="download-logs-csv-btn" suppressHydrationWarning variant="secondary" onClick={downloadCSV}>
            <Download className="w-3.5 h-3.5" />
            Download logs
          </Button>
        }
      />

      <Card className="p-3">
        <div className="flex flex-col md:flex-row justify-between gap-3 px-1 pb-3">
          <div className="flex items-center gap-1 p-0.5 rounded-control bg-surface-2 border border-hairline w-fit">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                id={`filter-${f.id}-btn`}
                suppressHydrationWarning
                onClick={() => setFilter(f.id)}
                className={cn(
                  'h-7 px-3 rounded-[6px] text-caption font-medium transition-colors focus-visible:outline-none',
                  filter === f.id ? 'bg-surface-3 text-primary' : 'text-muted hover:text-secondary'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <SearchInput
            id="logs-search-input"
            suppressHydrationWarning
            placeholder="Search IP or category…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-72"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={thClass}>Time (UTC)</th>
                <th className={thClass}>Category</th>
                <th className={thClass}>Flow</th>
                <th className={thClass}>Port</th>
                <th className={thClass}>Protocol</th>
                <th className={thClass}>Confidence</th>
                <th className={thClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-faint">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className={cn(tdClass, 'font-mono text-muted tabular-nums whitespace-nowrap')}>
                    {p.timestamp.length >= 19 ? p.timestamp.substring(11, 19) : p.timestamp}
                  </td>
                  <td className={tdClass}>
                    <CategoryChip category={p.category} />
                  </td>
                  <td className={cn(tdClass, 'font-mono text-primary whitespace-nowrap')}>
                    {p.src_ip} → {p.dst_ip}
                  </td>
                  <td className={cn(tdClass, 'font-mono text-muted tabular-nums')}>{p.dst_port}</td>
                  <td className={cn(tdClass, 'font-mono text-muted')}>{p.protocol}</td>
                  <td className={cn(tdClass, 'font-mono tabular-nums text-secondary')}>
                    {(p.confidence * 100).toFixed(1)}%
                  </td>
                  <td className={tdClass}>
                    {p.is_anomaly ? (
                      <Chip tone="warning">Anomalous</Chip>
                    ) : (
                      <Chip tone="neutral">Normal</Chip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <EmptyState
              title="No matching packets"
              description={history.length === 0 ? 'Capture is not running or no packets have been recorded yet.' : 'Try a different filter or search term.'}
              className="py-12"
            />
          )}
        </div>
      </Card>
    </div>
  );
};
