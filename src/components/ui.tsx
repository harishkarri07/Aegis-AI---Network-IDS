'use client';

/**
 * Aegis UI primitives.
 * Single source for the console's shared component grammar (see FINAL_AEGIS_UI_BLUEPRINT.md).
 * Severity/status color appears ONLY through the semantic chips/dots below — chrome stays neutral.
 */

import React, { useEffect, useRef } from 'react';
import { X, Search, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { AttackCategory } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shared hex palette for SVG/recharts primitives (charts can't consume CSS tokens directly). */
export const chartColors = {
  neutral: '#6b7280',
  muted: '#98a0ad',
  grid: 'rgba(255,255,255,0.06)',
  accent: '#5f6ae0',
  accentSoft: 'rgba(95,106,224,0.10)',
  critical: '#e5484d',
  warning: '#e3963a',
  medium: '#d9a13b',
  success: '#3fb68a',
  info: '#6db3e6',
};

export const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#1e232d',
  border: '1px solid #2d3340',
  borderRadius: 8,
  fontSize: 13,
  color: '#c3c8d1',
  boxShadow: 'none',
};

/* ------------------------------------------------------------------ */
/* Surfaces & typography helpers                                       */
/* ------------------------------------------------------------------ */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-hairline bg-surface-1', className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 mb-4', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {Icon && <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />}
        <div className="min-w-0">
          <h3 className="text-subtitle font-semibold text-primary tracking-tight">{title}</h3>
          {description && <p className="text-caption text-muted mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/** Page-level header used at the top of every view. */
export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        <h2 className="text-title font-semibold text-primary tracking-tight">{title}</h2>
        {description && <p className="text-caption text-muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('block text-caption font-medium text-secondary mb-1.5', className)}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'dangerOutline';
type ButtonSize = 'md' | 'sm';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-pressed',
  secondary: 'bg-surface-2 text-primary border border-hairline hover:bg-surface-3 hover:border-hairline-strong',
  tertiary: 'text-secondary hover:text-primary hover:bg-surface-1',
  danger: 'bg-critical-soft text-critical border border-critical/30 hover:bg-critical/15',
  dangerOutline: 'bg-transparent text-critical border border-critical/30 hover:bg-critical-soft',
};

const buttonSizes: Record<ButtonSize, string> = {
  md: 'h-8 px-3.5 text-caption',
  sm: 'h-7 px-2.5 text-caption',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-control font-medium whitespace-nowrap select-none',
        'transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        'disabled:opacity-50 disabled:pointer-events-none',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-control text-muted',
        'hover:text-primary hover:bg-surface-2 transition-colors focus-visible:outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

export const controlClass =
  'h-8 rounded-control bg-canvas-deep border border-hairline px-2.5 text-caption text-primary ' +
  'placeholder:text-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-colors';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, 'pr-7 cursor-pointer', className)} {...props}>
      {children}
    </select>
  );
}

export function SearchInput({
  className,
  iconClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { iconClassName?: string }) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search className={cn('w-4 h-4 text-faint absolute left-2.5 top-1/2 -translate-y-1/2', iconClassName)} />
      <input className={cn(controlClass, 'pl-8 w-full')} type="text" {...props} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Semantic chips & dots — the ONLY place severity color appears       */
/* ------------------------------------------------------------------ */

export type ChipTone = 'critical' | 'warning' | 'medium' | 'info' | 'success' | 'neutral';

export const toneText: Record<ChipTone, string> = {
  critical: 'text-critical',
  warning: 'text-warning',
  medium: 'text-medium',
  info: 'text-info',
  success: 'text-success',
  neutral: 'text-muted',
};

export const toneFill: Record<ChipTone, string> = {
  critical: 'bg-critical-soft text-critical',
  warning: 'bg-warning-soft text-warning',
  medium: 'bg-medium-soft text-medium',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  neutral: 'bg-surface-2 text-muted border border-hairline',
};

export const toneDot: Record<ChipTone, string> = {
  critical: 'bg-critical',
  warning: 'bg-warning',
  medium: 'bg-medium',
  info: 'bg-info',
  success: 'bg-success',
  neutral: 'bg-muted',
};

export function StatusDot({
  tone,
  className,
  pulse,
}: {
  tone: ChipTone;
  className?: string;
  /** Slow calm pulse — reserved for genuinely active critical states only. */
  pulse?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block w-1.5 h-1.5 rounded-chip shrink-0',
        toneDot[tone],
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}

export function Chip({
  tone = 'neutral',
  children,
  dot,
  dotPulse,
  className,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  dot?: boolean;
  dotPulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-chip px-2.5 py-[3px]',
        'text-caption font-medium leading-none whitespace-nowrap',
        toneFill[tone],
        className
      )}
    >
      {dot && <StatusDot tone={tone} pulse={dotPulse} />}
      {children}
    </span>
  );
}

const severityTone: Record<string, ChipTone> = {
  CRITICAL: 'critical',
  HIGH: 'warning',
  MEDIUM: 'medium',
  LOW: 'neutral',
  INFO: 'info',
  NORMAL: 'neutral',
};

export function SeverityChip({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const tone = severityTone[severity?.toUpperCase()] ?? 'neutral';
  return (
    <Chip tone={tone} className={className}>
      {severity}
    </Chip>
  );
}

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const s = status?.toUpperCase() ?? '';
  let tone: ChipTone = 'neutral';
  if (['OPEN', 'CRITICAL', 'FAILURE', 'DENIED', 'OFFLINE', 'REJECTED'].some((w) => s.includes(w))) tone = 'critical';
  else if (['ACKNOWLEDGED', 'INVESTIGATING', 'WARNING', 'ATTEMPT'].some((w) => s.includes(w))) tone = 'medium';
  else if (['RESOLVED', 'ONLINE', 'SUCCESS', 'ENABLED', 'HEALTHY', 'ACTIVE'].some((w) => s.includes(w))) tone = 'success';
  else if (s.includes('INFO')) tone = 'info';
  return (
    <Chip tone={tone} className={className}>
      {status}
    </Chip>
  );
}

const categoryTone: Record<AttackCategory, ChipTone> = {
  NORMAL: 'neutral',
  DoS: 'critical',
  U2R: 'critical',
  Probe: 'warning',
  R2L: 'warning',
};

export function CategoryChip({
  category,
  className,
}: {
  category: AttackCategory | string;
  className?: string;
}) {
  const tone = categoryTone[category as AttackCategory] ?? 'neutral';
  return (
    <Chip tone={tone} className={className}>
      {category}
    </Chip>
  );
}

/** Plain-word labels for packet categories (human meaning before technical identity). */
export const categoryLabel: Record<string, string> = {
  NORMAL: 'Normal traffic',
  DoS: 'Denial of service',
  Probe: 'Probe / port scan',
  R2L: 'Remote access attempt',
  U2R: 'Privilege escalation',
};

export function categoryChipTone(category: string): ChipTone {
  return categoryTone[category as AttackCategory] ?? 'neutral';
}

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

export function MetricCard({
  label,
  value,
  context,
  icon: Icon,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  context?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card className={cn('p-4 flex flex-col gap-1.5 min-w-0', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption text-muted truncate">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-faint shrink-0" />}
      </div>
      <div className="text-title font-semibold text-primary tabular-nums tracking-tight leading-snug truncate">
        {value}
      </div>
      {context && <div className="text-caption text-muted leading-snug">{context}</div>}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Evidence / key-value technical details                              */
/* ------------------------------------------------------------------ */

export function EvidenceList({
  items,
  className,
}: {
  items: { label: React.ReactNode; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn('grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex items-baseline justify-between gap-4 min-w-0">
          <dt className="text-caption text-muted shrink-0">{item.label}</dt>
          <dd className="text-caption text-primary font-mono text-right break-all">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function InlineConfidence({
  confidence,
  showBar = true,
  className,
}: {
  /** 0..1 */
  confidence: number;
  showBar?: boolean;
  className?: string;
}) {
  const pct = Math.min(Math.max(confidence * 100, 0), 100);
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {showBar && (
        <div className="w-20 h-1 rounded-full bg-surface-2 overflow-hidden" aria-hidden>
          <div className="h-full bg-accent/70" style={{ width: `${pct}%` }} />
        </div>
      )}
      <span className="text-caption font-medium text-secondary tabular-nums">{pct.toFixed(1)}%</span>
      <span className="text-caption text-muted">confidence</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Keycap (keyboard shortcut hint)                                     */
/* ------------------------------------------------------------------ */

export function Keycap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-well border border-hairline-strong bg-surface-3',
        'px-1.5 py-0.5 font-sans text-micro text-secondary',
        className
      )}
    >
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Dialog                                                              */
/* ------------------------------------------------------------------ */

export function Dialog({
  onClose,
  title,
  eyebrow,
  children,
  footer,
  className,
  wide,
}: {
  onClose: () => void;
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Move focus into the dialog for keyboard users.
    const t = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'w-full rounded-panel border border-hairline-strong bg-surface-2 shadow-dialog outline-none',
          'flex max-h-[85vh] flex-col',
          wide ? 'max-w-2xl' : 'max-w-xl',
          className
        )}
      >
        {(title || eyebrow) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-hairline">
            <div className="min-w-0">
              {eyebrow && <div className="text-micro text-muted tracking-wider mb-1">{eyebrow}</div>}
              {title && <h3 className="text-subtitle font-semibold text-primary tracking-tight">{title}</h3>}
            </div>
            <IconButton label="Close" onClick={onClose} className="shrink-0">
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-hairline">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center gap-2 py-16 px-6', className)}>
      {Icon && <Icon className="w-7 h-7 text-faint mb-1" />}
      <p className="text-body font-medium text-secondary">{title}</p>
      {description && <p className="text-caption text-muted max-w-md leading-relaxed">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorBanner({
  title = 'Something went wrong',
  description,
  detail,
  action,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  detail?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-hairline border-l-2 border-l-critical bg-surface-1 p-4',
        'flex items-start gap-3',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-4 h-4 text-critical mt-0.5 shrink-0" />
      <div className="min-w-0 space-y-1">
        <p className="text-body font-medium text-primary">{title}</p>
        {description && <p className="text-caption text-secondary leading-relaxed">{description}</p>}
        {detail && (
          <pre className="mt-2 p-2.5 rounded-well bg-canvas-deep border border-hairline text-micro text-muted font-mono overflow-x-auto">
            {detail}
          </pre>
        )}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-well bg-surface-2', className)} />;
}

export function LoadingBlock({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables — shared grammar classes                                     */
/* ------------------------------------------------------------------ */

export const thClass =
  'px-4 py-2.5 text-left text-caption font-medium text-muted whitespace-nowrap border-b border-hairline';
export const tdClass = 'px-4 py-2.5 align-middle text-caption text-secondary';
