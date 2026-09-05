'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, AlertTriangle, Zap, User, Crown, Info } from 'lucide-react';
import { AttackCategory, Packet } from '../types';

interface AlertBoxProps {
  packet: Packet;
}

export const AlertBox: React.FC<AlertBoxProps> = ({ packet }) => {
  const { category, src_ip, dst_ip, dst_port, protocol, confidence, is_anomaly, timestamp, explanation } = packet;

  const getStyle = (cat: AttackCategory) => {
    switch (cat) {
      case 'DoS':
      case 'U2R':
        return { class: 'alert-critical', icon: Crown, color: 'text-neon-red' };
      case 'Probe':
      case 'R2L':
        return { class: 'alert-high', icon: Zap, color: 'text-neon-orange' };
      default:
        return { class: 'alert-normal', icon: Shield, color: 'text-neon-green' };
    }
  };

  const style = getStyle(category);
  const Icon = style.icon;

  return (
    <div className={style.class}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${style.color}`} />
          <span className={`font-bold uppercase tracking-tight ${style.color}`}>
            {explanation?.attack_name || category}
          </span>
        </div>
        <span className="text-[10px] font-mono text-text-muted">
          {new Date(timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[10px] text-text-dim uppercase mb-0.5">Source</div>
          <div className="font-mono font-medium truncate">{src_ip}</div>
        </div>
        <div>
          <div className="text-[10px] text-text-dim uppercase mb-0.5">Destination</div>
          <div className="font-mono font-medium truncate">{dst_ip}:{dst_port}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
        <div className="flex gap-3">
          <div className="flex flex-col">
            <span className="text-[9px] text-text-dim uppercase">Confidence</span>
            <span className="text-xs font-bold font-mono">{(confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-text-dim uppercase">Protocol</span>
            <span className="text-xs font-bold font-mono">{protocol}</span>
          </div>
        </div>
        {is_anomaly && (
          <div className="bg-neon-pink/20 text-neon-pink text-[9px] font-bold px-2 py-0.5 rounded border border-neon-pink/30 uppercase">
            Anomaly Detected
          </div>
        )}
      </div>

      {explanation && (
        <details className="mt-2 group">
          <summary className="text-[10px] text-text-dim cursor-pointer hover:text-white transition-colors flex items-center gap-1">
            <Info className="w-3 h-3" />
            View Analyst Narrative
          </summary>
          <div className="mt-2 text-xs text-text-dim leading-relaxed bg-black/20 p-2 rounded border border-white/5 font-mono italic">
            {explanation.narrative}
          </div>
        </details>
      )}
    </div>
  );
};
