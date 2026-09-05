/**
 * Aegis Mini-SIEM Backend Service Adapter
 * Bridges Next.js API and UI with the SQLite & Detection Engine core.
 */

import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import {
  SecurityEvent,
  MonitoredDevice,
  SecurityAlert,
  CorrelatedIncident,
  SIEMDetectionRule,
  SOCMetrics
} from '@/types';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.join(process.cwd(), 'server', 'cli.py');

async function runCli(args: string[]): Promise<string> {
  const pythonBinaries = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];
  let lastError: any = null;

  for (const bin of pythonBinaries) {
    try {
      const { stdout } = await execFileAsync(bin, [CLI_PATH, ...args], {
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONPATH: process.cwd() }
      });
      return stdout.trim();
    } catch (error: any) {
      lastError = error;
      if (error?.code === 'ENOENT') {
        // Try next binary candidate
        continue;
      }
      throw new Error(error?.stderr || error?.message || 'SIEM backend execution failed');
    }
  }

  throw new Error(
    lastError?.stderr ||
    lastError?.message ||
    'Python interpreter not found. SIEM telemetry server requires Python 3. The native Network IDS operates independently on-device.'
  );
}

export async function getSocOverview(): Promise<SOCMetrics> {
  const output = await runCli(['overview']);
  return JSON.parse(output);
}

export async function getSecurityEvents(params?: {
  limit?: number;
  offset?: number;
  hostname?: string;
  device_id?: string;
  event_type?: string;
  action?: string;
  status?: string;
  source_ip?: string;
  username?: string;
  search?: string;
}): Promise<{ events: SecurityEvent[]; count: number }> {
  const args = ['events'];
  if (params?.limit) args.push('--limit', String(params.limit));
  if (params?.offset) args.push('--offset', String(params.offset));
  if (params?.hostname) args.push('--hostname', params.hostname);
  if (params?.device_id) args.push('--device-id', params.device_id);
  if (params?.event_type) args.push('--event-type', params.event_type);
  if (params?.action) args.push('--action', params.action);
  if (params?.status) args.push('--status', params.status);
  if (params?.source_ip) args.push('--source-ip', params.source_ip);
  if (params?.username) args.push('--username', params.username);
  if (params?.search) args.push('--search', params.search);

  const output = await runCli(args);
  return JSON.parse(output);
}

export async function getSecurityAlerts(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  severity?: string;
  hostname?: string;
  device_id?: string;
}): Promise<{ alerts: SecurityAlert[]; count: number }> {
  const args = ['alerts'];
  if (params?.limit) args.push('--limit', String(params.limit));
  if (params?.offset) args.push('--offset', String(params.offset));
  if (params?.status) args.push('--status', params.status);
  if (params?.severity) args.push('--severity', params.severity);
  if (params?.hostname) args.push('--hostname', params.hostname);
  if (params?.device_id) args.push('--device-id', params.device_id);

  const output = await runCli(args);
  return JSON.parse(output);
}

export async function updateAlertStatus(alertId: string, status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'): Promise<boolean> {
  const output = await runCli(['update-alert', alertId, status]);
  const res = JSON.parse(output);
  return !!res.success;
}

export async function getCorrelatedIncidents(): Promise<{ incidents: CorrelatedIncident[]; count: number }> {
  const output = await runCli(['incidents']);
  return JSON.parse(output);
}

export async function getMonitoredDevices(): Promise<{ devices: MonitoredDevice[]; count: number }> {
  const output = await runCli(['devices']);
  return JSON.parse(output);
}

export async function getDetectionRules(): Promise<{ rules: SIEMDetectionRule[]; count: number }> {
  const output = await runCli(['rules']);
  return JSON.parse(output);
}

export async function generateExecutiveReport(format: 'markdown' | 'csv' = 'markdown'): Promise<string> {
  return await runCli(['report', '--format', format]);
}

export async function triggerSimulationScenario(scenario: string, count = 5, hostname = 'endpoint-alpha', sourceIp = '198.51.100.42'): Promise<any> {
  const output = await runCli([
    'simulate',
    '--scenario', scenario,
    '--count', String(count),
    '--hostname', hostname,
    '--source-ip', sourceIp
  ]);
  return JSON.parse(output);
}

export async function ingestSecurityPayload(payload: any | any[]): Promise<any> {
  const output = await runCli(['ingest', JSON.stringify(payload)]);
  return JSON.parse(output);
}
