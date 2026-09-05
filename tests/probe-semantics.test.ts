/** Minimal regression tests for Probe rule semantics.

These tests verify that the Probe rules in DetectionEngine distinguish
real scan behavior from normal client traffic (browsing, CDN, multi-service)
while still detecting genuine vertical scans, host sweeps, and SYN stealth scans.

This file is intentionally small and focused on the Probe category only.
*/
import { FlowTracker } from '../src/lib/capture/flow-tracker';
import { DetectionEngine } from '../src/lib/capture/detection-engine';
import { createCleanTcpPacket, createSynPacket } from './fixtures';

async function runProbeTests() {
  console.log('====================================================');
  console.log('   AEGIS NETWORK IDS — PROBE SEMANTICS TESTS       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  const now = Date.now();

  // ------------------------------------------------------------------
  // A. Normal browser-like traffic: one source hitting many external
  //    hosts over a realistic port mix (HTTPS/HTTP/DNS/QUIC-ish).
  //    Handshakes complete (SYN followed by ACK), so the SYN:ACK ratio
  //    stays ~1.0 and the port mix spans more than 3 distinct ports.
  //    Expected: NOT Probe.
  // ------------------------------------------------------------------
  console.log('--- A. Normal browser-like multi-host traffic ---');
  DetectionEngine.resetForTesting();
  const trackerA = new FlowTracker();
  let probeA = false;
  const browserHosts = [
    '142.250.1.1',
    '142.250.1.2',
    '142.250.1.3',
    '142.250.1.4',
    '142.250.1.5',
    '142.250.1.6',
  ];
  const browserPorts = [443, 80, 53, 8443, 8080];
  for (let i = 0; i < 60; i++) {
    const host = browserHosts[i % browserHosts.length];
    const dstPort = browserPorts[i % browserPorts.length];
    const pkt = i % 2 === 0
      ? createSynPacket('192.168.1.100', host, dstPort)
      : createCleanTcpPacket('192.168.1.100', host, dstPort); // completed handshake (ACK)
    const t = now + i * 150;
    const { flow, hostStats } = trackerA.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') probeA = true;
  }
  assert(!probeA, 'A: Browser-like traffic (many hosts, mixed HTTPS/DNS ports, completed handshakes) is NOT Probe');

  // ------------------------------------------------------------------
  // B. Normal CDN traffic: one source hits many destination IPs across
  //    a CDN-like port set (HTTPS 443, HTTP 80, 8080/8443 alts) with
  //    completed handshakes. The >3-port spread keeps the host-sweep
  //    guard from firing on routine multi-host web use.
  //    Expected: NOT Probe.
  // ------------------------------------------------------------------
  console.log('--- B. Normal CDN / many-hosts traffic ---');
  DetectionEngine.resetForTesting();
  const trackerB = new FlowTracker();
  let probeB = false;
  const cdnHosts = [
    '173.194.1.1',
    '173.194.1.2',
    '173.194.1.3',
    '173.194.1.4',
    '173.194.1.5',
    '173.194.1.6',
    '173.194.1.7',
    '173.194.1.8',
    '173.194.1.9',
    '173.194.1.10',
    '173.194.1.11',
    '173.194.1.12',
  ];
  const cdnPorts = [443, 80, 8080, 8443];
  for (let i = 0; i < 120; i++) {
    const host = cdnHosts[i % cdnHosts.length];
    const dstPort = cdnPorts[i % cdnPorts.length];
    const pkt = i % 2 === 0
      ? createSynPacket('192.168.1.100', host, dstPort)
      : createCleanTcpPacket('192.168.1.100', host, dstPort); // completed handshake (ACK)
    const t = now + i * 80;
    const { flow, hostStats } = trackerB.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') probeB = true;
  }
  assert(!probeB, 'B: CDN-like traffic (many hosts, multi-port, completed handshakes) is NOT Probe');

  // ------------------------------------------------------------------
  // C. Legitimate multi-service client: distinct common service ports
  //    across several hosts, with completed handshakes.
  //    Expected: NOT Probe.
  // ------------------------------------------------------------------
  console.log('--- C. Legitimate multi-service client traffic ---');
  DetectionEngine.resetForTesting();
  const trackerC = new FlowTracker();
  let probeC = false;
  const services = [
    { host: '198.51.100.10', port: 443 },
    { host: '198.51.100.11', port: 80 },
    { host: '198.51.100.12', port: 53 },
    { host: '198.51.100.13', port: 8080 },
    { host: '198.51.100.14', port: 8443 },
  ];
  for (let i = 0; i < 60; i++) {
    const svc = services[i % services.length];
    const pkt = i % 2 === 0
      ? createSynPacket('192.168.1.100', svc.host, svc.port)
      : createCleanTcpPacket('192.168.1.100', svc.host, svc.port); // completed handshake (ACK)
    const t = now + i * 120;
    const { flow, hostStats } = trackerC.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') probeC = true;
  }
  assert(!probeC, 'C: Legitimate multi-service client is NOT Probe');

  // ------------------------------------------------------------------
  // D. Genuine vertical port scan: one source rapidly probes many
  //    ports on ONE target.
  //    Expected: Probe.
  // ------------------------------------------------------------------
  console.log('--- D. Genuine vertical port scan ---');
  DetectionEngine.resetForTesting();
  const trackerD = new FlowTracker();
  let probeD = false;
  let ruleD = '';
  for (let port = 20; port <= 120; port++) {
    const pkt = createSynPacket('198.51.100.77', '192.168.1.10', port);
    const t = now + port * 40;
    const { flow, hostStats } = trackerD.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') {
      probeD = true;
      ruleD = res.ruleTriggered || '';
    }
  }
  assert(probeD, 'D: Vertical multi-port probe IS Probe');
  assert(ruleD === 'PROBE_PORT_SCAN', 'D: Vertical scan triggers PROBE_PORT_SCAN',
    `got ${ruleD ? ruleD : '(none)'}`);

  // ------------------------------------------------------------------
  // E. Genuine horizontal host sweep: one source probes the SAME port
  //    across many hosts.
  //    Expected: Probe.
  // ------------------------------------------------------------------
  console.log('--- E. Genuine horizontal host sweep ---');
  DetectionEngine.resetForTesting();
  const trackerE = new FlowTracker();
  let probeE = false;
  let ruleE = '';
  for (let i = 0; i < 8; i++) {
    const host = `192.168.1.${20 + i}`;
    const pkt = createSynPacket('198.51.100.88', host, 445);
    const t = now + i * 30;
    const { flow, hostStats } = trackerE.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') {
      probeE = true;
      ruleE = res.ruleTriggered || '';
    }
  }
  assert(probeE, 'E: Horizontal host sweep IS Probe');
  assert(ruleE === 'PROBE_HOST_SWEEP', 'E: Host sweep triggers PROBE_HOST_SWEEP',
    `got ${ruleE ? ruleE : '(none)'}`);

  // ------------------------------------------------------------------
  // F. Genuine SYN stealth scan: bare SYN probes across a SMALL set of
  //    ports (4-5) on ONE host. Below 6 ports the vertical-scan rule
  //    (PROBE_PORT_SCAN) does not fire, so the stealth rule — bare SYN
  //    with >= 4 ports on one target — is the one that matches.
  //    Expected: Probe (PROBE_SYN_STEALTH).
  // ------------------------------------------------------------------
  console.log('--- F. Genuine SYN stealth scan ---');
  DetectionEngine.resetForTesting();
  const trackerF = new FlowTracker();
  let probeF = false;
  let ruleF = '';
  for (let port = 20; port <= 24; port++) {
    const pkt = createSynPacket('198.51.100.99', '192.168.1.10', port);
    const t = now + port * 40;
    const { flow, hostStats } = trackerF.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') {
      probeF = true;
      ruleF = res.ruleTriggered || '';
    }
  }
  assert(probeF, 'F: SYN stealth scan IS Probe');
  assert(ruleF === 'PROBE_SYN_STEALTH', 'F: SYN stealth scan triggers PROBE_SYN_STEALTH',
    `got ${ruleF ? ruleF : '(none)'}`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProbeTests().catch(err => {
  console.error('Probe tests crashed:', err);
  process.exit(1);
});
