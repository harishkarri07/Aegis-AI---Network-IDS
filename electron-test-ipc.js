// Electron IPC pipeline test
// Verifies: main process IPC handlers -> preload bridge -> renderer receives packets
// Run via: npx electron electron-test-ipc.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

const localModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = localModules;
require('module').Module._initPaths();

const { InterfaceManager } = require('./dist-electron/src/lib/capture/interface-manager');
const { CaptureService } = require('./dist-electron/src/lib/capture/capture-service');

const results = { pass: 0, fail: 0, total: 0 };
function pass(label) { results.total++; results.pass++; console.log(`  ✓ PASS: ${label}`); }
function fail(label, reason) { results.total++; results.fail++; console.error(`  ✗ FAIL: ${label} — ${reason}`); }

// ── Register the same IPC handlers as electron/main.ts ─────────────────
let unsubCapturePacket = null;
let unsubCaptureStatus = null;
let unsubCaptureError = null;

ipcMain.handle('aegis:list-interfaces', async () => {
  return InterfaceManager.listInterfaces();
});

ipcMain.handle('aegis:start-capture', async (event, interfaceId, pps) => {
  const captureService = CaptureService.getInstance();
  const win = BrowserWindow.fromWebContents(event.sender);

  // Clean up previous subscriptions
  if (unsubCapturePacket) unsubCapturePacket();
  if (unsubCaptureStatus) unsubCaptureStatus();
  if (unsubCaptureError) unsubCaptureError();

  // Register BEFORE startCapture so the initial status notification is not lost
  unsubCapturePacket = captureService.onPacket((packet) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('aegis:packet', packet);
    }
  });
  unsubCaptureStatus = captureService.onStatus((status) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('aegis:status', status);
    }
  });
  unsubCaptureError = captureService.onCaptureError((error) => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('aegis:capture-error', error);
    }
  });

  const result = await captureService.startCapture(interfaceId, pps);

  // If failed, clean up subscriptions
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
  if (unsubCapturePacket) { unsubCapturePacket(); unsubCapturePacket = null; }
  if (unsubCaptureStatus) { unsubCaptureStatus(); unsubCaptureStatus = null; }
  if (unsubCaptureError) { unsubCaptureError(); unsubCaptureError = null; }
  return { success: true };
});

ipcMain.handle('aegis:get-status', async () => {
  return CaptureService.getInstance().getStatus();
});

ipcMain.handle('aegis:explain-vector', async (event, category) => {
  return { attack_name: category, severity: 'INFO', narrative: 'Test', mitigation: 'N/A', indicators: [], top_features: [], icon: '✅' };
});

// ── Tests ──────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log('========================================');
  console.log('  AEGIS IPC PIPELINE TEST');
  console.log('  Running preload bridge verification');
  console.log('========================================\n');

  const preloadPath = path.join(__dirname, 'dist-electron', 'electron', 'preload.js');
  console.log('Preload exists:', require('fs').existsSync(preloadPath));

  const win = new BrowserWindow({
    show: false,
    width: 1, height: 1,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  await win.loadFile(path.join(__dirname, 'temp-ipc-test.html'));
  console.log('Page loaded. Polling for results...\n');

  let maxWait = 25000;
  let testDone = false;

  while (!testDone && maxWait > 0) {
    await new Promise(r => setTimeout(r, 1000));
    maxWait -= 1000;

    try {
      const status = await win.webContents.executeJavaScript(
        'document.getElementById("status")?.textContent || "no-element"'
      );
      const resultsHtml = await win.webContents.executeJavaScript(
        'document.getElementById("results")?.innerHTML || ""'
      );

      if (maxWait % 5000 < 1000) {
        console.log('  [poll] status=' + status);
      }

      if (status === 'DONE' || status?.startsWith('FAIL') || status?.startsWith('ERROR') || status?.startsWith('PARTIAL')) {
        testDone = true;

        const passCount = (resultsHtml || '').match(/class="pass"/g)?.length || 0;
        const failCount = (resultsHtml || '').match(/class="fail"/g)?.length || 0;

        console.log('\nIPC Test Results from Renderer:');
        if (resultsHtml) {
          const lines = resultsHtml.split(/<div /).map(d => {
            const isPass = d.includes('class="pass"');
            const text = d.replace(/<[^>]+>/g, '').trim();
            return text ? (isPass ? '  ✓ ' + text : '  ✗ ' + text) : null;
          }).filter(Boolean);
          lines.forEach(l => console.log(l));
        }

        console.log(`\n  Renderer reported: ${passCount} pass, ${failCount} fail`);

        if (failCount === 0 && passCount > 0) {
          pass('Full IPC pipeline: preload -> invoke -> CaptureService -> packets -> renderer');
        } else {
          fail('IPC pipeline', failCount + ' tests failed in renderer');
        }
      }
    } catch (e) {
      console.log('  [poll error]', e.message);
    }
  }

  if (!testDone) {
    fail('IPC test', 'Timed out after 25 seconds');
  }

  console.log('\n========================================');
  console.log('  IPC TEST SUMMARY');
  console.log(`  Passed: ${results.pass}/${results.total}`);
  console.log(`  Failed: ${results.fail}/${results.total}`);
  console.log('=========================================');

  app.quit();
});
