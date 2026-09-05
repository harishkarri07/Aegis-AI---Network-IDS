/**
 * Aegis Mini-SIEM Backend Service Adapter
 * Bridges Next.js API and UI with the SQLite & Detection Engine core.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type {
  SecurityEvent,
  MonitoredDevice,
  SecurityAlert,
  CorrelatedIncident,
  SIEMDetectionRule,
  SOCMetrics
} from '@/types';

const execFileAsync = promisify(execFile);

/**
 * Resolve the Python CLI location the same way electron/main.ts getPythonPaths() does.
 *
 * - Packaged Electron: the backend is copied to <resourcesPath>/server via
 *   extraResources. process.resourcesPath only exists in Electron's main process.
 *   Using it here keeps capture→SIEM ingestion on the packaged server/cli.py and
 *   keeps the SQLite DB (cwd of the CLI) identical to the one the /api/siem/*
 *   proxy reads (resources/server/siem_data.db).
 * - Next.js server routes, tsx tests, and `electron .` development all run with
 *   cwd = project root, where server/cli.py exists.
 */
function resolveCliPaths(): { cliPath: string; cwd: string } {
  const resourcesServer = (process as { resourcesPath?: string }).resourcesPath
    ? path.join((process as { resourcesPath?: string }).resourcesPath as string, 'server')
    : null;
  if (resourcesServer && fs.existsSync(path.join(resourcesServer, 'cli.py'))) {
    return { cliPath: path.join(resourcesServer, 'cli.py'), cwd: resourcesServer };
  }
  return { cliPath: path.join(process.cwd(), 'server', 'cli.py'), cwd: process.cwd() };
}

async function runCli(args: string[]): Promise<string> {
  const pythonBinaries = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];
  let lastError: any = null;
  const { cliPath, cwd } = resolveCliPaths();

  for (const bin of pythonBinaries) {
    try {
      const { stdout } = await execFileAsync(bin, [cliPath, ...args], {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONPATH: cwd }
      });
      return (stdout as string).trim();
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

interface StdinExecFileOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stdin?: NodeJS.ReadableStream | string | Buffer;
}

async function runCliWithStdin(args: string[], stdin: string): Promise<string> {
  const pythonBinaries = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];
  let lastError: any = null;
  const { cliPath, cwd } = resolveCliPaths();

  for (const bin of pythonBinaries) {
    try {
      const child = execFile(bin, [cliPath, ...args], {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
        encoding: 'utf8',
        env: { ...process.env, PYTHONPATH: cwd }
      });

      if (child.stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }

      return new Promise<string>((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        child.on('error', (err) => {
          reject(err);
        });

        child.stdout?.on('data', (chunk) => {
          stdout += String(chunk ?? '');
        });

        child.stderr?.on('data', (chunk) => {
          stderr += String(chunk ?? '');
        });

        child.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(stderr || `SIEM CLI exited with code ${code}`));
            return;
          }
          resolve(stdout.trim());
        });
      });
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
  const serialized = JSON.stringify(payload);

  // Avoid passing payloads as a command-line argument. Windows CreateProcess
  // caps a command line at ~32,767 characters, so execFile fails with
  // ENAMETOOLONG well below 64 KB. Keep the argv path only for tiny payloads
  // that are guaranteed to stay far below that OS limit; everything else is
  // ingested through stdin (ingest-stdin), which has no practical size limit.
  const STAGING_LIMIT = 16 * 1024;

  if (serialized.length <= STAGING_LIMIT) {
    // Small payloads keep using the existing argv-based ingest command, which is
    // still kept functional for any existing external callers.
    const output = await runCli(['ingest', serialized]);
    return JSON.parse(output);
  }

  // Larger payloads use the dedicated stdin ingestion path. The CLI still
  // receives only small fixed argv tokens and reads the JSON body from stdin.
  const output = await runCliWithStdin(['ingest-stdin'], serialized);
  return JSON.parse(output);
}

export async function ingestSecurityPayloadStdin(serialized: string): Promise<any> {
  // Internal convenience for callers that already have a serialized JSON batch
  // and want to force the stdin path regardless of size. Not part of the public
  // ingestSecurityPayload contract.
  const output = await runCliWithStdin(['ingest-stdin'], serialized);
  return JSON.parse(output);
}
