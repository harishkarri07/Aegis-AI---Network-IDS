'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AttackCategory } from '../types';
import { chartColors, categoryLabel, categoryChipTone, tooltipStyle, type ChipTone } from './ui';

interface TrafficChartProps {
  data: { category: AttackCategory; count: number }[];
}

const toneHex: Record<ChipTone, string> = {
  critical: chartColors.critical,
  warning: chartColors.warning,
  medium: chartColors.medium,
  info: chartColors.info,
  success: chartColors.success,
  neutral: chartColors.neutral,
};

export const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="category"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.muted, fontSize: 12 }}
            tickFormatter={(c: string) => categoryLabel[c] ?? c}
            interval={0}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.muted, fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={tooltipStyle}
            labelFormatter={(l: string) => categoryLabel[l] ?? l}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={48} isAnimationActive={false}>
            {data.map((entry) => (
              <Cell key={entry.category} fill={toneHex[categoryChipTone(entry.category)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
