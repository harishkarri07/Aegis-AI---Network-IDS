/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ShieldAlert, Info, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { AttackCategory, Packet, AttackExplanation } from '../types';
import { DetectionEngine } from '../lib/capture/detection-engine';
import {
  Button,
  Card,
  CardHeader,
  Chip,
  InlineConfidence,
  Label,
  SectionHeader,
  Select,
  SeverityChip,
  cn
} from './ui';

export const ExplainAlert: React.FC = () => {
  const [selectedType, setSelectedType] = useState<AttackCategory>('DoS');
  const [explanation, setExplanation] = useState<AttackExplanation | null>(null);
  const [sampleVector, setSampleVector] = useState<Partial<Packet> | null>(null);
  const [loading, setLoading] = useState(false);

  const generateExplanation = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined' && window.aegisApi && typeof window.aegisApi.explainVector === 'function') {
        const exp = await window.aegisApi.explainVector(selectedType);
        if (exp) {
          setExplanation(exp);
          populateSample(selectedType, exp);
          return;
        }
      }

      // Pure deterministic explanation from DetectionEngine (works in both Web and Electron)
      const exp = DetectionEngine.explainVector(selectedType);
      setExplanation(exp);
      populateSample(selectedType, exp);
    } catch (error) {
      console.error('Error generating explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  const populateSample = (category: AttackCategory, exp: AttackExplanation) => {
    const isAnomaly = category !== 'NORMAL';
    const conf = category === 'DoS' ? 0.94 : category === 'Probe' ? 0.88 : category === 'R2L' ? 0.82 : category === 'U2R' ? 0.76 : 0.98;
    setSampleVector({
      category,
      confidence: conf,
      is_anomaly: isAnomaly,
      src_ip: category === 'NORMAL' ? '192.168.1.100' : '203.0.113.50',
      dst_ip: '192.168.1.1',
      dst_port: category === 'DoS' ? 80 : category === 'Probe' ? 22 : category === 'R2L' ? 3389 : category === 'U2R' ? 445 : 443,
      protocol: 'TCP',
      timestamp: new Date().toISOString(),
      explanation: exp
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Explain a detection"
        description="Select a threat category to see exactly which deterministic indicators trigger it, why they matter, and what to do about it."
      />

      <Card className="p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 min-w-0">
            <Label htmlFor="explain-vector-select">Threat classification category</Label>
            <Select
              id="explain-vector-select"
              suppressHydrationWarning
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AttackCategory)}
              className="w-full"
            >
              <option value="DoS">Denial of Service (DoS)</option>
              <option value="Probe">Network Probing / Scanning</option>
              <option value="R2L">Remote-to-Local (R2L)</option>
              <option value="U2R">User-to-Root (U2R Proxy Signal)</option>
              <option value="NORMAL">Normal Baseline Traffic</option>
            </Select>
          </div>
          <Button
            id="evaluate-rule-btn"
            suppressHydrationWarning
            variant="primary"
            onClick={generateExplanation}
            disabled={loading}
            className="shrink-0"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5" />
            )}
            Evaluate deterministic indicators
          </Button>
        </div>
      </Card>

      {explanation && sampleVector && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-5">
              <CardHeader title="Detection logic summary" icon={FileCode} className="mb-4" />
              <div className="p-3.5 rounded-well bg-canvas-deep border border-hairline space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-caption font-semibold text-primary">{explanation.attack_name}</span>
                  <SeverityChip severity={explanation.severity} />
                </div>
                <p className="text-caption text-secondary leading-relaxed">{explanation.narrative}</p>
              </div>
              <div className="mt-4 px-1">
                <InlineConfidence confidence={sampleVector.confidence || 0.9} />
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-caption font-semibold text-primary">Recommended response</h4>
                  <p className="text-caption text-secondary leading-relaxed mt-1">{explanation.mitigation}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <CardHeader
                title="Triggered heuristic indicators"
                description="The measured signals and their thresholds behind this classification"
                icon={Info}
              />
              <div className="space-y-2.5">
                {explanation.indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-well bg-canvas-deep border border-hairline">
                    <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <span className="text-caption font-mono font-medium text-primary">{ind.feature}</span>
                        <Chip tone="medium" className="text-micro !py-[2px]">
                          Observed: {typeof ind.value === 'number' ? ind.value.toFixed(2) : String(ind.value)}
                        </Chip>
                        <span className="text-micro text-muted font-mono">Threshold: {ind.threshold}</span>
                      </div>
                      <p className="text-caption text-secondary leading-relaxed">{ind.description}</p>
                    </div>
                  </div>
                ))}
                {explanation.indicators.length === 0 && (
                  <p className="text-caption text-muted italic">No abnormal threshold indicators triggered for this baseline pattern.</p>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader
                title="Heuristic decision weights"
                description="Relative contribution of each feature when this classification fires"
                icon={Search}
              />
              <div className="space-y-3.5">
                {explanation.top_features.map((feat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between gap-4 text-caption">
                      <span className="font-mono text-secondary truncate">{feat.feature}</span>
                      <span className="text-primary font-medium tabular-nums shrink-0">
                        {(feat.importance * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', i === 0 ? 'bg-accent' : 'bg-muted/60')}
                        style={{ width: `${Math.min(feat.importance * 400, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
