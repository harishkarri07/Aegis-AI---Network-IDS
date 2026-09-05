// Measure per-source average packet size for high-rate (>150 PPS) traffic
// over a 10s sliding window, to design an evidence-based rate-flood discriminator.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const localModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = localModules;
require('module').Module._initPaths();
const { InterfaceManager } = require('./dist-electron/src/lib/capture/interface-manager');
const { CaptureService } = require('./dist-electron/src/lib/capture/capture-service');
app.disableHardwareAcceleration();

const RUN_MS = 70_000;
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1, height: 1 });
  await win.loadURL('about:blank');
  const ifaces = InterfaceManager.listInterfaces();
  const wifi = ifaces.find(i => /wi-?fi/i.test(i.name) || /intel wireless/i.test(i.description || ''));
  if (!wifi) { console.error('NO WIFI'); app.quit(); return; }
  const cs = CaptureService.getInstance();
  cs.resetStats();

  // rolling per-src records
  const srcRecs = new Map(); // src -> array of {t,len}
  let lastLog = Date.now();
  cs.onPacket((p) => {
    const now = Date.now();
    let arr = srcRecs.get(p.src_ip);
    if (!arr) { arr = []; srcRecs.set(p.src_ip, arr); }
    arr.push({ t: now, len: p.length });
    const cutoff = now - 10000;
    while (arr.length && arr[0].t < cutoff) arr.shift();

    if (now - lastLog >= 10000) {
      lastLog = now;
      for (const [src, recs] of srcRecs) {
        const span = (recs[recs.length - 1].t - recs[0].t) / 1000 || 1;
        const pps = recs.length / span;
        if (pps > 150) {
          const total = recs.reduce((a, r) => a + r.len, 0);
          const avg = Math.round(total / recs.length);
          console.log('SRC ' + src + ' pps=' + Math.round(pps) + ' avgLen=' + avg +
            ' pkts=' + recs.length + ' srcPorts=' + (p.src_port) + ' dstPort=' + p.dst_port);
        }
      }
    }
  });
  const r = await cs.startCapture(wifi.id);
  console.log('START=' + (r.success ? 'OK' : 'FAIL'));
  await new Promise(res => setTimeout(res, RUN_MS));
  cs.stopCapture();
  console.log('DONE');
  app.quit();
});