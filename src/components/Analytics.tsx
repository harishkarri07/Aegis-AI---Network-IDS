'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, FileText, TrendingUp } from 'lucide-react';
import { Packet, AttackCategory } from '../types';

interface AnalyticsProps {
  history: Packet[];
}

const COLORS = ['#00ff88', '#ff3333', '#ff8800', '#ffcc00', '#ff44aa'];

export const Analytics: React.FC<AnalyticsProps> = ({ history }) => {
  if (history.length < 5) {
    return (
      <div className="ids-card h-[400px] flex flex-col items-center justify-center text-text-dim">
        <TrendingUp className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Insufficient Data</p>
        <p className="text-sm opacity-60">Run the simulation to gather more network traffic for analysis.</p>
      </div>
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
    const rows = history.map(p => [
      p.timestamp, p.src_ip, p.dst_ip, p.dst_port, p.protocol, p.category, p.confidence, p.is_anomaly
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ids_export_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold neon-gradient-text">Traffic Intelligence Report</h2>
        <button 
          id="export-dataset-csv-btn"
          suppressHydrationWarning
          onClick={downloadCSV}
          className="flex items-center gap-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 px-4 py-2 rounded-lg hover:bg-neon-blue/20 transition-all text-sm font-bold"
        >
          <Download className="w-4 h-4" />
          Export Dataset (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="ids-card">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <FileText className="w-4 h-4 text-neon-blue" />
            Traffic Composition
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1220', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Distribution */}
        <div className="ids-card">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neon-red" />
            Attack Vector Analysis
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attackData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#7090b0', fontSize: 12 }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0d1220', border: '1px solid #1e3a5f', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#ff3333" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="ids-card overflow-hidden">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Statistical Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-text-dim uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Packet Count</th>
                <th className="px-4 py-3">Percentage</th>
                <th className="px-4 py-3">Avg Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <tr key={cat} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-bold">{cat}</td>
                  <td className="px-4 py-3 font-mono">{count}</td>
                  <td className="px-4 py-3 font-mono">{((count as number / history.length) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-3 font-mono">
                    {((history.filter(p => p.category === cat).reduce((a, b) => a + b.confidence, 0) / (count as number)) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
