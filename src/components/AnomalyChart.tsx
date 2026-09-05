'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer, CartesianGrid } from 'recharts';
import { chartColors, tooltipStyle } from './ui';

interface AnomalyChartProps {
  scores: number[];
}

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ scores }) => {
  const data = scores.map((score, index) => ({ index, score }));
  const isEmpty = scores.length === 0;

  if (isEmpty) {
    return (
      <div className="h-[140px] w-full flex items-center justify-center text-caption text-faint">
        Scores will appear here while capture is running.
      </div>
    );
  }

  return (
    <div className="h-[140px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
          {/* Region below the threshold = deviation from baseline (engine: iso_score < 0). */}
          <ReferenceArea y1={-1} y2={0} fill="rgba(229,72,77,0.05)" stroke="none" ifOverflow="extendDomain" />
          <ReferenceLine
            y={0}
            stroke={chartColors.grid}
            strokeDasharray="3 3"
            strokeWidth={1.5}
          />
          <XAxis
            dataKey="index"
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.muted, fontSize: 11 }}
            tickFormatter={(i: number) => (i % 10 === 0 ? String(i) : '')}
          />
          <YAxis
            domain={[-1, 1]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: chartColors.muted, fontSize: 11 }}
            tickCount={5}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={() => 'Sample'}
            formatter={(value: number | string) => [Number(value).toFixed(3), 'score']}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#c3c8d1"
            strokeWidth={1.5}
            fill="rgba(152,160,173,0.06)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
