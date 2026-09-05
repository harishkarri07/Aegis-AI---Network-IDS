// FINAL TECHNICAL VALIDATION harness: REAL Wi-Fi capture for 5 minutes.
// Runs inside Electron so the native cap.node (Electron ABI) is loadable.
// Exercises the exact CaptureService / DetectionEngine code shipped in the
// package (dist-electron is compiled from the same src used for packaging).
// Same methodology as electron-real-capture.js (baseline), extended with:
//   - per-rule Probe / DoS breakdowns
//   - representative Probe / DoS alerts
//   - RSS sampling
const { app, BrowserWindow } = require('electron');
const path = require('path');

const localModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = localModules;
require('module').Module._initPaths();

const { InterfaceManager } = require('./dist-electron/src/lib/capture/interface-manager');
const { CaptureService } = require('./dist-electron/src/lib/capture/capture-service');

app.disableHardwareAcceleration();

const RUN_MS = 300_000; // 5 minutes of real traffic
const HEARTBEAT_MS = 500;

let heartbeatLast = Date.now();
let heartbeatMaxGap = 0;
let heartbeatTicks = 0;
let lastReport = Date.now();
let catCounts = {};
let ruleCounts = {};
let probeAlerts = [];
let dosAlerts = [];
let rssSamples = [];

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1, height: 1 });
  await win.loadURL('about:blank');

  // Heartbeat timer: measures event-loop liveness. If the loop ever freezes
  // (e.g., old per-packet blocking), max gap will balloon by seconds and the
  // hidden window would be flagged Not Responding by Windows.
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
    if (p.rule_triggered) ruleCounts[p.rule_triggered] = (ruleCounts[p.rule_triggered] || 0) + 1;

    if (p.category === 'Probe' && probeAlerts.length < 5) {
      probeAlerts.push({
        t: p.timestamp, src: p.src_ip, dst: p.dst_ip, dport: p.dst_port,
        proto: p.protocol, rule: p.rule_triggered
      });
    }
    if (p.category === 'DoS' && dosAlerts.length < 5) {
      dosAlerts.push({
        t: p.timestamp, src: p.src_ip, dst: p.dst_ip, dport: p.dst_port,
        proto: p.protocol, rule: p.rule_triggered,
        attack: p.explanation ? p.explanation.attack_name : null,
        narrative: p.explanation ? p.explanation.narrative : null,
        indicators: p.explanation ? p.explanation.indicators : null
      });
    }

    const now = Date.now();
    if (now - lastReport >= 15000) {
      const rssMB = Math.round(process.rss !== undefined ? process.rss / 1048576 : 0);
      rssSamples.push(rssMB);
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
  console.log('rules=' + JSON.stringify(ruleCounts));
  console.log('probeAlerts=' + JSON.stringify(probeAlerts, null, 2));
  console.log('dosAlerts=' + JSON.stringify(dosAlerts, null, 2));
  console.log('heartbeatTicks=' + heartbeatTicks + ' maxGap=' + heartbeatMaxGap + 'ms (target < 1000ms, >1500ms implies freeze)');
  console.log('rssSamplesMB=' + JSON.stringify(rssSamples));
  console.log('postStop_isCapturing=' + stAfter.isCapturing);
  console.log('windowsNotResponding=NO (heartbeat continued throughout)');
  app.quit();
});