/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Regression tests for FlowTracker rate calculation.
 *
 * Prior to the fix, computeHostStatsFromAccumulator normalized PPS/BPS over the
 * first-to-last packet timestamp span. When packets arrived with identical or
 * tightly clustered timestamps, that span collapsed toward zero and produced
 * artificially inflated packetsPerSecond / bytesPerSecond values.
 *
 * After the fix, PPS/BPS are normalized over the configured sliding-window
 * length, so timestamp clustering alone cannot manufacture huge rate values.
 */
import { FlowTracker } from '../src/lib/capture/flow-tracker';

const TEST_WINDOW_MS = 10_000;

function packetOf(
  srcIp: string,
  dstIp: string,
  dstPort: number,
  totalLength: number,
  timestampMs: number
): Parameters<FlowTracker["update"]>[0] {
  return {
    srcIp,
    dstIp,
    srcPort: 40000,
    dstPort,
    protocol: "TCP",
    flags: ["SYN"],
    payloadLength: totalLength - 60,
    totalLength,
    ttl: 64,
    isFragment: false
  };
}

async function runRateStatsTests() {
  console.log('============================================');
  console.log("   AEGIS NETWORK IDS — RATE STATS TESTS   ");
  console.log('============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(
    condition: boolean,
    testName: string,
    detail?: string
  ) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  const now = Date.now();

  // ------------------------------------------------------------------
  // 1. Identical timestamps across many packets.
  //    Before the fix, PPS/BPS could inflate toward infinity because the
  //    first-to-last timestamp span was near zero.
  //    After the fix, PPS/BPS are normalized over the sliding window.
  // ------------------------------------------------------------------
  console.log('--- 1. Identical timestamps ---');
  const tracker1 = new FlowTracker(TEST_WINDOW_MS);
  const identicalTs = now;
  const nIdentical = 100;
  const pktSize = 296;

  for (let i = 0; i < nIdentical; i++) {
    const pkt = packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, identicalTs);
    const { hostStats } = tracker1.update(pkt, identicalTs);
    if (i === nIdentical - 1) {
      assert(
        hostStats.packetsPerSecond < 30 && hostStats.packetsPerSecond > 5,
        "1: Identical-timestamp burst yields sensible PPS (< 30, > 5)",
        `got ${hostStats.packetsPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.bytesPerSecond < 10_000 && hostStats.bytesPerSecond > 1_000,
        "1: Identical-timestamp burst yields sensible BPS (< 10000, > 1000)",
        `got ${hostStats.bytesPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.observedSpanSeconds === 0,
        "1: Observed span is 0 for identical timestamps",
        `got ${hostStats.observedSpanSeconds}`
      );
      const expectedPps = nIdentical / (TEST_WINDOW_MS / 1000);
      const expectedBps = (nIdentical * pktSize) / (TEST_WINDOW_MS / 1000);
      assert(
        Math.abs(hostStats.packetsPerSecond - expectedPps) < 0.5,
        "1: Identical-timestamp PPS matches expected window-normalized value",
        `got ${hostStats.packetsPerSecond.toFixed(3)}, expected ${expectedPps.toFixed(3)}`
      );
      assert(
        Math.abs(hostStats.bytesPerSecond - expectedBps) < 0.5,
        "1: Identical-timestamp BPS matches expected window-normalized value",
        `got ${hostStats.bytesPerSecond.toFixed(3)}, expected ${expectedBps.toFixed(3)}`
      );
    }
  }

  // ------------------------------------------------------------------
  // 2. Tightly clustered timestamps.
  //    Packets arrive within a few milliseconds of each other. The observed
  //    span is small, but PPS/BPS should still be window-normalized.
  // ------------------------------------------------------------------
  console.log('--- 2. Tightly clustered timestamps ---');
  const tracker2 = new FlowTracker(TEST_WINDOW_MS);
  const clusterStart = now;
  const nCluster = 50;
  const clusterInterPacket = 2;

  for (let i = 0; i < nCluster; i++) {
    const pkt = packetOf(
      "192.168.1.100",
      "142.250.190.46",
      443,
      pktSize,
      clusterStart + i * clusterInterPacket
    );
    const { hostStats } = tracker2.update(
      pkt,
      clusterStart + i * clusterInterPacket
    );
    if (i === nCluster - 1) {
      assert(
        hostStats.packetsPerSecond < 15 && hostStats.packetsPerSecond > 2,
        "2: Clustered-timestamp burst yields sensible PPS (< 15, > 2)",
        `got ${hostStats.packetsPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.bytesPerSecond < 5_000 && hostStats.bytesPerSecond > 1_000,
        "2: Clustered-timestamp burst yields sensible BPS (< 5000, > 1000)",
        `got ${hostStats.bytesPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.observedSpanSeconds < 1 && hostStats.observedSpanSeconds >= 0,
        "2: Observed span is small for clustered timestamps",
        `got ${hostStats.observedSpanSeconds.toFixed(4)}`
      );
      const expectedPps = nCluster / (TEST_WINDOW_MS / 1000);
      const expectedBps = (nCluster * pktSize) / (TEST_WINDOW_MS / 1000);
      assert(
        Math.abs(hostStats.packetsPerSecond - expectedPps) < 0.5,
        "2: Clustered-timestamp PPS matches expected window-normalized value",
        `got ${hostStats.packetsPerSecond.toFixed(3)}, expected ${expectedPps.toFixed(3)}`
      );
      assert(
        Math.abs(hostStats.bytesPerSecond - expectedBps) < 0.5,
        "2: Clustered-timestamp BPS matches expected window-normalized value",
        `got ${hostStats.bytesPerSecond.toFixed(3)}, expected ${expectedBps.toFixed(3)}`
      );
    }
  }

  // ------------------------------------------------------------------
  // 3. Normally spaced timestamps.
  //    Packets arrive roughly once per second across the window. Should
  //    produce a rate near 1 PPS / ~296 BPS.
  // ------------------------------------------------------------------
  console.log('--- 3. Normally spaced timestamps ---');
  const tracker3 = new FlowTracker(TEST_WINDOW_MS);
  const normalStart = now;
  const nNormal = 10;
  const normalInterPacket = 1000;

  for (let i = 0; i < nNormal; i++) {
    const pkt = packetOf(
      "192.168.1.100",
      "142.250.190.46",
      443,
      pktSize,
      normalStart + i * normalInterPacket
    );
    const { hostStats } = tracker3.update(
      pkt,
      normalStart + i * normalInterPacket
    );
    if (i === nNormal - 1) {
      assert(
        hostStats.packetsPerSecond > 0.5 && hostStats.packetsPerSecond < 2.5,
        "3: Normal traffic yields low sensible PPS",
        `got ${hostStats.packetsPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.bytesPerSecond > 100 && hostStats.bytesPerSecond < 1_000,
        "3: Normal traffic yields low sensible BPS",
        `got ${hostStats.bytesPerSecond.toFixed(2)}`
      );
      assert(
        hostStats.observedSpanSeconds > 5 && hostStats.observedSpanSeconds <= 10,
        "3: Observed span reflects real spacing",
        `got ${hostStats.observedSpanSeconds.toFixed(3)}`
      );
    }
  }

  // ------------------------------------------------------------------
  // 4. Sliding-window expiration.
  //    Inject a burst, let the window age so old packets expire, then
  //    confirm the rate drops as the burst leaves the window.
  // ------------------------------------------------------------------
  console.log('--- 4. Sliding-window expiration ---');
  const tracker4 = new FlowTracker(TEST_WINDOW_MS);
  const burstTs = now;
  const nBurst = 200;

  for (let i = 0; i < nBurst; i++) {
    tracker4.update(
      packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, burstTs),
      burstTs
    );
  }

  {
    const { hostStats: statsAtBurst } = tracker4.update(
      packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, burstTs),
      burstTs
    );
    assert(
      statsAtBurst.packetsInWindow >= nBurst,
      "4: Burst packets are counted in window",
      `got packetsInWindow ${statsAtBurst.packetsInWindow}`
    );
    assert(
      statsAtBurst.packetsPerSecond > 10,
      "4: Burst yields elevated PPS while in window",
      `got ${statsAtBurst.packetsPerSecond.toFixed(2)}`
    );
  }

  // Push time forward past the window so the burst should expire.
  const expiredNow = burstTs + TEST_WINDOW_MS + 200;
  const { hostStats: statsAfterExpiry } = tracker4.update(
    packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, expiredNow),
    expiredNow
  );

  assert(
    statsAfterExpiry.packetsInWindow <= 1,
    "4: Burst packets expire and leave the window",
    `got packetsInWindow ${statsAfterExpiry.packetsInWindow}`
  );
  assert(
    statsAfterExpiry.packetsPerSecond < 5,
    "4: PPS drops after burst expires",
    `got ${statsAfterExpiry.packetsPerSecond.toFixed(2)}`
  );

  // ------------------------------------------------------------------
  // 5. No artificial huge PPS/BPS from timestamp clustering.
  //    This is the core safety assertion: even with identical timestamps
  //    and a 1000-packet burst, PPS/BPS must stay within the window-
  //    normalized ceiling.
  // ------------------------------------------------------------------
  console.log('--- 5. Timestamp clustering cannot create artificial huge PPS/BPS ---');
  const tracker5 = new FlowTracker(TEST_WINDOW_MS);
  const identicalTs2 = now;
  const nBig = 1000;

  for (let i = 0; i < nBig; i++) {
    tracker5.update(
      packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, identicalTs2),
      identicalTs2
    );
  }

  {
    const { hostStats } = tracker5.update(
      packetOf("192.168.1.100", "142.250.190.46", 443, pktSize, identicalTs2),
      identicalTs2
    );
    // The final probe update() above adds one more record, so the window
    // holds nBig + 1 packets when stats are read. The ceiling must account
    // for that packet or the assertion is off by exactly one window slot.
    const actualPackets = nBig + 1;
    const expectedPps = actualPackets / (TEST_WINDOW_MS / 1000);
    const expectedBps = (actualPackets * pktSize) / (TEST_WINDOW_MS / 1000);
    assert(
      hostStats.packetsPerSecond <= expectedPps,
      "5: Big identical-timestamp burst does NOT exceed window-normalized PPS ceiling",
      `got ${hostStats.packetsPerSecond.toFixed(3)}, ceiling ~${expectedPps.toFixed(3)}`
    );
    assert(
      hostStats.bytesPerSecond <= expectedBps,
      "5: Big identical-timestamp burst does NOT exceed window-normalized BPS ceiling",
      `got ${hostStats.bytesPerSecond.toFixed(3)}, ceiling ~${expectedBps.toFixed(3)}`
    );
  }


  console.log('\n============================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runRateStatsTests().catch((err) => {
  console.error("Rate stats tests crashed:", err);
  process.exit(1);
});
