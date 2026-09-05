'use client';

import React from 'react';
import {
  Server,
  Activity,
  Cpu,
  Laptop,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { MonitoredDevice } from '@/types';

interface DevicesViewProps {
  devices: MonitoredDevice[];
  onRefresh: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Server className="w-5 h-5 text-[#00ff88]" />
          Monitored Endpoint Inventory
        </h2>
        <p className="text-xs text-[#7090b0] mt-0.5">
          Registered client devices and network servers reporting live telemetry to Aegis SIEM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => {
          const isOnline = device.status === 'ONLINE';

          return (
            <div
              key={device.device_id}
              className="p-5 bg-[#111827] border border-[#1e3a5f] hover:border-[#00d4ff] rounded-xl space-y-4 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${isOnline ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-[#7090b0]/10 text-[#7090b0]'}`}>
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {device.hostname}
                    </h3>
                    <span className="font-mono text-[10px] text-[#7090b0] block">
                      {device.device_id}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1.5 ${
                  isOnline
                    ? 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88]'
                    : 'bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ff3366]'}`} />
                  {device.status}
                </span>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-[#1e3a5f]/60">
                <div className="flex items-center justify-between text-[#b0c4de]">
                  <span className="text-[#7090b0]">Operating System:</span>
                  <span className="font-medium text-white">{device.operating_system}</span>
                </div>
                <div className="flex items-center justify-between text-[#b0c4de]">
                  <span className="text-[#7090b0]">Agent Version:</span>
                  <span className="font-mono text-[#00d4ff]">v{device.agent_version || '1.0.0'}</span>
                </div>
                <div className="flex items-center justify-between text-[#b0c4de]">
                  <span className="text-[#7090b0]">IP Address:</span>
                  <span className="font-mono text-white">{device.ip_address || '127.0.0.1'}</span>
                </div>
                <div className="flex items-center justify-between text-[#b0c4de]">
                  <span className="text-[#7090b0]">Last Heartbeat:</span>
                  <span className="font-mono text-[#00ff88]">{device.last_seen.substring(11, 19)} UTC</span>
                </div>
              </div>
            </div>
          );
        })}

        {devices.length === 0 && (
          <div className="col-span-full p-12 bg-[#111827] border border-[#1e3a5f] rounded-xl text-center text-xs text-[#7090b0]">
            No endpoints currently registered. Run the Aegis Endpoint Agent (<code className="text-[#00d4ff]">python3 agent/agent.py</code>) to connect monitored machines.
          </div>
        )}
      </div>
    </div>
  );
};
