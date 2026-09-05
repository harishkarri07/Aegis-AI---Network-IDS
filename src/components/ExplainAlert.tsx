/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ShieldAlert, Info, CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import { AttackCategory, Packet, AttackExplanation } from '../types';
import { ConfidenceGauge } from './ConfidenceGauge';
import { DetectionEngine } from '../lib/capture/detection-engine';

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
    <div className="space-y-6">
      <div className="ids-card">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
          <Search className="w-4 h-4 text-neon-blue" />
          Deterministic Rule & Threat Vector Explainer
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="explain-vector-select" className="text-[10px] text-text-dim uppercase font-bold">Select Threat Classification Category</label>
            <select 
              id="explain-vector-select"
              suppressHydrationWarning
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as AttackCategory)}
              className="w-full bg-bg-primary border border-border-dim rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-neon-blue transition-colors"
            >
              <option value="DoS">Denial of Service (DoS)</option>
              <option value="Probe">Network Probing / Scanning</option>
              <option value="R2L">Remote-to-Local (R2L)</option>
              <option value="U2R">User-to-Root (U2R Proxy Signal)</option>
              <option value="NORMAL">Normal Baseline Traffic</option>
            </select>
          </div>
          <button 
            id="evaluate-rule-btn"
            suppressHydrationWarning
            onClick={generateExplanation}
            disabled={loading}
            className="bg-neon-blue text-bg-primary px-6 py-2.5 rounded-lg font-bold hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-bg-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
            Evaluate Deterministic Indicators
          </button>
        </div>
      </div>

      {explanation && sampleVector && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="ids-card">
              <h4 className="text-[10px] text-text-dim uppercase font-bold mb-4 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-neon-blue" />
                Detection Logic Summary
              </h4>
              <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{explanation.attack_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    explanation.severity === 'CRITICAL' ? 'bg-neon-red/20 text-neon-red border border-neon-red/30' :
                    explanation.severity === 'HIGH' ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30' :
                    explanation.severity === 'MEDIUM' ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink/30' :
                    'bg-neon-green/20 text-neon-green border border-neon-green/30'
                  }`}>
                    {explanation.severity}
                  </span>
                </div>
                <p className="text-xs text-text-dim leading-relaxed font-mono italic">
                  {explanation.narrative}
                </p>
              </div>
              <div className="mt-4 bg-black/20 rounded-lg p-2 border border-white/5">
                <ConfidenceGauge confidence={sampleVector.confidence || 0.9} />
              </div>
            </div>

            <div className="ids-card bg-neon-green/5 border-neon-green/20">
              <h4 className="text-[10px] text-neon-green uppercase font-bold mb-3 flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Recommended Response & Mitigation
              </h4>
              <p className="text-xs leading-relaxed text-neon-green/80 italic">
                {explanation.mitigation}
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="ids-card">
              <h4 className="text-[10px] text-text-dim uppercase font-bold mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-neon-blue" />
                Triggered Heuristic Indicators & Thresholds
              </h4>
              <div className="space-y-3">
                {explanation.indicators.map((ind, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <div className="mt-1">
                      <AlertCircle className="w-4 h-4 text-neon-orange" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-white">{ind.feature}</span>
                        <span className="text-[10px] bg-neon-orange/20 text-neon-orange px-1.5 py-0.5 rounded border border-neon-orange/30">
                          Observed: {typeof ind.value === 'number' ? ind.value.toFixed(2) : ind.value}
                        </span>
                        <span className="text-[10px] text-text-dim">Threshold: {ind.threshold}</span>
                      </div>
                      <p className="text-[11px] text-text-dim">{ind.description}</p>
                    </div>
                  </div>
                ))}
                {explanation.indicators.length === 0 && (
                  <p className="text-xs text-text-muted italic">No abnormal threshold indicators triggered for this baseline pattern.</p>
                )}
              </div>
            </div>

            <div className="ids-card">
              <h4 className="text-[10px] text-text-dim uppercase font-bold mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-neon-blue" />
                Heuristic Decision Weights
              </h4>
              <div className="space-y-4">
                {explanation.top_features.map((feat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="font-mono text-text-dim">{feat.feature}</span>
                      <span className="text-neon-blue font-bold">{(feat.importance * 100).toFixed(1)}% weight</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,212,255,0.5)]" 
                        style={{ width: `${Math.min(feat.importance * 400, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
