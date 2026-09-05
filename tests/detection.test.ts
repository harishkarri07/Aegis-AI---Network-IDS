/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlowTracker } from '../src/lib/capture/flow-tracker';
import { DetectionEngine } from '../src/lib/capture/detection-engine';
import { PacketDecoder } from '../src/lib/capture/packet-decoder';
import { CaptureService } from '../src/lib/capture/capture-service';
import { InterfaceManager } from '../src/lib/capture/interface-manager';
import {
  createCleanTcpPacket,
  createDnsPacket,
  createSynPacket,
  createAuthResetPacket,
  createHighRateUdpPacket,
  createNormalTcpAckPacket
} from './fixtures';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   AEGIS NETWORK IDS — VERIFICATION TEST SUITE     ');
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

  // TEST 1: Packet Decoder - Ethernet / IPv4 / TCP
  console.log('--- 1. Packet Decoder & Header Extraction ---');
  const buffer = Buffer.alloc(74);
  // Ethernet Header (14 bytes)
  buffer.set([0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E], 0);
  buffer.set([0x54, 0xEE, 0x75, 0x12, 0x34, 0x56], 6);
  buffer.writeUInt16BE(0x0800, 12); // IPv4
  // IPv4 Header (20 bytes)
  buffer[14] = 0x45;
  buffer.writeUInt16BE(60, 16); // Total Length
  buffer[23] = 6; // Protocol TCP
  buffer.set([192, 168, 1, 50], 26); // Src IP
  buffer.set([192, 168, 1, 1], 30); // Dst IP
  // TCP Header (20 bytes)
  buffer.writeUInt16BE(49152, 34); // Src Port
  buffer.writeUInt16BE(443, 36); // Dst Port (HTTPS)
  buffer[46] = 0x50; // Data offset 5
  buffer[47] = 0x12; // SYN + ACK

  const decoded = PacketDecoder.decode(buffer);
  assert(decoded !== null, 'PacketDecoder parses valid Ethernet/IPv4/TCP frame');
  assert(decoded?.srcIp === '192.168.1.50', 'Extracts exact source IPv4: 192.168.1.50');
  assert(decoded?.dstIp === '192.168.1.1', 'Extracts exact dest IPv4: 192.168.1.1');
  assert(decoded?.dstPort === 443, 'Extracts destination port: 443');
  assert(decoded?.protocol === 'TCP', 'Identifies TCP protocol');
  assert(decoded?.flags.includes('SYN') && decoded?.flags.includes('ACK'), 'Extracts TCP SYN and ACK flags');

  // Truncated packet test
  const truncated = PacketDecoder.decode(Buffer.alloc(8));
  assert(truncated === null, 'Safely rejects truncated frames without throwing');

  // TEST 2: Normal Baseline Traffic (Zero False Positives)
  console.log('\n--- 2. Baseline Traffic & False Positive Resistance ---');
  const tracker1 = new FlowTracker();
  const cleanPacket = createCleanTcpPacket();
  const { flow: f1, hostStats: s1 } = tracker1.update(cleanPacket, Date.now());
  const res1 = DetectionEngine.evaluate(cleanPacket, f1, s1);
  assert(res1.category === 'NORMAL', 'Normal HTTPS traffic classified as NORMAL');
  assert(res1.is_anomaly === false, 'Normal HTTPS traffic is not flagged as anomaly');

  const dnsPacket = createDnsPacket();
  const { flow: fDns, hostStats: sDns } = tracker1.update(dnsPacket, Date.now());
  const resDns = DetectionEngine.evaluate(dnsPacket, fDns, sDns);
  assert(resDns.category === 'NORMAL', 'Standard DNS UDP traffic classified as NORMAL');

  // TEST 3: Denial of Service (DoS) — SYN Flood with State Machine
  // The state machine requires ≥3 seconds of sustained threshold crossing before confirmation.
  // We create 100 SYN packets spread over 5 seconds to exceed the confirmation duration.
  console.log('\n--- 3. Denial of Service (DoS) Flood Detection ---');
  DetectionEngine.resetForTesting();
  const trackerDos = new FlowTracker();
  const dosSrc = '203.0.113.10';
  const now = Date.now();
  let doSConfirmed = false;
  let doSResult: any = null;
  let dosPacketCount = 0;

  // STATE MACHINE TIMING NOTE:
  // The confirmation window (>= 3s) is measured from when the RAW threshold is
  // first crossed (the 50th SYN arrives at ~2.45s in this fixture), NOT from the
  // first packet. Therefore the attack must continue until at least ~5.45s
  // (t = now + 5450ms) before a DoS alert can confirm. 100 packets over 5s only
  // sustains ~2.55s past the threshold and would correctly NOT confirm.
  // Use 140 packets over 7s so the 3s sustained-evidence window is genuinely met.
  for (let i = 0; i < 140; i++) {
    const pkt: any = {
      srcIp: dosSrc,
      dstIp: '192.168.1.1',
      srcPort: 30000 + i,
      dstPort: 80,
      protocol: 'TCP',
      flags: ['SYN'],
      payloadLength: 0,
      totalLength: 64,
      ttl: 64,
      isFragment: false
    };
    const t = now + i * 50; // 50ms apart, total 5000ms
    const { flow, hostStats } = trackerDos.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') {
      doSConfirmed = true;
      doSResult = res;
      dosPacketCount++;
    }
  }

  assert(doSConfirmed, 'Sustained SYN flood confirmed as DoS after ≥3s');
  assert(doSResult?.ruleTriggered === 'DOS_SYN_FLOOD', 'Triggers DOS_SYN_FLOOD rule');
  assert(doSResult?.confidence > 0.80, `Produces strong deterministic confidence: ${(doSResult?.confidence * 100).toFixed(1)}%`);
  assert(dosPacketCount <= 2, `Only ${dosPacketCount} DoS alert(s) emitted for a sustained attack (not one per packet)`);

  // TEST 4: Probe (Vertical Port Scan & Horizontal Host Sweep)
  console.log('\n--- 4. Network Probing / Scanning Detection ---');
  DetectionEngine.resetForTesting();
  const trackerProbe = new FlowTracker();
  const probeSrc = '198.51.100.77';
  let latestProbeRes: any = null;

  // Scan across 10 distinct destination ports
  for (let port = 20; port <= 30; port++) {
    const pkt = createSynPacket(probeSrc, '192.168.1.10', port);
    const { flow, hostStats } = trackerProbe.update(pkt, now + port * 50);
    latestProbeRes = DetectionEngine.evaluate(pkt, flow, hostStats, now + port * 50);
  }

  assert(latestProbeRes.category === 'Probe', 'Vertical multi-port probe detected as Probe');
  assert(latestProbeRes.ruleTriggered === 'PROBE_PORT_SCAN', 'Triggers PROBE_PORT_SCAN rule');
  assert(latestProbeRes.explanation.indicators.some((ind: any) => ind.feature === 'distinct_dst_ports_on_target'), 'Includes per-target distinct_dst_ports_on_target indicator');

  // 4B: Horizontal host sweep - many hosts on a FOCUSED port set must detect PROBE_HOST_SWEEP
  DetectionEngine.resetForTesting();
  const trackerSweep = new FlowTracker();
  let sweepRes: any = null;
  for (let i = 0; i < 7; i++) {
    const pkt = createSynPacket('198.51.100.88', `192.168.1.${20 + i}`, 445);
    const t = now + i * 30;
    const { flow, hostStats } = trackerSweep.update(pkt, t);
    sweepRes = DetectionEngine.evaluate(pkt, flow, hostStats, t);
  }
  assert(sweepRes.category === 'Probe', '4B: 7 hosts probed on a single focused port detected as Probe');
  assert(sweepRes.ruleTriggered === 'PROBE_HOST_SWEEP', '4B: Triggers PROBE_HOST_SWEEP rule');

  // TEST 5: Remote-to-Local (R2L) Brute Force
  console.log('\n--- 5. Remote-to-Local (R2L) Authentication Probing ---');
  DetectionEngine.resetForTesting();
  const trackerR2l = new FlowTracker();
  const r2lSrc = '198.51.100.99';
  let latestR2lRes: any = null;

  // 4 repeated failed authentication connection resets on SSH port 22
  for (let i = 0; i < 4; i++) {
    const pkt = createAuthResetPacket(r2lSrc, '192.168.1.5', 22);
    const { flow, hostStats } = trackerR2l.update(pkt, now + i * 200);
    latestR2lRes = DetectionEngine.evaluate(pkt, flow, hostStats, now + i * 200);
  }

  assert(latestR2lRes.category === 'R2L', 'Repeated authentication resets classified as R2L');
  assert(latestR2lRes.ruleTriggered === 'R2L_AUTH_BRUTE_FORCE', 'Triggers R2L_AUTH_BRUTE_FORCE rule');

  // TEST 6: User-to-Root (U2R) Proxy Signal
  console.log('\n--- 6. User-to-Root (U2R) Proxy Signal Labelling ---');
  DetectionEngine.resetForTesting();
  const trackerU2r = new FlowTracker();
  const u2rSrc = '192.168.1.105';
  let latestU2rRes: any = null;

  for (let i = 0; i < 5; i++) {
    const pkt: any = {
      srcIp: u2rSrc,
      dstIp: '192.168.1.1',
      srcPort: 50123,
      dstPort: 445,
      protocol: 'TCP',
      flags: ['ACK', 'PSH'],
      payloadLength: 10000,
      totalLength: 10040,
      ttl: 64,
      isFragment: false
    };
    const { flow, hostStats } = trackerU2r.update(pkt, now + i * 1500);
    latestU2rRes = DetectionEngine.evaluate(pkt, flow, hostStats, now + i * 1500);
  }

  assert(latestU2rRes.category === 'U2R', 'Sustained privileged port burst classified as U2R');
  assert(latestU2rRes.explanation.attack_name.includes('Proxy Signal'), 'Honestly labeled as U2R Proxy Signal in narrative and alert name');

  // TEST 7: Capture Failure & Zero Synthetic Fallback
  console.log('\n--- 7. Capture Failure Handling & Zero Synthetic Fallback ---');
  const captureService = CaptureService.getInstance();
  captureService.resetStats();
  
  // Verify initial standby state
  const initialStatus = captureService.getStatus();
  assert(initialStatus.isCapturing === false, 'Engine initializes in Standby (isCapturing: false)');
  assert(initialStatus.totalCaptured === 0, 'Zero packets captured in standby');

  // TEST 8: Interface Validation & Windows Npcap Mapping
  console.log('\n--- 8. Interface Validation & Device Selection ---');
  // Attempting to start capture with empty or 'none' interface must fail cleanly
  const resEmpty = await captureService.startCapture('');
  assert(resEmpty.success === false, 'Rejects empty interface ID without crashing');
  assert(resEmpty.error?.includes('No network adapter selected') ?? false, 'Returns clear guidance for missing interface');

  const resNone = await captureService.startCapture('none');
  assert(resNone.success === false, "Rejects 'none' interface selection cleanly");

  // Verify InterfaceManager produces genuine interfaces or safe empty list without fake mock adapters
  const discoveredIfaces = InterfaceManager.listInterfaces();
  assert(Array.isArray(discoveredIfaces), 'InterfaceManager returns an array of interfaces');
  const hasFakeMock = discoveredIfaces.some(i => i.id === 'fake-wifi' || i.name.includes('Synthetic'));
  assert(hasFakeMock === false, 'Zero synthetic or hardcoded fake adapters returned');

  // ================================================================
  // NEW TESTS: DoS State Machine — False Positive Resistance
  // ================================================================

  console.log('\n--- 9. DoS State Machine: False Positive Resistance ---');

  // 9A: Normal TCP traffic should be classified as NORMAL
  DetectionEngine.resetForTesting();
  const tracker9a = new FlowTracker();
  let allNormal9a = true;
  for (let i = 0; i < 30; i++) {
    const pkt = createNormalTcpAckPacket('192.168.1.50', '142.250.190.46', 443);
    const t = now + i * 200; // Moderate rate
    const { flow, hostStats } = tracker9a.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category !== 'NORMAL') allNormal9a = false;
  }
  assert(allNormal9a, '9A: Normal TCP traffic (30 packets at moderate rate) classified as NORMAL');

  // 9B: Normal UDP traffic should be classified as NORMAL
  DetectionEngine.resetForTesting();
  const tracker9b = new FlowTracker();
  let allNormal9b = true;
  for (let i = 0; i < 30; i++) {
    const pkt = createDnsPacket('192.168.1.50', '8.8.8.8');
    const t = now + i * 300; // Normal DNS rate
    const { flow, hostStats } = tracker9b.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category !== 'NORMAL') allNormal9b = false;
  }
  assert(allNormal9b, '9B: Normal UDP traffic (30 packets at moderate rate) classified as NORMAL');

  // 9C: Temporary packet-rate spike should NOT trigger DoS (state machine stays in BUILDING)
  DetectionEngine.resetForTesting();
  const tracker9c = new FlowTracker();
  let doSCount9c = 0;
  // 80 SYN packets in 2 seconds — high rate but below 3s confirmation threshold
  for (let i = 0; i < 80; i++) {
    const pkt = createSynPacket('10.0.0.50', '192.168.1.1', 80);
    const t = now + i * 25; // 25ms apart = 2 seconds total
    const { flow, hostStats } = tracker9c.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSCount9c++;
  }
  assert(doSCount9c === 0, `9C: Temporary 2s spike produced ${doSCount9c} DoS alerts (expected 0 — below 3s confirmation)`);

  // 9D: Normal sustained TCP connection should NOT be DoS
  DetectionEngine.resetForTesting();
  const tracker9d = new FlowTracker();
  let doSCount9d = 0;
  // 200 TCP ACK packets over 10 seconds at 20 PPS — well below 200 PPS threshold
  for (let i = 0; i < 200; i++) {
    const pkt = createNormalTcpAckPacket('192.168.1.50', '142.250.190.46', 443);
    const t = now + i * 50; // 50ms apart = 10 seconds
    const { flow, hostStats } = tracker9d.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSCount9d++;
  }
  assert(doSCount9d === 0, `9D: Normal sustained TCP (200 packets over 10s) produced ${doSCount9d} DoS alerts (expected 0)`);

  // 9E: Legitimate HIGH-rate traffic spread across MANY distinct hosts should NOT be DoS.
  // RATE_FLOOD requires concentration (distinctDstHosts <= 10). A legitimately busy
  // client talking to 12+ different servers at >200 PPS must not trip the DoS rule.
  DetectionEngine.resetForTesting();
  const tracker9e = new FlowTracker();
  let doSCount9e = 0;
  // 1000 UDP packets over 4 seconds = ~250 PPS (above 200 PPS threshold),
  // but cycling across 12 distinct destination hosts triggers the concentration guard.
  const spreadHosts = ['198.51.100.1', '198.51.100.2', '198.51.100.3', '198.51.100.4',
    '198.51.100.5', '198.51.100.6', '198.51.100.7', '198.51.100.8',
    '198.51.100.9', '198.51.100.10', '198.51.100.11', '198.51.100.12'];
  for (let i = 0; i < 1000; i++) {
    const pkt = createHighRateUdpPacket('192.168.1.60', spreadHosts[i % spreadHosts.length], 53);
    const t = now + i * 4; // 4ms apart = 4 seconds
    const { flow, hostStats } = tracker9e.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSCount9e++;
  }
  assert(doSCount9e === 0,
    `9E: High-rate legitimate traffic to 12 distinct hosts produced ${doSCount9e} DoS alerts (expected 0 — concentration guard)`);

  // ================================================================
  // NEW TESTS: Genuine DoS Detection with State Machine
  // ================================================================

  console.log('\n--- 10. Genuine DoS Detection with State Machine ---');

  // 10A: Genuine sustained SYN flood should be CONFIRMED DoS
  DetectionEngine.resetForTesting();
  const tracker10a = new FlowTracker();
  let doSConfirmed10a = false;
  for (let i = 0; i < 150; i++) {
    const pkt = createSynPacket('203.0.113.50', '192.168.1.1', 80);
    const t = now + i * 40; // 40ms apart = 6 seconds
    const { flow, hostStats } = tracker10a.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSConfirmed10a = true;
  }
  assert(doSConfirmed10a, '10A: Genuine sustained SYN flood (150 SYNs over 6s) is confirmed DoS');

  // 10B: Genuine sustained UDP flood should be CONFIRMED DoS
  // Robust rather than boundary-dependent: instead of trusting that the run happens
  // to land exactly on the 3s confirmation edge, we instrument the run and assert on
  // comfortable margins, so small shifts in window/state-machine timing cannot
  // silently break the confirmation.
  DetectionEngine.resetForTesting();
  const tracker10b = new FlowTracker();
  const floodPacketCount10b = 5100; // ~5100 UDP packets at 1ms spacing (5.1s total)
  const floodSrc10b = '203.0.113.60';
  let doSConfirmed10b = false;
  let doSResult10b: any = null;
  let thresholdCrossIndex10b = -1; // first packet whose window stats meet the raw rate-flood threshold
  let thresholdCrossTime10b = 0;   // its timestamp
  let confirmIndex10b = -1;        // packet on which the state machine confirmed DoS
  let confirmTime10b = 0;          // its timestamp

  // After window-length PPS/BPS normalization, packetsPerSecond = packetsInWindow / 10,
  // so for this single-target stream the raw rate-flood threshold (packetsInWindow
  // >= 2000 OR packetsPerSecond >= 200) first trips when the window holds 2000
  // packets — near packet 2000 (~t = 2.0s). PPS then climbs toward ~510, far above
  // 200; the single destination keeps distinctDstHosts at 1 (<= 10 concentration
  // guard); and 540-byte packets keep avgBytesPerPacket < 1000 (small-packet
  // discriminator). Because the flood runs to ~5.1s at 1ms spacing, the threshold
  // stays satisfied across the entire 3s confirmation window and the confirming
  // packet lands well before the loop ends.
  for (let i = 0; i < floodPacketCount10b; i++) {
    const pkt = createHighRateUdpPacket(floodSrc10b, '192.168.1.1', 53);
    const t = now + i * 1; // 1ms spacing: enough spread for 3s confirmation window
    const { flow, hostStats } = tracker10b.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') {
      if (!doSConfirmed10b) {
        confirmIndex10b = i;
        confirmTime10b = t;
      }
      doSConfirmed10b = true;
      doSResult10b = res;
    }
    if (hostStats.packetsInWindow >= 2000) {
      if (thresholdCrossIndex10b === -1) {
        thresholdCrossIndex10b = i;
        thresholdCrossTime10b = t;
      }
    }
  }
  const floodEndTime10b = now + (floodPacketCount10b - 1) * 1;
  const sustainedMs10b = floodEndTime10b - thresholdCrossTime10b;

  assert(doSConfirmed10b, '10B: Genuine sustained UDP flood (~5100 pkts, 1ms apart) is confirmed DoS');
  assert(doSResult10b?.ruleTriggered === 'DOS_RATE_FLOOD', '10B: Triggers DOS_RATE_FLOOD rule for UDP flood');
  assert(thresholdCrossIndex10b !== -1 && thresholdCrossIndex10b <= 2600,
    `10B: Rate threshold crossed well before test end (crossed at packet ${thresholdCrossIndex10b + 1} of ${floodPacketCount10b}; ~${(sustainedMs10b / 1000).toFixed(1)}s of flood still to follow)`);
  assert(thresholdCrossIndex10b !== -1 && sustainedMs10b >= 3000,
    `10B: Threshold remains satisfied for at least 3s (sustained ${(sustainedMs10b / 1000).toFixed(1)}s after crossing)`);
  assert(confirmIndex10b !== -1 && (confirmTime10b - thresholdCrossTime10b) >= 3000,
    `10B: Confirmation duration not weakened (confirm fired ${((confirmTime10b - thresholdCrossTime10b) / 1000).toFixed(1)}s after threshold crossed)`);
  assert(confirmIndex10b !== -1 && confirmIndex10b <= floodPacketCount10b - 50,
    `10B: Confirming packet lands comfortably inside the loop (packet ${confirmIndex10b + 1}; ${floodPacketCount10b - 1 - confirmIndex10b} packets still follow)`);
  assert(doSResult10b?.confidence > 0.80,
    `10B: Produces strong deterministic confidence: ${(doSResult10b?.confidence * 100).toFixed(1)}%`);

  // 10C: One confirmed alert per sustained attack, NOT one per packet
  DetectionEngine.resetForTesting();
  const tracker10c = new FlowTracker();
  let doSCount10c = 0;
  // 300 SYN packets over 10 seconds — sustained attack
  for (let i = 0; i < 300; i++) {
    const pkt = createSynPacket('203.0.113.70', '192.168.1.1', 80);
    const t = now + i * 33; // 33ms apart ≈ 10 seconds
    const { flow, hostStats } = tracker10c.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSCount10c++;
  }
  assert(doSCount10c >= 1 && doSCount10c <= 3,
    `10C: 300-packet sustained attack produced ${doSCount10c} DoS alert(s) (expected 1-3, NOT 300)`);
  assert(doSCount10c < 30,
    `10C: DoS alert count (${doSCount10c}) is drastically less than packet count (300) — state machine suppresses flood`);

  // 10D: Recovery after attack stops — state returns to IDLE
  DetectionEngine.resetForTesting();
  const tracker10d = new FlowTracker();
  // Phase 1: Sustain attack for 5 seconds
  for (let i = 0; i < 125; i++) {
    const pkt = createSynPacket('203.0.113.80', '192.168.1.1', 80);
    const t = now + i * 40; // 40ms apart = 5 seconds
    const { flow, hostStats } = tracker10d.update(pkt, t);
    DetectionEngine.evaluate(pkt, flow, hostStats, t);
  }
  // Phase 2: Wait for cooldown to expire (30s) then send normal traffic
  const postAttackStart = now + 5000 + 31000; // 31 seconds after attack start (beyond 30s cooldown)
  let recoveredToNormal = false;
  for (let i = 0; i < 20; i++) {
    const pkt = createNormalTcpAckPacket('192.168.1.50', '142.250.190.46', 443);
    const t = postAttackStart + i * 500;
    const { flow, hostStats } = tracker10d.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'NORMAL') recoveredToNormal = true;
  }
  assert(recoveredToNormal, '10D: After attack stops and cooldown expires, detector recovers to NORMAL');

  // 10E: Re-detection after cooldown — new attacks can be detected
  DetectionEngine.resetForTesting();
  const tracker10e = new FlowTracker();
  let firstAttackDetected = false;
  let secondAttackDetected = false;

  // Attack 1: 5 seconds of SYNs
  for (let i = 0; i < 125; i++) {
    const pkt = createSynPacket('203.0.113.90', '192.168.1.1', 80);
    const t = now + i * 40;
    const { flow, hostStats } = tracker10e.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') firstAttackDetected = true;
  }

  // Wait for cooldown (31 seconds) then attack again
  const attack2Start = now + 5000 + 31000;
  for (let i = 0; i < 125; i++) {
    const pkt = createSynPacket('203.0.113.90', '192.168.1.1', 80);
    const t = attack2Start + i * 40;
    const { flow, hostStats } = tracker10e.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') secondAttackDetected = true;
  }

  assert(firstAttackDetected, '10E: First DoS attack detected');
  assert(secondAttackDetected, '10E: Second DoS attack detected after cooldown — re-detection works');

  // 10F: Legitimate high-rate CDN/video STREAMING (large packets) must NOT be DoS.
  // Evidence: real Wi-Fi capture showed Google/YouTube CDN streams sustain
  // 250-565 PPS with avg packet size ~1265 bytes; the RATE_FLOOD rule now requires
  // avgBytesPerPacket < 1000 (volumetric floods use small packets). This fixture
  // emits 250 PPS of ~1265-byte packets for 4s - indistinguishable in rate from a
  // flood, but large-packet streaming traffic. Must remain NORMAL, not DoS.
  DetectionEngine.resetForTesting();
  const tracker10f = new FlowTracker();
  let doSCount10f = 0;
  for (let i = 0; i < 1000; i++) {
    const pkt: any = {
      srcIp: '203.0.113.100',
      dstIp: '173.194.154.70',
      srcPort: 443,
      dstPort: 50000,
      protocol: 'UDP',
      flags: [],
      payloadLength: 1235,
      totalLength: 1265,
      ttl: 64,
      isFragment: false
    };
    const t = now + i * 4; // 4ms apart = ~250 PPS for 4 seconds
    const { flow, hostStats } = tracker10f.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') doSCount10f++;
  }
  assert(doSCount10f === 0,
    `10F: High-rate streaming-profile traffic (250 PPS, ~1265B avg) produced ${doSCount10f} DoS alerts (expected 0 — avgBytesPerPacket guard)`);

  // ================================================================
  // NEW TESTS: ExplainVector with State Machine bypass
  // ================================================================

  console.log('\n--- 11. ExplainVector State Machine Bypass ---');
  DetectionEngine.resetForTesting();

  const dosExplanation = DetectionEngine.explainVector('DoS');
  assert(dosExplanation.attack_name.includes('DoS'), '11A: explainVector("DoS") produces DoS explanation');
  assert(dosExplanation.severity === 'CRITICAL', '11B: explainVector("DoS") severity is CRITICAL');

  const normalExplanation = DetectionEngine.explainVector('NORMAL');
  assert(normalExplanation.attack_name.includes('Normal'), '11C: explainVector("NORMAL") produces Normal explanation');

  // ================================================================

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
