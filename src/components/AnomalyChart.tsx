'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AnomalyChartProps {
  scores: number[];
}

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ scores }) => {
  const data = scores.map((score, index) => ({ index, score }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis 
            dataKey="index" 
            hide 
          />
          <YAxis 
            domain={[-1, 1]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7090b0', fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0d1220', 
              border: '1px solid #1e3a5f', 
              borderRadius: '8px',
              fontSize: '12px'
            }}
            labelStyle={{ display: 'none' }}
          />
          <ReferenceLine 
            y={0} 
            stroke="#ff3333" 
            strokeDasharray="3 3" 
            label={{ value: 'Anomaly Threshold', position: 'insideBottomRight', fill: '#ff3333', fontSize: 10 }} 
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#00d4ff" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorScore)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
