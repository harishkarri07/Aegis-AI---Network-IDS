/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DecodedPacketHeader } from '../src/lib/capture/packet-decoder';

export function createCleanTcpPacket(srcIp: string = '192.168.1.100', dstIp: string = '142.250.190.46', dstPort: number = 443): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 54321,
    dstPort,
    protocol: 'TCP',
    flags: ['ACK'],
    payloadLength: 256,
    totalLength: 296,
    ttl: 64,
    isFragment: false,
  };
}

export function createDnsPacket(srcIp: string = '192.168.1.100', dstIp: string = '8.8.8.8'): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 53124,
    dstPort: 53,
    protocol: 'UDP',
    flags: [],
    payloadLength: 48,
    totalLength: 76,
    ttl: 64,
    isFragment: false,
  };
}

export function createSynPacket(srcIp: string, dstIp: string, dstPort: number): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 40000 + (dstPort % 20000),
    dstPort,
    protocol: 'TCP',
    flags: ['SYN'],
    payloadLength: 0,
    totalLength: 60,
    ttl: 64,
    isFragment: false,
  };
}

export function createAuthResetPacket(srcIp: string, dstIp: string, dstPort: number): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 50000,
    dstPort,
    protocol: 'TCP',
    flags: ['RST', 'ACK'],
    payloadLength: 0,
    totalLength: 60,
    ttl: 64,
    isFragment: false,
  };
}

// --- New fixtures for DoS state machine tests ---

/**
 * Create a high-rate UDP packet for flood testing.
 * Packets are sent from srcIp to dstIp at the given dstPort.
 */
export function createHighRateUdpPacket(srcIp: string, dstIp: string, dstPort: number = 53): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 60000 + (dstPort % 5000),
    dstPort,
    protocol: 'UDP',
    flags: [],
    payloadLength: 512,
    totalLength: 540,
    ttl: 64,
    isFragment: false,
  };
}

/**
 * Create a normal TCP ACK packet (representing a legitimate connection).
 */
export function createNormalTcpAckPacket(
  srcIp: string = '192.168.1.100',
  dstIp: string = '142.250.190.46',
  dstPort: number = 443
): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 54321,
    dstPort,
    protocol: 'TCP',
    flags: ['ACK'],
    payloadLength: 128,
    totalLength: 168,
    ttl: 64,
    isFragment: false,
  };
}

/**
 * Create a normal TCP SYN+ACK packet (part of a legitimate handshake response).
 */
export function createSynAckPacket(srcIp: string, dstIp: string, dstPort: number): DecodedPacketHeader {
  return {
    srcIp,
    dstIp,
    srcPort: 40000 + (dstPort % 20000),
    dstPort,
    protocol: 'TCP',
    flags: ['SYN', 'ACK'],
    payloadLength: 0,
    totalLength: 60,
    ttl: 64,
    isFragment: false,
  };
}
