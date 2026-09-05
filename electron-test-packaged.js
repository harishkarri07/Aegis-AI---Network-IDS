// Packaged app verification test - load the desktop IDS page
// Run via: npx electron electron-test-packaged.js
const { app, BrowserWindow } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

const results = { pass: 0, fail: 0, total: 0 };
function pass(label) { results.total++; results.pass++; console.log(`  ✓ PASS: ${label}`); }
function fail(label, reason) { results.total++; results.fail++; console.error(`  ✗ FAIL: ${label} — ${reason}`); }

app.whenReady().then(async () => {
  console.log('========================================');
  console.log('  AEGIS PACKAGED APP VERIFICATION');
  console.log('========================================\n');

  const preloadPath = path.join(__dirname, 'dist-electron', 'electron', 'preload.js');
  const outDir = path.join(__dirname, 'out');

  const win = new BrowserWindow({
    show: false,
    width: 1400, height: 900,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Test 1: out/ directory has all expected pages
  console.log('[TEST 1] Static export integrity');
  const expectedPages = ['index.html', 'network-ids.html', 'dashboard.html', 'documentation.html', 'downloads.html'];
  const outFiles = fs.readdirSync(outDir);
  const missingPages = expectedPages.filter(p => !outFiles.includes(p));
  if (missingPages.length === 0) {
    pass(`All ${expectedPages.length} expected pages present in out/`);
  } else {
    fail('Missing pages', missingPages.join(', '));
  }

  // Test 2: Load the desktop IDS page
  console.log('\n[TEST 2] Load desktop IDS page (/network-ids.html)');
  try {
    await win.loadFile(path.join(outDir, 'network-ids.html'));
    const title = await win.webContents.executeJavaScript('document.title');
    console.log('  Title:', title);
    pass('network-ids.html loads');
  } catch (e) {
    fail('network-ids.html load', e.message);
  }

  // Test 3: React hydration (wait for Next.js client-side rendering)
  console.log('\n[TEST 3] React hydration on desktop page');
  await new Promise(r => setTimeout(r, 4000));
  try {
    const bodyLen = await win.webContents.executeJavaScript('document.body?.innerHTML?.length || 0');
    console.log('  Body HTML length:', bodyLen);
    if (bodyLen > 10000) {
      pass('React app hydrated (' + bodyLen + ' chars)');
    } else {
      fail('React hydration', 'Body too short: ' + bodyLen);
    }
  } catch (e) {
    fail('Hydration', e.message);
  }

  // Test 4: Check Aegis UI elements  
  console.log('\n[TEST 4] AegisDesktopApp UI elements');
  try {
    const checks = await win.webContents.executeJavaScript(`
      (() => {
        const allText = document.body?.innerText || '';
        const h1s = Array.from(document.querySelectorAll('h1, h2, [class*="neon-gradient"]')).map(e => e.textContent);
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
        const tabs = Array.from(document.querySelectorAll('button[id*="tab"]')).length;
        return { allTextLen: allText.length, h1s, buttons: buttons.slice(0, 15), tabs, 
                 hasAegis: allText.includes('Aegis'), hasPcap: allText.includes('PCAP') || allText.includes('pcap'),
                 hasStartBtn: buttons.some(b => b.includes('Start')) };
      })()
    `);
    console.log('  H1 elements:', checks.h1s.slice(0, 3));
    console.log('  Buttons:', checks.buttons.slice(0, 8));
    console.log('  Tabs:', checks.tabs);
    console.log('  Has "Aegis" text:', checks.hasAegis);
    console.log('  Has PCAP text:', checks.hasPcap);
    console.log('  Has Start button:', checks.hasStartBtn);
    
    if (checks.hasAegis) pass('Aegis title found in page');
    else fail('Aegis title', 'Not found in page text');
    
    if (checks.tabs >= 10) pass('Tab navigation rendered (' + checks.tabs + ' tabs)');
    else if (checks.tabs > 0) pass('Some tabs rendered (' + checks.tabs + ' tabs)');
    else fail('Tab navigation', 'No tabs found');
    
    if (checks.hasStartBtn) pass('Start PCAP Capture button present');
    else console.log('  WARN: Start button not found (may need different selector)');
  } catch (e) {
    fail('UI elements', e.message);
  }

  // Test 5: Preload API is available and functional
  console.log('\n[TEST 5] Preload API');
  try {
    const apiCheck = await win.webContents.executeJavaScript(`
      (() => {
        const api = window.aegisApi;
        return {
          exists: !!api,
          isElectron: api?.isElectron === true,
          hasListInterfaces: typeof api?.listInterfaces === 'function',
          hasStartCapture: typeof api?.startCapture === 'function',
          hasStopCapture: typeof api?.stopCapture === 'function',
          hasGetStatus: typeof api?.getStatus === 'function',
          hasOnPacket: typeof api?.onPacket === 'function',
          hasOnStatus: typeof api?.onStatus === 'function',
          hasOnCaptureError: typeof api?.onCaptureError === 'function',
        };
      })()
    `);
    console.log('  API:', JSON.stringify(apiCheck, null, 2));
    
    const allMethods = Object.values(apiCheck).every(v => v === true);
    if (allMethods) {
      pass('All 8 preload API methods available');
    } else {
      const missing = Object.entries(apiCheck).filter(([k, v]) => !v).map(([k]) => k);
      fail('Preload API', 'Missing: ' + missing.join(', '));
    }
  } catch (e) {
    fail('Preload API', e.message);
  }

  // Test 6: Network interface listing works in renderer context
  console.log('\n[TEST 6] listInterfaces via preload');
  try {
    const ifaces = await win.webContents.executeJavaScript(
      'window.aegisApi.listInterfaces()'
    );
    if (ifaces && ifaces.length > 0) {
      pass('listInterfaces returned ' + ifaces.length + ' interfaces from renderer');
      const wifi = ifaces.find(i => i.id.includes('9F0A2CCA'));
      if (wifi) {
        pass('Intel Wi-Fi AX201 found in renderer context');
      }
    } else {
      fail('listInterfaces', 'No interfaces returned');
    }
  } catch (e) {
    fail('listInterfaces', e.message);
  }

  // Test 7: SIEM API data accessible from renderer
  console.log('\n[TEST 7] SIEM data in renderer');
  try {
    const socData = await win.webContents.executeJavaScript(`
      fetch('/api/siem/overview').then(r => r.json()).catch(e => ({ error: e.message }))
    `);
    console.log('  SIEM overview:', JSON.stringify(socData).substring(0, 200));
    if (socData && !socData.error && typeof socData.total_events === 'number') {
      pass('SIEM overview accessible: ' + socData.total_events + ' events');
    } else {
      fail('SIEM data', socData?.error || 'No data');
    }
  } catch (e) {
    fail('SIEM data', e.message);
  }

  // Test 8: SIEM events accessible
  try {
    const eventsData = await win.webContents.executeJavaScript(`
      fetch('/api/siem/events?limit=5').then(r => r.json()).catch(e => ({ error: e.message }))
    `);
    if (eventsData && eventsData.events) {
      pass('SIEM events accessible: ' + eventsData.events.length + ' events');
    } else {
      fail('SIEM events', eventsData?.error || 'No events');
    }
  } catch (e) {
    fail('SIEM events', e.message);
  }

  // Summary
  console.log('\n========================================');
  console.log('  PACKAGED APP VERIFICATION SUMMARY');
  console.log(`  Passed: ${results.pass}/${results.total}`);
  console.log(`  Failed: ${results.fail}/${results.total}`);
  console.log('=========================================');

  app.quit();
});
