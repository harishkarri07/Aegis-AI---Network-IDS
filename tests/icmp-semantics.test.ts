/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression tests for the ICMP port-semantics fix.
 *
 * ICMP carries a type/code, NOT TCP/UDP ports. Prior to the fix the decoder
 * wrote ICMP type/code into srcPort/dstPort, which let ICMP packets masquerade
 * as port traffic: they polluted distinctDstPorts / portsToCurrentDst and could
 * feed auth/privileged-port heuristics. These tests pin down that:
 *   - ICMP type/code are never counted as TCP/UDP ports
 *   - ICMP traffic cannot inflate distinctDstPorts or portsToCurrentDst
 *   - normal TCP/UDP port tracking is unchanged
 *   - Probe detection is immune to ICMP type/code masquerading
 *   - DoS detection (including ICMP floods) still works
 */
import { FlowTracker } from '../src/lib/capture/flow-tracker';
import { DetectionEngine } from '../src/lib/capture/detection-engine';
import { PacketDecoder, DecodedPacketHeader } from '../src/lib/capture/packet-decoder';
import { createHighRateUdpPacket, createSynPacket, createCleanTcpPacket } from './fixtures';

/** Build a synthetic ICMP packet header. Ports are always 0 for ICMP. */
function icmpHeader(srcIp: string, dstIp: string, icmpType: number, icmpCode: number, totalLength: number = 74): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 0,
    dstPort: 0,
    protocol: 'ICMP',
    flags: [],
    payloadLength: totalLength - 42,
    totalLength,
    ttl: 64,
    isFragment: false,
    icmpType,
    icmpCode,
  };
}

/** Build a raw Ethernet/IPv4/ICMP frame for decoder-level tests. */
function rawIcmpFrame(icmpType: number, icmpCode: number): Buffer {
  const buf = Buffer.alloc(14 + 20 + 8);
  // Ethernet header (14 bytes)
  buf.set([0x00, 0x1a, 0x2b, 0x3c, 0x4d, 0x5e], 0); // dst MAC
  buf.set([0x54, 0xee, 0x75, 0x12, 0x34, 0x56], 6); // src MAC
  buf.writeUInt16BE(0x0800, 12); // EtherType IPv4
  // IPv4 header (20 bytes)
  buf[14] = 0x45;
  buf.writeUInt16BE(14 + 20 + 8, 16); // total length
  buf[23] = 1; // protocol ICMP
  buf.set([192, 168, 1, 50], 26); // src IP
  buf.set([8, 8, 8, 8], 30);      // dst IP
  // ICMP header (8 bytes)
  buf[34] = icmpType;
  buf[35] = icmpCode;
  return buf;
}

async function runIcmpSemanticsTests() {
  console.log('====================================================');
  console.log('   AEGIS NETWORK IDS — ICMP PORT SEMANTICS TESTS   ');
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
  // 1. Decoder: ICMP type/code are preserved in dedicated fields and
  //    NEVER written into srcPort/dstPort.
  // ------------------------------------------------------------------
  console.log('--- 1. Decoder: ICMP type/code are not ports ---');
  {
    const decoded = PacketDecoder.decode(rawIcmpFrame(8, 0)); // Echo request
    assert(decoded !== null, '1a: ICMP frame decodes');
    assert(decoded?.protocol === 'ICMP', '1b: ICMP frame identified as ICMP');
    assert(decoded?.icmpType === 8 && decoded?.icmpCode === 0, '1c: ICMP type/code preserved in dedicated fields',
      `got type=${decoded?.icmpType} code=${decoded?.icmpCode}`);
    assert(decoded?.srcPort === 0 && decoded?.dstPort === 0, '1d: ICMP srcPort/dstPort are 0, not type/code',
      `got srcPort=${decoded?.srcPort} dstPort=${decoded?.dstPort}`);
  }
  {
    const decoded = PacketDecoder.decode(rawIcmpFrame(3, 13)); // Dest unreachable / admin filtered
    assert(decoded?.icmpType === 3 && decoded?.icmpCode === 13, '1e: Non-zero ICMP type/code preserved',
      `got type=${decoded?.icmpType} code=${decoded?.icmpCode}`);
    assert(decoded?.srcPort === 0 && decoded?.dstPort === 0, '1f: Non-zero type/code still never become ports',
      `got srcPort=${decoded?.srcPort} dstPort=${decoded?.dstPort}`);
  }

  // ------------------------------------------------------------------
  // 2. FlowTracker: ICMP cannot inflate distinctDstPorts / portsToCurrentDst
  // ------------------------------------------------------------------
  console.log('--- 2. FlowTracker: ICMP does not inflate port statistics ---');
  DetectionEngine.resetForTesting();
  const tracker2 = new FlowTracker();
  let last2: any = null;
  // One source, one target, cycling through 20 distinct ICMP types.
  // If type/code masqueraded as ports, distinctDstPorts would reach 20.
  for (let i = 0; i < 60; i++) {
    const pkt = icmpHeader('198.51.100.200', '192.168.1.1', i % 20, i % 8);
    const { hostStats } = tracker2.update(pkt, now + i * 10);
    last2 = hostStats;
  }
  assert(last2.packetsInWindow === 60, '2a: ICMP packets still counted in the window',
    `got ${last2.packetsInWindow}`);
  assert(last2.distinctDstPorts === 0, '2b: 20 ICMP types produce 0 distinct ports',
    `got ${last2.distinctDstPorts}`);
  assert(last2.portsToCurrentDst === 0, '2c: 20 ICMP types produce 0 per-target ports',
    `got ${last2.portsToCurrentDst}`);
  assert(last2.distinctDstHosts === 1, '2d: ICMP hosts still tracked (protocol-agnostic)',
    `got ${last2.distinctDstHosts}`);

  // Defense in depth: even if a synthetic ICMP header carries a non-zero
  // dstPort (decoder regression), the tracker must not count it as a port.
  DetectionEngine.resetForTesting();
  const tracker2b = new FlowTracker();
  let last2b: any = null;
  for (let i = 0; i < 10; i++) {
    const pkt: DecodedPacketHeader = { ...icmpHeader('198.51.100.201', '192.168.1.1', 8, 0), dstPort: 22 };
    const { hostStats } = tracker2b.update(pkt, now + i * 10);
    last2b = hostStats;
  }
  assert(last2b.distinctDstPorts === 0, '2e: Tracker ignores dstPort on ICMP records (defense in depth)',
    `got ${last2b.distinctDstPorts}`);
  assert(last2b.authAttempts === 0, '2f: ICMP cannot trip auth-port heuristics even with dstPort=22',
    `got ${last2b.authAttempts}`);

  // ------------------------------------------------------------------
  // 3. Normal TCP/UDP port tracking is unchanged
  // ------------------------------------------------------------------
  console.log('--- 3. TCP/UDP port tracking unchanged ---');
  DetectionEngine.resetForTesting();
  const tracker3 = new FlowTracker();
  let last3: any = null;
  // TCP to 3 distinct ports on one host + UDP to one more port.
  for (let i = 0; i < 3; i++) {
    const pkt = createCleanTcpPacket('192.168.1.100', '142.250.190.46', [443, 80, 22][i]);
    const { hostStats } = tracker3.update(pkt, now + i * 100);
    last3 = hostStats;
  }
  const { hostStats: hostStatsUdp } = tracker3.update(
    createHighRateUdpPacket('192.168.1.100', '142.250.190.46', 53),
    now + 400
  );
  last3 = hostStatsUdp;
  assert(last3.distinctDstPorts === 4, '3a: TCP(443,80,22) + UDP(53) tracked as 4 distinct ports',
    `got ${last3.distinctDstPorts}`);
  assert(last3.portsToCurrentDst === 4, '3b: All 4 ports counted toward the single target host',
    `got ${last3.portsToCurrentDst}`);
  assert(last3.authAttempts === 1, '3c: TCP port 22 still increments auth attempts',
    `got ${last3.authAttempts}`);

  // ------------------------------------------------------------------
  // 4. Probe detection immune to ICMP type/code masquerading
  // ------------------------------------------------------------------
  console.log('--- 4. Probe detection immune to ICMP type/code ---');
  DetectionEngine.resetForTesting();
  const tracker4 = new FlowTracker();
  let probe4 = false;
  // 20 distinct ICMP types to ONE host would look like 20 distinct "ports"
  // under the old masquerading behavior — but must never trigger Probe.
  for (let i = 0; i < 40; i++) {
    const pkt = icmpHeader('198.51.100.202', '192.168.1.1', i % 20, i % 8);
    const t = now + i * 25;
    const { flow, hostStats } = tracker4.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') probe4 = true;
  }
  assert(!probe4, '4a: 20 ICMP types to one host do NOT trigger Probe');

  // Genuine probe still fires: 6+ TCP ports on one host with bare SYNs.
  DetectionEngine.resetForTesting();
  const tracker4b = new FlowTracker();
  let probe4b = false;
  let rule4b = '';
  for (let port = 20; port <= 40; port++) {
    const pkt = createSynPacket('198.51.100.203', '192.168.1.1', port);
    const t = now + port * 40;
    const { flow, hostStats } = tracker4b.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'Probe') {
      probe4b = true;
      rule4b = res.ruleTriggered || '';
    }
  }
  assert(probe4b, '4b: Genuine vertical TCP port scan still detected as Probe');
  assert(rule4b === 'PROBE_PORT_SCAN', '4c: Genuine scan still triggers PROBE_PORT_SCAN',
    `got ${rule4b || '(none)'}`);

  // ------------------------------------------------------------------
  // 5. DoS detection still works (incl. ICMP floods via DOS_RATE_FLOOD)
  // ------------------------------------------------------------------
  console.log('--- 5. DoS detection intact ---');
  DetectionEngine.resetForTesting();
  const tracker5 = new FlowTracker();
  let dosConfirmed5 = false;
  let dosRule5 = '';
  // ICMP echo flood: 5100 packets at 1ms. Window-normalized PPS peaks ~510,
  // single target, small packets -> must confirm DOS_RATE_FLOOD exactly like
  // the UDP flood in detection.test.ts 10B, with no port involvement.
  for (let i = 0; i < 5100; i++) {
    const pkt = icmpHeader('203.0.113.210', '192.168.1.1', 8, 0, 74);
    const t = now + i * 1;
    const { flow, hostStats } = tracker5.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') {
      dosConfirmed5 = true;
      dosRule5 = res.ruleTriggered || '';
    }
  }
  assert(dosConfirmed5, '5a: Sustained ICMP flood still confirmed as DoS');
  assert(dosRule5 === 'DOS_RATE_FLOOD', '5b: ICMP flood confirms DOS_RATE_FLOOD (rate detection intact)',
    `got ${dosRule5 || '(none)'}`);

  // And the UDP flood path (detection.test.ts 10B) still confirms.
  DetectionEngine.resetForTesting();
  const tracker5b = new FlowTracker();
  let dosConfirmed5b = false;
  let dosRule5b = '';
  for (let i = 0; i < 5100; i++) {
    const pkt = createHighRateUdpPacket('203.0.113.220', '192.168.1.1', 53);
    const t = now + i * 1;
    const { flow, hostStats } = tracker5b.update(pkt, t);
    const res = DetectionEngine.evaluate(pkt, flow, hostStats, t);
    if (res.category === 'DoS') {
      dosConfirmed5b = true;
      dosRule5b = res.ruleTriggered || '';
    }
  }
  assert(dosConfirmed5b, '5c: UDP flood still confirmed as DoS');
  assert(dosRule5b === 'DOS_RATE_FLOOD', '5d: UDP flood still triggers DOS_RATE_FLOOD',
    `got ${dosRule5b || '(none)'}`);

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runIcmpSemanticsTests().catch((err) => {
  console.error('ICMP semantics tests crashed:', err);
  process.exit(1);
});