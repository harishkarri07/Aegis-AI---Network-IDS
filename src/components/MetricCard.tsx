'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: string | number;
  icon?: LucideIcon;
  color?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  delta, 
  icon: Icon, 
  color = 'text-neon-blue',
  className 
}) => {
  return (
    <div className={cn("ids-card flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-dim uppercase tracking-wider">{title}</span>
        {Icon && <Icon className={cn("w-4 h-4", color)} />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-2xl font-bold font-mono", color)}>{value}</span>
        {delta !== undefined && (
          <span className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded",
            Number(delta) >= 0 ? "bg-neon-green/10 text-neon-green" : "bg-neon-red/10 text-neon-red"
          )}>
            {Number(delta) >= 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
      <div className={cn("h-0.5 w-full mt-1 opacity-20 rounded-full", color.replace('text-', 'bg-'))} />
    </div>
  );
};
