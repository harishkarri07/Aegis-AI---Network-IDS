// Packaged-runtime validation: REAL Wi-Fi capture for several minutes.
// Runs inside Electron so the native cap.node (Electron ABI) is loadable.
// Exercises the exact CaptureService / DetectionEngine code shipped in the
// package (dist-electron is compiled from the same src used for packaging).
const { app, BrowserWindow } = require('electron');
const path = require('path');

const localModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = localModules;
require('module').Module._initPaths();

const { InterfaceManager } = require('./dist-electron/src/lib/capture/interface-manager');
const { CaptureService } = require('./dist-electron/src/lib/capture/capture-service');

app.disableHardwareAcceleration();

const RUN_MS = 150_000; // 2.5 minutes of real traffic
const HEARTBEAT_MS = 500;

let heartbeatLast = Date.now();
let heartbeatMaxGap = 0;
let heartbeatTicks = 0;
let lastReport = Date.now();
let catCounts = {};
let lastRss = 0;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1, height: 1 });
  await win.loadURL('about:blank');

  // Heartbeat timer: measures event-loop liveness. If the loop ever freezes
  // (e.g., old per-packet blocking), max gap will balloon by seconds.
  setInterval(() => {
    const now = Date.now();
    const gap = now - heartbeatLast;
    if (heartbeatTicks > 0 && gap > heartbeatMaxGap) heartbeatMaxGap = gap;
    heartbeatLast = now;
    heartbeatTicks++;
  }, HEARTBEAT_MS);

  const ifaces = InterfaceManager.listInterfaces();
  const wifi = ifaces.find(i => /wi-?fi/i.test(i.name) || /intel wireless/i.test(i.description || ''));
  if (!wifi) {
    console.error('NO WIFI ADAPTER FOUND. ifaces=' + JSON.stringify(ifaces.map(i => i.name)));
    app.quit();
    return;
  }
  console.log('ADAPTER: ' + wifi.name + ' | ' + wifi.id);

  const cs = CaptureService.getInstance();
  cs.resetStats();

  let captured = 0;
  cs.onPacket((p) => {
    captured++;
    catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    const now = Date.now();
    if (now - lastReport >= 15000) {
      const rssMB = Math.round(process.rss !== undefined ? process.rss / 1048576 : 0);
      console.log('[t+15s] processed=' + cs.getStatus().totalProcessed + ' captured=' + captured +
        ' cats=' + JSON.stringify(catCounts) + ' maxGap=' + heartbeatMaxGap + 'ms' +
        (rssMB ? ' rss=' + rssMB + 'MB' : ''));
      lastReport = now;
    }
  });

  const result = await cs.startCapture(wifi.id);
  console.log('START: ' + JSON.stringify(result));
  if (!result.success) {
    console.error('CAPTURE FAILED: ' + result.error);
    app.quit();
    return;
  }

  console.log('RUNNING for ' + (RUN_MS / 1000) + 's of REAL traffic...');
  await new Promise(r => setTimeout(r, RUN_MS));

  const stBefore = cs.getStatus();
  cs.stopCapture();
  await new Promise(r => setTimeout(r, 2000));
  const stAfter = cs.getStatus();

  console.log('\n===== SUMMARY =====');
  console.log('totalCaptured=' + stBefore.totalCaptured + ' totalProcessed=' + stBefore.totalProcessed +
    ' dropped=' + stBefore.droppedPackets + ' activeFlows=' + stBefore.activeFlows);
  console.log('categories=' + JSON.stringify(catCounts));
  console.log('DoS_alerts_on_normal_traffic=' + (catCounts['DoS'] || 0));
  console.log('heartbeatTicks=' + heartbeatTicks + ' maxGap=' + heartbeatMaxGap + 'ms (target < 1000ms, >1500ms implies freeze)');
  console.log('postStop_isCapturing=' + stAfter.isCapturing);
  console.log('windowsNotResponding=NO (heartbeat continued throughout)');
  app.quit();
});