'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ScanSearch, Bomb, KeyRound, UserCog, ShieldQuestion } from 'lucide-react';
import { AttackCategory, Packet } from '../types';
import { cn, categoryLabel, CategoryChip, Chip, EvidenceList, InlineConfidence, type ChipTone } from './ui';

interface AlertBoxProps {
  packet: Packet;
  /** Rendered inside a larger surface — use subdued padding/typography. */
  compact?: boolean;
}

const categoryMeta: Record<AttackCategory, { tone: ChipTone; Icon: React.ComponentType<{ className?: string }>; sentence: string }> = {
  DoS: {
    tone: 'critical',
    Icon: Bomb,
    sentence: 'This device is sending or receiving an unusually large volume of traffic in a short window, which can overwhelm services and deny access to legitimate users.'
  },
  Probe: {
    tone: 'warning',
    Icon: ScanSearch,
    sentence: 'This device contacted several ports on another host within a short period. This can indicate network reconnaissance.'
  },
  R2L: {
    tone: 'warning',
    Icon: KeyRound,
    sentence: 'A remote host attempted to reach this device in a way that may indicate an unauthorized remote access attempt.'
  },
  U2R: {
    tone: 'critical',
    Icon: UserCog,
    sentence: 'A local account or process attempted to gain higher privileges than it is allowed, which can be a sign of privilege escalation.'
  },
  NORMAL: {
    tone: 'neutral',
    Icon: ShieldQuestion,
    sentence: 'This traffic matches the normal baseline and requires no attention.'
  }
};

function fmtTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour12: false });
  } catch {
    return ts;
  }
}

export const PlainAlert: React.FC<AlertBoxProps> = ({ packet, compact }) => {
  const { category, src_ip, dst_ip, dst_port, protocol, confidence, is_anomaly, timestamp, explanation, rule_triggered, iso_score } = packet;
  const [showEvidence, setShowEvidence] = useState(false);

  const meta = categoryMeta[category] ?? categoryMeta.NORMAL;
  const Icon = meta.Icon;
  const humanTitle = explanation?.attack_name || (categoryLabel[category] ?? category);
  const sentence = explanation?.narrative || meta.sentence;

  const evidence: { label: React.ReactNode; value: React.ReactNode }[] = [
    { label: 'Source', value: src_ip },
    { label: 'Destination', value: dst_ip },
    { label: 'Destination port', value: String(dst_port) },
    { label: 'Protocol', value: protocol },
  ];
  if (rule_triggered) evidence.push({ label: 'Rule', value: rule_triggered });
  if (is_anomaly && typeof iso_score === 'number') evidence.push({ label: 'Anomaly score', value: iso_score.toFixed(3) });
  evidence.push({ label: 'Time (UTC)', value: fmtTime(timestamp) });

  return (
    <article
      className={cn(
        'rounded-card border border-hairline bg-surface-1 overflow-hidden',
        compact ? '' : ''
      )}
    >
      <div className={cn('border-l-2 border-l-transparent', meta.tone === 'critical' && 'border-l-critical', meta.tone === 'warning' && 'border-l-warning', meta.tone === 'neutral' && 'border-l-hairline-strong')}>
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Chip tone={meta.tone}>{category}</Chip>
              <span className="text-caption text-muted truncate">Detection</span>
            </div>
            <span className="text-caption font-mono text-muted tabular-nums">{fmtTime(timestamp)} UTC</span>
          </div>

          <div className="flex items-start gap-2.5">
            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', meta.tone === 'critical' ? 'text-critical' : meta.tone === 'warning' ? 'text-warning' : 'text-muted')} />
            <div className="min-w-0 space-y-1.5">
              <h4 className="text-subtitle font-semibold text-primary tracking-tight leading-snug">
                {humanTitle}
              </h4>
              <p className="text-caption text-secondary leading-relaxed max-w-2xl">{sentence}</p>
            </div>
          </div>

          {/* Evidence on demand */}
          <div>
            <button
              onClick={() => setShowEvidence((v) => !v)}
              aria-expanded={showEvidence}
              className="inline-flex items-center gap-1 text-caption font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 rounded-control px-1 -mx-1"
            >
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showEvidence && 'rotate-180')} />
              {showEvidence ? 'Hide evidence' : 'View evidence'}
            </button>
            {showEvidence && (
              <div className="mt-3 p-3.5 rounded-well bg-canvas-deep border border-hairline space-y-3">
                <EvidenceList items={evidence} />
                <div className="pt-2 border-t border-hairline-faint">
                  <InlineConfidence confidence={confidence} />
                  {explanation && (
                    <p className="mt-2.5 text-caption text-muted leading-relaxed italic max-w-2xl">
                      {explanation.narrative}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/** @deprecated Use PlainAlert */
export const AlertBox: React.FC<AlertBoxProps> = (props) => <PlainAlert {...props} />;

export default PlainAlert;
