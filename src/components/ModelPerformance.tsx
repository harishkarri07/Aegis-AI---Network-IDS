'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Cpu, Database, Network, ShieldCheck } from 'lucide-react';
import { FeatureImportance } from '../types';
import { FeatureImportanceChart } from './FeatureImportanceChart';
import { Card, CardHeader, Chip, SectionHeader } from './ui';

export const ModelPerformance: React.FC = () => {
  const [importances, setImportances] = useState<FeatureImportance[]>([]);

  useEffect(() => {
    // Static architecture metadata
    setImportances([
      { feature: 'src_packet_rate', importance: 0.28 },
      { feature: 'dst_port_dispersion', importance: 0.22 },
      { feature: 'syn_to_ack_ratio', importance: 0.18 },
      { feature: 'auth_failure_frequency', importance: 0.15 },
      { feature: 'privileged_payload_vol', importance: 0.12 },
      { feature: 'flow_duration', importance: 0.05 }
    ]);
  }, []);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Deterministic, explainable detection"
        description="Aegis classifies every packet with a stateful five-tuple flow engine and sliding-window heuristics. Every detection is the result of explicit thresholds — which is why each one can be explained."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 p-5 space-y-3">
          <CardHeader title="Detection architecture" description="Stateful 5-tuple heuristic and sliding-window rule engine" />
          <div className="space-y-3">
            <ArchRow
              icon={Cpu}
              title="Stateful rule engine"
              description="Sliding 10-second window, dynamic packet rate and port-dispersion thresholds."
            />
            <ArchRow
              icon={ShieldCheck}
              title="Anomaly detector"
              description="Multi-metric deviation from a rolling baseline flags traffic outside normal patterns."
            />
            <ArchRow
              icon={Database}
              title="Security baseline"
              description="Standard threat heuristics evaluated locally, on-device, with no cloud dependency."
            />
          </div>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <CardHeader
            title="Heuristic decision weights"
            description="Relative contribution of each signal when a detection fires"
            icon={Network}
          />
          <FeatureImportanceChart importances={importances} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-start gap-2.5">
            <Chip tone="neutral">Rule-based</Chip>
            <div className="min-w-0">
              <h4 className="text-subtitle font-semibold text-primary tracking-tight">Stateful heuristic classification</h4>
              <p className="text-caption text-secondary leading-relaxed mt-1">
                Tracks per-IP sliding windows and five-tuple session states to detect DoS floods, port
                sweeps, and credential brute-force attempts deterministically with sub-millisecond evaluation.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-start gap-2.5">
            <Chip tone="info">Statistical</Chip>
            <div className="min-w-0">
              <h4 className="text-subtitle font-semibold text-primary tracking-tight">Behavioral anomaly scoring</h4>
              <p className="text-caption text-secondary leading-relaxed mt-1">
                Computes real-time composite deviation from normal network baselines, surfacing unusual
                traffic spikes, atypical TCP flag combinations, and anomalous protocol payloads.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

function ArchRow({
  icon: Icon,
  title,
  description
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-well bg-canvas-deep border border-hairline">
      <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-caption font-semibold text-primary">{title}</div>
        <p className="text-caption text-muted leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}
