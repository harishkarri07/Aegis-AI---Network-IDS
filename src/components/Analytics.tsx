'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, FileText, TrendingUp } from 'lucide-react';
import { Packet } from '../types';
import {
  Button,
  Card,
  CardHeader,
  CategoryChip,
  categoryChipTone,
  chartColors,
  cn,
  EmptyState,
  SectionHeader,
  categoryLabel,
  tdClass,
  thClass,
  tooltipStyle,
  type ChipTone
} from './ui';

interface AnalyticsProps {
  history: Packet[];
}

const toneHex: Record<ChipTone, string> = {
  critical: chartColors.critical,
  warning: chartColors.warning,
  medium: chartColors.medium,
  info: chartColors.info,
  success: chartColors.success,
  neutral: chartColors.neutral,
};

export const Analytics: React.FC<AnalyticsProps> = ({ history }) => {
  if (history.length < 5) {
    return (
      <Card>
        <EmptyState
          icon={TrendingUp}
          title="Not enough data for analysis yet"
          description="Capture more traffic or run a scenario in the Attack Simulator, then return here for the session report."
        />
      </Card>
    );
  }

  const categoryCounts = history.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

  const attackData = Object.entries(categoryCounts)
    .filter(([name]) => name !== 'NORMAL')
    .map(([name, value]) => ({ name, value }));

  const downloadCSV = () => {
    const headers = ['Timestamp', 'Source IP', 'Destination IP', 'Port', 'Protocol', 'Category', 'Confidence', 'Anomaly'];
    const rows = history.map((p) => [
      p.timestamp, p.src_ip, p.dst_ip, p.dst_port, p.protocol, p.category, p.confidence, p.is_anomaly
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ids_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Traffic intelligence report"
        description="Session-wide analysis of the captured packet stream — composition, attack vectors, and summary statistics."
        actions={
          <Button id="export-dataset-csv-btn" suppressHydrationWarning variant="secondary" onClick={downloadCSV}>
            <Download className="w-3.5 h-3.5" />
            Export dataset (CSV)
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <CardHeader title="Traffic composition" description="Share of each detection category in the session" icon={FileText} />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={96}
                  paddingAngle={2}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {pieData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={toneHex[categoryChipTone(entry.name)]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number | string, name: string) => [Number(value).toLocaleString(), categoryLabel[name] ?? name]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => categoryLabel[value] ?? value}
                  wrapperStyle={{ fontSize: 13, color: '#c3c8d1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Attack vectors" description="How detected threats break down by type" icon={TrendingUp} />
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.muted, fontSize: 13 }}
                  tickFormatter={(v: string) => categoryLabel[v] ?? v}
                  width={150}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={tooltipStyle}
                  formatter={(value: number | string, _name: string) => [Number(value).toLocaleString(), 'packets']}
                  labelFormatter={(l: string) => categoryLabel[l] ?? l}
                />
                <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18} isAnimationActive={false}>
                  {attackData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={toneHex[categoryChipTone(entry.name)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Summary table */}
      <Card className="overflow-hidden">
        <CardHeader title="Statistical summary" description="Per-category totals with average detection confidence" className="px-5 pt-5 mb-0" />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left">
            <thead className="bg-surface-2/60">
              <tr>
                <th className={thClass}>Category</th>
                <th className={thClass}>Meaning</th>
                <th className={thClass}>Packets</th>
                <th className={thClass}>Share</th>
                <th className={thClass}>Avg confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-faint">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <tr key={cat} className="hover:bg-surface-2/50 transition-colors">
                  <td className={tdClass}>
                    <CategoryChip category={cat} />
                  </td>
                  <td className={cn(tdClass, 'text-secondary')}>{categoryLabel[cat] ?? cat}</td>
                  <td className={cn(tdClass, 'font-mono tabular-nums text-primary')}>{count}</td>
                  <td className={cn(tdClass, 'font-mono tabular-nums')}>{(((count as number) / history.length) * 100).toFixed(1)}%</td>
                  <td className={cn(tdClass, 'font-mono tabular-nums')}>
                    {(((history.filter((p) => p.category === cat).reduce((a, b) => a + b.confidence, 0)) / (count as number)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
