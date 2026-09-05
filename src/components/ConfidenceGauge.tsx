'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ConfidenceGaugeProps {
  confidence: number;
  label?: string;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence, label = "Detection Confidence" }) => {
  const percentage = Math.min(Math.max(confidence * 100, 0), 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * (circumference / 2); // Semicircle

  const getColor = (val: number) => {
    if (val > 85) return '#ff3333'; // Red for high confidence attack
    if (val > 60) return '#ff8800'; // Orange
    return '#00ff88'; // Green
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-20">
        <svg className="w-full h-full" viewBox="0 0 100 60">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {/* Background Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1e3a5f"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference / 2}
            strokeDashoffset={circumference / 2 - (percentage / 100) * (circumference / 2)}
            filter="url(#glow)"
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease' }}
          />
          <text
            x="50"
            y="45"
            textAnchor="middle"
            className="text-[14px] font-bold font-mono"
            fill={color}
          >
            {percentage.toFixed(1)}%
          </text>
        </svg>
      </div>
      <span className="text-[10px] font-medium text-text-dim uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
};
