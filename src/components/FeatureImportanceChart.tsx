'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FeatureImportance } from '../types';
import { chartColors, tooltipStyle } from './ui';

interface FeatureImportanceChartProps {
  importances: FeatureImportance[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ importances }) => {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={importances}
          layout="vertical"
          margin={{ top: 4, right: 36, left: 8, bottom: 4 }}
        >
          <XAxis type="number" hide domain={[0, 0.3]} />
          <YAxis
            dataKey="feature"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.muted, fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
            width={150}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={tooltipStyle}
            formatter={(value: number | string) => [`${(Number(value) * 100).toFixed(0)}%`, 'weight']}
          />
          <Bar dataKey="importance" fill={chartColors.accent} radius={[0, 3, 3, 0]} barSize={12} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
