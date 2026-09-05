'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AttackCategory } from '../types';

interface TrafficChartProps {
  data: { category: AttackCategory; count: number }[];
}

const CATEGORY_COLORS: Record<AttackCategory, string> = {
  'NORMAL': '#00ff88',
  'DoS': '#ff3333',
  'Probe': '#ff8800',
  'R2L': '#ffcc00',
  'U2R': '#ff44aa'
};

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis 
            dataKey="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7090b0', fontSize: 10, fontWeight: 600 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7090b0', fontSize: 10 }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ 
              backgroundColor: '#0d1220', 
              border: '1px solid #1e3a5f', 
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e0e6f0'
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#00d4ff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
