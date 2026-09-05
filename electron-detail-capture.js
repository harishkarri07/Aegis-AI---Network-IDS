// Detail capture: log every DoS and Probe alert with triggering stats,
// to determine whether they are genuine network activity or false positives.
const { app, BrowserWindow } = require('electron');
const path = require('path');
const localModules = path.join(__dirname, 'node_modules');
process.env.NODE_PATH = localModules;
require('module').Module._initPaths();
const { InterfaceManager } = require('./dist-electron/src/lib/capture/interface-manager');
const { CaptureService } = require('./dist-electron/src/lib/capture/capture-service');
app.disableHardwareAcceleration();

const RUN_MS = 90_000;
app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, width: 1, height: 1 });
  await win.loadURL('about:blank');
  const ifaces = InterfaceManager.listInterfaces();
  const wifi = ifaces.find(i => /wi-?fi/i.test(i.name) || /intel wireless/i.test(i.description || ''));
  if (!wifi) { console.error('NO WIFI'); app.quit(); return; }
  const cs = CaptureService.getInstance();
  cs.resetStats();
  cs.onPacket((p) => {
    if (p.category === 'DoS' || p.category === 'Probe') {
      console.log('ALERT ' + p.category + ' [' + p.rule_triggered + '] ' + p.src_ip + '->' + p.dst_ip + ':' + p.dst_port +
        ' conf=' + p.confidence + ' pps=' + (p.features ? p.features[6] : '?') +
        ' ports=' + (p.features ? p.features[7] : '?') + ' hosts=' + (p.features ? p.features[8] : '?') +
        ' syn=' + (p.features ? p.features[14] : '?') + ' ack=' + (p.features ? p.features[15] : '?') +
        ' ratio=' + (p.features ? p.features[16] : '?'));
    }
  });
  const r = await cs.startCapture(wifi.id);
  console.log('START=' + JSON.stringify(r));
  await new Promise(res => setTimeout(res, RUN_MS));
  cs.stopCapture();
  console.log('DONE totalProcessed=' + cs.getStatus().totalProcessed);
  app.quit();
});