'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { FeatureImportance } from '../types';

interface FeatureImportanceChartProps {
  importances: FeatureImportance[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ importances }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={importances} 
          layout="vertical" 
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0044aa" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="feature" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7090b0', fontSize: 10, fontFamily: 'monospace' }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{ 
              backgroundColor: '#0d1220', 
              border: '1px solid #1e3a5f', 
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Bar dataKey="importance" fill="url(#barGradient)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
