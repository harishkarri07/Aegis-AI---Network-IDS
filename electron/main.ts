/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { app, BrowserWindow, ipcMain, globalShortcut, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { execFile } from 'child_process';
import { InterfaceManager } from '../src/lib/capture/interface-manager';
import { CaptureService } from '../src/lib/capture/capture-service';
import { DetectionEngine } from '../src/lib/capture/detection-engine';
import { AttackCategory, Packet } from '../src/types';
import { ingestSecurityPayload } from '../src/lib/siem-service';

let mainWindow: BrowserWindow | null = null;
let currentSelectedInterface: string = '';
let portServer: http.Server | null = null;

// --- SIEM API Proxy ---
// In production, the Next.js static export does not include API route handlers.
// This function runs the Python SIEM CLI and returns JSON to the renderer.
// Packaged apps: Python backend is in extraResources, out/ is in app.asar.unpacked.
function getPythonPaths(): { cliPath: string; cwd: string } {
  if (app.isPackaged) {
    // In packaged app, Python backend is copied to resources/ via extraResources
    return {
      cliPath: path.join(process.resourcesPath, 'server', 'cli.py'),
      cwd: process.resourcesPath,
    };
  }
  // In development, run from project root
  return {
    cliPath: path.join(__dirname, '../../server/cli.py'),
    cwd: path.join(__dirname, '../..'),
  };
}

function runSiemCli(args: string[]): Promise<string> {
  const pythonBinaries = process.platform === 'win32' ? ['python', 'python3', 'py'] : ['python3', 'python'];
  const { cliPath, cwd } = getPythonPaths();

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const tryNext = () => {
      if (attempts >= pythonBinaries.length) {
        reject(new Error('Python interpreter not found for SIEM backend'));
        return;
      }
      const bin = pythonBinaries[attempts++];
      execFile(bin, [cliPath, ...args], {
        cwd,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, PYTHONPATH: cwd }
      }, (err, stdout, stderr) => {
        if (err) {
          if ((err as any).code === 'ENOENT') {
            tryNext();
          } else {
            reject(new Error(stderr || err.message || 'SIEM CLI failed'));
          }
        } else {
          resolve(stdout.trim());
        }
      });
    };
    tryNext();
  });
}

function parseUrlParams(url: string): Record<string, string> {
  const parsed = new URL(url, 'http://localhost');
  const params: Record<string, string> = {};
  parsed.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

async function handleSiemApiRequest(
  pathname: string,
  method: string,
  reqBody: string | null,
  fullUrl: string
): Promise<{ status: number; data: string }> {
  try {
    // Route: GET /api/siem/overview
    if (pathname === '/api/siem/overview' && method === 'GET') {
      const result = await runSiemCli(['overview']);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/events?limit=X&...
    if (pathname === '/api/siem/events' && method === 'GET') {
      const params = parseUrlParams(fullUrl);
      const args = ['events'];
      if (params.limit) args.push('--limit', params.limit);
      if (params.offset) args.push('--offset', params.offset);
      if (params.hostname) args.push('--hostname', params.hostname);
      if (params['device-id']) args.push('--device-id', params['device-id']);
      if (params['event-type']) args.push('--event-type', params['event-type']);
      if (params.action) args.push('--action', params.action);
      if (params.status) args.push('--status', params.status);
      if (params['source-ip']) args.push('--source-ip', params['source-ip']);
      if (params.username) args.push('--username', params.username);
      if (params.search) args.push('--search', params.search);
      const result = await runSiemCli(args);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/alerts?limit=X&...
    if (pathname === '/api/siem/alerts' && method === 'GET') {
      const params = parseUrlParams(fullUrl);
      const args = ['alerts'];
      if (params.limit) args.push('--limit', params.limit);
      if (params.offset) args.push('--offset', params.offset);
      if (params.status) args.push('--status', params.status);
      if (params.severity) args.push('--severity', params.severity);
      if (params.hostname) args.push('--hostname', params.hostname);
      if (params['device-id']) args.push('--device-id', params['device-id']);
      const result = await runSiemCli(args);
      return { status: 200, data: result };
    }

    // Route: PATCH /api/siem/alerts (body-based alert status update)
    if (pathname === '/api/siem/alerts' && method === 'PATCH' && reqBody) {
      const body = JSON.parse(reqBody);
      const { alertId, status: newStatus } = body;
      if (!alertId || !newStatus) {
        return { status: 400, data: JSON.stringify({ error: 'Alert ID and status required' }) };
      }
      const result = await runSiemCli(['update-alert', alertId, newStatus]);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/incidents
    if (pathname === '/api/siem/incidents' && method === 'GET') {
      const result = await runSiemCli(['incidents']);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/devices
    if (pathname === '/api/siem/devices' && method === 'GET') {
      const result = await runSiemCli(['devices']);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/rules
    if (pathname === '/api/siem/rules' && method === 'GET') {
      const result = await runSiemCli(['rules']);
      return { status: 200, data: result };
    }

    // Route: GET /api/siem/reports?format=markdown
    if (pathname === '/api/siem/reports' && method === 'GET') {
      const params = parseUrlParams(fullUrl);
      const fmt = params.format || 'markdown';
      const result = await runSiemCli(['report', '--format', fmt]);
      // Return as plain text since ReportsView uses res.text()
      return { status: 200, data: result };
    }

    // Route: POST /api/siem/simulate (Attack Simulator)
    if (pathname === '/api/siem/simulate' && method === 'POST' && reqBody) {
      const body = JSON.parse(reqBody);
      const args = ['simulate', '--scenario', body.scenario || 'ssh_brute_force'];
      if (body.count) args.push('--count', String(body.count));
      if (body.hostname) args.push('--hostname', body.hostname);
      if (body.source_ip) args.push('--source-ip', body.source_ip);
      const result = await runSiemCli(args);
      return { status: 200, data: result };
    }

    // Unknown API route
    return { status: 404, data: JSON.stringify({ error: 'Unknown SIEM API route' }) };
  } catch (error: any) {
    console.error(`[SIEM API] Error handling ${pathname}:`, error.message);
    return { status: 500, data: JSON.stringify({ error: error.message }) };
  }
}



// Subscriptions to CaptureService internal callbacks → IPC bridge to renderer
let unsubCapturePacket: (() => void) | null = null;
let unsubCaptureStatus: (() => void) | null = null;
let unsubCaptureError: (() => void) | null = null;

// --- Main-process packet batching ---
// Packets are accumulated here and flushed to the renderer periodically.
// This prevents IPC flooding (thousands of webContents.send per second)
// and avoids spawning a Python child process per packet for SIEM ingestion.
let ipcPacketBuffer: Packet[] = [];
let siemPacketBuffer: Packet[] = [];
let ipcFlushTimer: ReturnType<typeof setInterval> | null = null;
let siemFlushTimer: ReturnType<typeof setInterval> | null = null;

// Convert a Packet and its embedded detection result to a SecurityEvent for SIEM ingestion
function packetToSecurityEvent(packet: Packet): any {
  // Determine severity hint from confidence
  let severityHint: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO' = 'LOW';
  if (packet.confidence >= 0.9) {
    severityHint = 'CRITICAL';
  } else if (packet.confidence >= 0.7) {
    severityHint = 'HIGH';
  } else if (packet.confidence >= 0.4) {
    severityHint = 'MEDIUM';
  } else {
    severityHint = 'LOW';
  }

  // Override severity if packet is not an anomaly
  if (!packet.is_anomaly) {
    severityHint = 'INFO';
  }

  return {
    id: packet.id || Math.random().toString(36).substr(2, 9),
    timestamp: packet.timestamp,
    received_at: new Date().toISOString(),
    hostname: require('os').hostname(),
    device_id: 'aegis-ids-' + require('os').hostname(), // Simple device ID based on hostname
    operating_system: require('os').type() + ' ' + require('os').release(), // e.g., 'Windows_NT 10.0.22000'
    agent_version: '1.0.0',
    source_ip: packet.src_ip,
    destination_ip: packet.dst_ip,
    source_port: packet.src_port ?? 0,
    destination_port: packet.dst_port,
    username: undefined, // Not available from packet capture
    event_type: 'network', // Generic network event
    action: packet.protocol, // e.g., 'TCP', 'UDP', 'ICMP'
    status: packet.is_anomaly ? 'attempt' : 'info',
    severity_hint: severityHint,
    raw_message: `${packet.src_ip}:${packet.src_port ?? 0} -> ${packet.dst_ip}:${packet.dst_port} via ${packet.protocol}`,
    metadata: {
      ...(packet.explanation && { explanation: packet.explanation }),
      ...(packet.features && { features: packet.features }),
      ...(packet.rule_triggered && { rule_triggered: packet.rule_triggered }),
      ...(packet.category && { attack_category: packet.category }),
      ...(packet.confidence && { confidence: packet.confidence }),
      ...(packet.iso_score && { iso_score: packet.iso_score }),
      ...(packet.binary && { binary: packet.binary }),
      interface: packet.interface,
      flags: packet.flags,
      length: packet.length
    },
    is_simulated: false
  };
}

// Function to find an available port
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object' && 'port' in address) {
        const port = address.port;
        server.close(() => {
          resolve(port);
        });
      } else {
        server.close(() => {
          reject(new Error('Unable to get port from server address'));
        });
      }
    });
    server.on('error', (err) => {
      server.close();
      reject(err);
    });
  });
}

// Function to serve static files
function serveStaticFile(res: http.ServerResponse, filePath: string, contentType: string = 'text/html'): void {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>500 Internal Server Error</h1><p>${err.message}</p>`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}

// Function to get content type based on file extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html';
    case '.css': return 'text/css';
    case '.js': return 'application/javascript';
    case '.json': return 'application/json';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.txt': return 'text/plain';
    default: return 'application/octet-stream';
  }
}

// Function to handle HTTP requests
function handleRequest(req: http.IncomingMessage, res: http.ServerResponse, outDirectory: string): void {
  // Parse URL
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
  let pathname = parsedUrl.pathname;

  // Prevent directory traversal
  if (pathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>');
    return;
  }

  // --- SIEM API Proxy ---
  // Intercept /api/siem/* requests and route to Python CLI
  if (pathname.startsWith('/api/siem/')) {
    const method = req.method || 'GET';
    let body = '';

    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      const { status, data } = await handleSiemApiRequest(pathname, method, body || null, req.url || '');
      res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(data);
    });
    return;
  }

  // Handle CORS preflight for API routes
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Default to index.html for root
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Construct the file path
  const filePath = path.join(outDirectory, pathname);

  // Security check: ensure the file is within the outDirectory
  const resolvedOutDir = path.resolve(outDirectory);
  const resolvedFilePath = path.resolve(filePath);
  if (!resolvedFilePath.startsWith(resolvedOutDir + path.sep) && resolvedFilePath !== resolvedOutDir) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>');
    return;
  }

  // Serve the file, with SPA fallback for Next.js static export
  // If the file doesn't exist and has no extension, try appending .html
  if (!fs.existsSync(filePath) && !path.extname(pathname)) {
    const htmlPath = filePath + '.html';
    if (fs.existsSync(htmlPath)) {
      serveStaticFile(res, htmlPath, 'text/html');
      return;
    }
  }
  const contentType = getContentType(filePath);
  serveStaticFile(res, filePath, contentType);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0e1a',
    title: 'Aegis AI — Stateful Network Intrusion Detection System',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Next.js app
  const startUrlProcess = process.env.START_URL;
  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

  let startUrl = '';
  if (startUrlProcess) {
    startUrl = startUrlProcess;
  } else if (isDev) {
    // Next.js dev server
    (async () => {
      try {
        const port = await getFreePort();
        startUrl = `http://localhost:${port}`;
        mainWindow.loadURL(startUrl);
      } catch (error) {
        console.error(`[Electron] Failed to get free port: ${error}`);
        // Fallback to http://localhost:3000
        startUrl = 'http://localhost:3000';
        mainWindow.loadURL(startUrl);
      }
    })();
  } else {
    // Production build — serve from local HTTP server so that
    // fetch('/api/siem/...') calls from the renderer hit the
    // SIEM API proxy in handleRequest instead of file:// (which
    // cannot resolve relative HTTP paths).
    // Use the asar path directly — Electron's asar module transparently
    // redirects reads from app.asar/out/ to app.asar.unpacked/out/ for
    // files listed in asarUnpack. Do NOT use 'app.asar.unpacked' in fs
    // paths as it triggers Electron's asar interception on the .asar
    // substring, causing hangs.
    const outDirectory = path.join(__dirname, '../../out');

    // Start static + API server first, then load the page
    portServer = http.createServer((req, res) => handleRequest(req, res, outDirectory));
    portServer.listen(3000, '127.0.0.1', () => {
      console.log('[Electron] Static + SIEM API server listening on http://localhost:3000');
      mainWindow.loadURL('http://localhost:3000/');
    });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC handlers for the native IDS functionality
ipcMain.handle('aegis:list-interfaces', async () => {
  return InterfaceManager.listInterfaces();
});

ipcMain.handle('aegis:start-capture', async (event, interfaceId: string, pps?: number) => {
  const captureService = CaptureService.getInstance();

  // Clean up any previous subscriptions before registering new ones
  if (unsubCapturePacket) unsubCapturePacket();
  if (unsubCaptureStatus) unsubCaptureStatus();
  if (unsubCaptureError) unsubCaptureError();

  // Wire CaptureService internal callbacks → IPC events to renderer.
  // Register BEFORE startCapture so the initial status notification
  // (fired inside startCapture) is not lost.
  //
  // CRITICAL PERFORMANCE FIX: Instead of sending every packet individually
  // via webContents.send() (which floods IPC and triggers renderer re-renders),
  // we buffer packets and flush them periodically.
  //
  // Additionally, SIEM ingestion (which spawns a Python child process per
  // batch) is throttled to avoid overwhelming the main process event loop.

  // Clear any leftover timers from a previous session
  if (ipcFlushTimer) { clearInterval(ipcFlushTimer); ipcFlushTimer = null; }
  if (siemFlushTimer) { clearInterval(siemFlushTimer); siemFlushTimer = null; }
  ipcPacketBuffer = [];
  siemPacketBuffer = [];

  unsubCapturePacket = captureService.onPacket((packet) => {
    // Buffer the packet for batched IPC delivery
    ipcPacketBuffer.push(packet);
    // Also buffer for SIEM ingestion (separate, slower cadence)
    siemPacketBuffer.push(packet);
  });

  // --- Maximum batch sizes to prevent large IPC/SIEM payloads ---
  // A single webContents.send() with thousands of Packet objects causes
  // significant V8 serialization/deserialization time and renderer work.
  const MAX_IPC_BATCH = 100;
  const MAX_SIEM_BATCH = 500;

  // Flush IPC buffer every 50 ms — sends up to MAX_IPC_BATCH packets per flush.
  // Excess packets remain in the buffer and are sent in the next tick.
  ipcFlushTimer = setInterval(() => {
    if (ipcPacketBuffer.length === 0) return;
    const count = Math.min(MAX_IPC_BATCH, ipcPacketBuffer.length);
    const batch = ipcPacketBuffer.splice(0, count);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis:packets', batch);
    }
  }, 50);

  // Flush SIEM buffer every 1 s — spawns one Python process per batch
  // instead of one per packet. Capped at MAX_SIEM_BATCH events per flush
  // to prevent huge command-line payloads and long Python processing times.
  // Excess events remain in the buffer for the next flush cycle.
  siemFlushTimer = setInterval(() => {
    if (siemPacketBuffer.length === 0) return;
    const count = Math.min(MAX_SIEM_BATCH, siemPacketBuffer.length);
    const batch = siemPacketBuffer.splice(0, count);
    try {
      const securityEvents = batch.map(packetToSecurityEvent);
      ingestSecurityPayload(securityEvents).catch(err => {
        console.error('Failed to ingest SIEM batch:', err);
      });
    } catch (err) {
      console.error('Error converting batch for SIEM:', err);
    }
  }, 1000);

  unsubCaptureStatus = captureService.onStatus((status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis:status', status);
    }
  });

  unsubCaptureError = captureService.onCaptureError((error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis:capture-error', error);
    }
  });

  const result = await captureService.startCapture(interfaceId, pps);

  // If startCapture failed, clean up the subscriptions
  if (!result.success) {
    if (unsubCapturePacket) { unsubCapturePacket(); unsubCapturePacket = null; }
    if (unsubCaptureStatus) { unsubCaptureStatus(); unsubCaptureStatus = null; }
    if (unsubCaptureError) { unsubCaptureError(); unsubCaptureError = null; }
  }

  return result;
});

ipcMain.handle('aegis:stop-capture', async () => {
  const captureService = CaptureService.getInstance();
  captureService.stopCapture();

  // Flush any remaining buffered packets to the renderer before stopping
  // Cap at MAX_IPC_BATCH to avoid one huge IPC message on shutdown
  if (ipcPacketBuffer.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
    const remaining = ipcPacketBuffer.splice(0, Math.min(100, ipcPacketBuffer.length));
    mainWindow.webContents.send('aegis:packets', remaining);
  }

  // Flush any remaining SIEM buffer (capped)
  if (siemPacketBuffer.length > 0) {
    const remaining = siemPacketBuffer.splice(0, Math.min(500, siemPacketBuffer.length));
    try {
      const securityEvents = remaining.map(packetToSecurityEvent);
      ingestSecurityPayload(securityEvents).catch(err => {
        console.error('Failed to ingest final SIEM batch:', err);
      });
    } catch (err) {
      console.error('Error converting final batch for SIEM:', err);
    }
  }

  // Clear batching timers
  if (ipcFlushTimer) { clearInterval(ipcFlushTimer); ipcFlushTimer = null; }
  if (siemFlushTimer) { clearInterval(siemFlushTimer); siemFlushTimer = null; }

  // Clean up CaptureService → IPC bridge subscriptions
  if (unsubCapturePacket) { unsubCapturePacket(); unsubCapturePacket = null; }
  if (unsubCaptureStatus) { unsubCaptureStatus(); unsubCaptureStatus = null; }
  if (unsubCaptureError) { unsubCaptureError(); unsubCaptureError = null; }

  return { success: true };
});

ipcMain.handle('aegis:get-status', async () => {
  const captureService = CaptureService.getInstance();
  return captureService.getStatus();
});

ipcMain.handle('aegis:explain-vector', async (event, category: AttackCategory) => {
  // Return a placeholder explanation for the given category
  // This is a temporary fix to avoid breaking the renderer if this IPC is used
  // In a full implementation, we would generate a real explanation based on the category
  // and current network state, but for now we return a static object.
  switch (category) {
    case 'DoS':
      return {
        attack_name: 'Denial of Service (DoS)',
        severity: 'CRITICAL',
        narrative: 'Volumetric rate flood or SYN exhaustion detected.',
        mitigation: 'Apply rate-limiting and SYN cookies.',
        indicators: [],
        top_features: [],
        icon: '🚫'
      };
    case 'Probe':
      return {
        attack_name: 'Network Probing / Port Scanning',
        severity: 'HIGH',
        narrative: 'Reconnaissance scanning pattern observed.',
        mitigation: 'Enforce port-scan drop rules.',
        indicators: [],
        top_features: [],
        icon: '🔍'
      };
    case 'R2L':
      return {
        attack_name: 'Remote-to-Local (R2L) Unauthorized Access',
        severity: 'HIGH',
        narrative: 'Brute-force credential interrogation detected.',
        mitigation: 'Use strong passwords and multi-factor authentication.',
        indicators: [],
        top_features: [],
        icon: '🔐'
      };
    case 'U2R':
      return {
        attack_name: 'User-to-Root (U2R) Privilege Escalation',
        severity: 'HIGH',
        narrative: 'Attempt to gain root access from a user account.',
        mitigation: 'Keep systems patched and limit user privileges.',
        indicators: [],
        top_features: [],
        icon: '⬆️'
      };
    case 'NORMAL':
    default:
      return {
        attack_name: 'Normal Traffic',
        severity: 'INFO',
        narrative: 'No malicious activity detected.',
        mitigation: 'N/A',
        indicators: [],
        top_features: [],
        icon: '✅'
      };
  }
});

// NOTE: Packet, status, and error events are now forwarded from CaptureService
// internal callbacks (wired in aegis:start-capture handler above) directly to
// the renderer via mainWindow.webContents.send(). The previous ipcMain.on()
// handlers were dead code because CaptureService fires JS callbacks, not IPC.
// They have been removed.

// Global shortcut for launching IDS (Ctrl+Shift+A)
app.whenReady().then(() => {
  const ret = globalShortcut.register('Ctrl+Shift+A', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('aegis:launch-ids');
    }
  });

  if (!ret) {
    console.log('[Electron] Global shortcut registration failed');
  }
});

// Clean up shortcuts on app quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});