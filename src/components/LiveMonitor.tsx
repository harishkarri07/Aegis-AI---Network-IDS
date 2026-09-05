'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ShieldAlert, Zap, Search, ShieldCheck } from 'lucide-react';
import { Packet, AttackCategory } from '../types';
import { MetricCard } from './MetricCard';
import { TrafficChart } from './TrafficChart';
import { AnomalyChart } from './AnomalyChart';
import { AlertBox } from './AlertBox';
import { ConfidenceGauge } from './ConfidenceGauge';

interface LiveMonitorProps {
  history: Packet[];
  anomalyScores: number[];
  totalPackets: number;
  attackCounts: Record<AttackCategory, number>;
  isRunning: boolean;
  latestSecurityAlert: Packet | null;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({ 
  history, 
  anomalyScores, 
  totalPackets, 
  attackCounts,
  isRunning,
  latestSecurityAlert 
}) => {
  const totalAttacks = Object.entries(attackCounts)
    .filter(([cat]) => cat !== 'NORMAL')
    .reduce((acc, [, count]) => acc + (count as number), 0);

  const chartData = Object.entries(attackCounts).map(([category, count]) => ({
    category: category as AttackCategory,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Packets" value={totalPackets.toLocaleString()} icon={Activity} />
        <MetricCard title="Attacks Detected" value={totalAttacks} icon={ShieldAlert} color="text-neon-red" />
        <MetricCard title="DoS Events" value={attackCounts['DoS']} icon={Zap} color="text-neon-red" />
        <MetricCard title="Probe Events" value={attackCounts['Probe']} icon={Search} color="text-neon-orange" />
        <MetricCard title="Anomalies" value={history.reduce((acc, p) => acc + (p.is_anomaly ? 1 : 0), 0)} icon={ShieldCheck} color="text-neon-pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Distribution */}
        <div className="lg:col-span-2 ids-card">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-blue" />
            Traffic Category Distribution
          </h3>
          <TrafficChart data={chartData} />
        </div>

        {/* Latest Alert */}
        <div className="ids-card flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neon-red" />
            Latest System Alert
          </h3>
          <div className="flex-1 flex flex-col justify-center gap-4">
            {latestSecurityAlert ? (
              <>
                <AlertBox packet={latestSecurityAlert} />
                <div className="bg-black/20 rounded-lg border border-border-dim p-2">
                  <ConfidenceGauge confidence={latestSecurityAlert.confidence} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-muted italic text-sm text-center">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-border-dim mb-3 animate-pulse" />
                No security alerts detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anomaly Score Timeline */}
      <div className="ids-card">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-pink" />
          Real-time Anomaly Score Timeline
        </h3>
        <AnomalyChart scores={anomalyScores} />
      </div>
    </div>
  );
};
