'use client';

import React, { useState } from 'react';
import { RefreshCw, Eye } from 'lucide-react';
import { SecurityEvent } from '@/types';
import {
  Button,
  Card,
  Chip,
  cn,
  Dialog,
  EmptyState,
  Label,
  SearchInput,
  SectionHeader,
  Select,
  StatusChip,
  tdClass,
  thClass
} from '../ui';
import { formatLocalTime, formatLocalDateTimeWithZone } from '@/lib/time-format';

interface LiveEventsViewProps {
  events: SecurityEvent[];
  isLoading: boolean;
  onRefresh: () => void;
}

const typeLabel: Record<string, string> = {
  authentication: 'Authentication',
  privilege: 'Privilege',
  connection: 'Connection',
  process: 'Process',
  audit: 'Audit',
  system: 'System'
};

export const LiveEventsView: React.FC<LiveEventsViewProps> = ({
  events,
  isLoading,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const filteredEvents = events.filter((ev) => {
    if (typeFilter !== 'ALL' && ev.event_type.toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    if (statusFilter !== 'ALL' && ev.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchRaw = ev.raw_message?.toLowerCase().includes(q);
      const matchHost = ev.hostname?.toLowerCase().includes(q);
      const matchUser = ev.username?.toLowerCase().includes(q);
      const matchIp = ev.source_ip?.toLowerCase().includes(q);
      if (!matchRaw && !matchHost && !matchUser && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Telemetry events"
        description="Normalized security events streamed from monitored endpoints. Read the meaning first — technical detail sits one step away."
        actions={
          <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        }
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
          <SearchInput
            placeholder="Search log text, hostname, username, or source IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[240px]"
          />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by event type">
            <option value="ALL">All event types</option>
            <option value="authentication">Authentication</option>
            <option value="privilege">Privilege (Sudo/Su)</option>
            <option value="connection">Connection / Scan</option>
            <option value="process">Process execution</option>
            <option value="audit">Audit / Resource</option>
            <option value="system">System logs</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="ALL">All statuses</option>
            <option value="failure">Failure</option>
            <option value="success">Success</option>
            <option value="denied">Denied</option>
            <option value="attempt">Attempt</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className={thClass}>Time</th>
                <th className={thClass}>Host / device</th>
                <th className={thClass}>Event</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>User</th>
                <th className={thClass}>Source IP</th>
                <th className={thClass}>Log message</th>
                <th className={cn(thClass, 'text-right')}>Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-faint">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className={cn(tdClass, 'font-mono text-muted tabular-nums whitespace-nowrap')}>
                    {ev.timestamp ? formatLocalTime(ev.timestamp) : 'N/A'}
                  </td>
                  <td className={cn(tdClass, 'text-primary font-medium whitespace-nowrap')}>{ev.hostname}</td>
                  <td className={cn(tdClass, 'whitespace-nowrap')}>
                    <Chip tone="neutral" className="font-normal">
                      {typeLabel[ev.event_type] ?? ev.event_type}
                    </Chip>
                  </td>
                  <td className={cn(tdClass, 'whitespace-nowrap')}>
                    <StatusChip status={`${ev.action}: ${ev.status}`} />
                  </td>
                  <td className={cn(tdClass, 'whitespace-nowrap')}>{ev.username || '—'}</td>
                  <td className={cn(tdClass, 'font-mono whitespace-nowrap')}>{ev.source_ip || '—'}</td>
                  <td className={cn(tdClass, 'text-muted max-w-[340px] truncate')}>{ev.raw_message || '—'}</td>
                  <td className={cn(tdClass, 'text-right whitespace-nowrap')}>
                    <Button variant="tertiary" size="sm" onClick={() => setSelectedEvent(ev)}>
                      <Eye className="w-3.5 h-3.5" />
                      Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEvents.length === 0 && (
            <EmptyState
              title={events.length === 0 ? 'No telemetry events yet' : 'No events match'}
              description={
                events.length === 0
                  ? 'Waiting for an endpoint or SIEM telemetry source. Events will appear here once a monitored host begins reporting.'
                  : 'No security events match the current filters. Try adjusting your search or filter criteria.'
              }
              className="py-12"
            />
          )}
        </div>
      </Card>

      {/* Event inspector */}
      {selectedEvent && (
        <Dialog
          onClose={() => setSelectedEvent(null)}
          eyebrow="Event inspection"
          title={`${typeLabel[selectedEvent.event_type] ?? selectedEvent.event_type} · ${selectedEvent.hostname}`}
          footer={
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          }
          wide
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Event ID" mono value={selectedEvent.id} />
              <Field label="Detected (local)" mono value={formatLocalDateTimeWithZone(selectedEvent.timestamp)} />
              <Field label="Canonical (UTC)" mono value={selectedEvent.timestamp} />
              <Field label="Host & device" mono value={selectedEvent.hostname} />
              <Field
                label="Source IP / port"
                mono
                value={`${selectedEvent.source_ip || 'N/A'}:${selectedEvent.source_port || 'N/A'}`}
              />
              <Field label="Target user" mono value={selectedEvent.username || 'N/A'} />
              <Field label="Taxonomy" value={`${selectedEvent.event_type} / ${selectedEvent.action}`} />
            </div>

            <div>
              <Label>Raw log string</Label>
              <pre className="p-3 rounded-well bg-canvas-deep border border-hairline font-mono text-micro text-secondary whitespace-pre-wrap break-words">
                {selectedEvent.raw_message || '(No raw log string attached)'}
              </pre>
            </div>

            <div>
              <Label>Parsed normalized attributes</Label>
              <pre className="p-3 rounded-well bg-canvas-deep border border-hairline font-mono text-micro text-secondary overflow-x-auto max-h-48">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-2.5 rounded-well bg-canvas-deep border border-hairline min-w-0">
      <div className="text-micro text-muted mb-1">{label}</div>
      <div className={cn('text-caption text-primary truncate', mono && 'font-mono')}>{value}</div>
    </div>
  );
}
