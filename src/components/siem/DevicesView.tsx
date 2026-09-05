'use client';

import React from 'react';
import { Server, Laptop } from 'lucide-react';
import { MonitoredDevice } from '@/types';
import { Button, Card, EmptyState, SectionHeader, StatusChip } from '../ui';

interface DevicesViewProps {
  devices: MonitoredDevice[];
  onRefresh: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onRefresh
}) => {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Endpoints"
        description="Registered client devices and network servers reporting live telemetry to the Aegis SIEM."
        actions={
          <Button variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        }
      />

      {devices.length === 0 ? (
        <Card>
          <EmptyState
            icon={Server}
            title="No endpoints registered"
            description="Run the Aegis endpoint agent on a monitored machine to connect it here."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open('/downloads', '_blank')}
              >
                Agent setup guide
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => {
            const isOnline = device.status === 'ONLINE';
            return (
              <Card key={device.device_id} className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={
                        'flex items-center justify-center w-9 h-9 rounded-control shrink-0 ' +
                        (isOnline ? 'bg-success-soft text-success' : 'bg-surface-2 text-muted')
                      }
                    >
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-caption font-semibold text-primary truncate">{device.hostname}</h3>
                      <span className="text-micro font-mono text-muted block truncate">{device.device_id}</span>
                    </div>
                  </div>
                  <StatusChip status={device.status} />
                </div>

                <div className="space-y-2 text-caption pt-2 border-t border-hairline-faint">
                  <Row label="Operating system" value={device.operating_system} />
                  <Row label="Agent version" value={`v${device.agent_version || '1.0.0'}`} mono />
                  <Row label="IP address" value={device.ip_address || '127.0.0.1'} mono />
                  <Row label="Last heartbeat" value={`${device.last_seen.substring(11, 19)} UTC`} mono success={isOnline} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

function Row({
  label,
  value,
  mono,
  success
}: {
  label: string;
  value: string;
  mono?: boolean;
  success?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className={'font-medium truncate ' + (mono ? 'font-mono ' : '') + (success ? 'text-success' : 'text-primary')}>
        {value}
      </span>
    </div>
  );
}
