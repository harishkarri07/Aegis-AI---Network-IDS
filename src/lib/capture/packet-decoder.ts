/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DecodedPacketHeader {
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'OTHER';
  flags: string[];
  payloadLength: number;
  totalLength: number;
  ttl: number;
  isFragment: boolean;
  seqNumber?: number;
  ackNumber?: number;
  windowSize?: number;
  icmpType?: number;
  icmpCode?: number;
}

/**
 * Defensive packet decoder for raw Ethernet / IPv4 frame buffers.
 * Safely decodes protocol headers without crashing on malformed or truncated packets.
 */
export class PacketDecoder {
  /**
   * Decode a raw packet buffer (Ethernet frame or raw IP packet).
   */
  public static decode(buffer: Buffer | Uint8Array): DecodedPacketHeader | null {
    try {
      if (!buffer || buffer.length < 14) {
        return null; // Truncated or empty frame
      }

      const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
      
      // Determine if this is an Ethernet frame (first 14 bytes: 6 dest MAC, 6 src MAC, 2 EtherType)
      // EtherType 0x0800 = IPv4, 0x86DD = IPv6, 0x0806 = ARP
      let ipOffset = 0;
      let etherType = (buf[12] << 8) | buf[13];

      if (etherType === 0x0800) {
        ipOffset = 14;
      } else if (etherType === 0x8100) {
        // 802.1Q VLAN tagged frame (additional 4 bytes)
        etherType = (buf[16] << 8) | buf[17];
        if (etherType === 0x0800) {
          ipOffset = 18;
        } else {
          return null; // Non-IPv4 VLAN
        }
      } else if ((buf[0] >> 4) === 4) {
        // Direct raw IPv4 packet without Ethernet header
        ipOffset = 0;
      } else {
        // Non-IPv4 frame
        return null;
      }

      if (buf.length < ipOffset + 20) {
        return null; // Truncated IP header
      }

      // Parse IPv4 Header
      const versionAndIhl = buf[ipOffset];
      const version = versionAndIhl >> 4;
      if (version !== 4) {
        return null; // Only IPv4 supported in this engine
      }

      const ihl = (versionAndIhl & 0x0f) * 4; // Internet Header Length in bytes
      if (ihl < 20 || buf.length < ipOffset + ihl) {
        return null; // Invalid IHL
      }

      const totalLength = (buf[ipOffset + 2] << 8) | buf[ipOffset + 3];
      const flagsAndFrag = (buf[ipOffset + 6] << 8) | buf[ipOffset + 7];
      const isFragment = (flagsAndFrag & 0x1fff) > 0 || (flagsAndFrag & 0x2000) > 0;
      const ttl = buf[ipOffset + 8];
      const protoNumber = buf[ipOffset + 9];

      const srcIp = `${buf[ipOffset + 12]}.${buf[ipOffset + 13]}.${buf[ipOffset + 14]}.${buf[ipOffset + 15]}`;
      const dstIp = `${buf[ipOffset + 16]}.${buf[ipOffset + 17]}.${buf[ipOffset + 18]}.${buf[ipOffset + 19]}`;

      const transportOffset = ipOffset + ihl;
      let protocol: 'TCP' | 'UDP' | 'ICMP' | 'OTHER' = 'OTHER';
      let srcPort = 0;
      let dstPort = 0;
      const flags: string[] = [];
      let payloadLength = Math.max(0, (totalLength || buf.length - ipOffset) - ihl);
      let seqNumber: number | undefined;
      let ackNumber: number | undefined;
      let windowSize: number | undefined;
      let icmpType: number | undefined;
      let icmpCode: number | undefined;

      if (protoNumber === 6) {
        // TCP
        protocol = 'TCP';
        if (buf.length >= transportOffset + 20) {
          srcPort = (buf[transportOffset] << 8) | buf[transportOffset + 1];
          dstPort = (buf[transportOffset + 2] << 8) | buf[transportOffset + 3];
          seqNumber = buf.readUInt32BE(transportOffset + 4);
          ackNumber = buf.readUInt32BE(transportOffset + 8);

          const tcpDataOffset = (buf[transportOffset + 12] >> 4) * 4;
          const tcpFlagsByte = buf[transportOffset + 13];

          if (tcpFlagsByte & 0x01) flags.push('FIN');
          if (tcpFlagsByte & 0x02) flags.push('SYN');
          if (tcpFlagsByte & 0x04) flags.push('RST');
          if (tcpFlagsByte & 0x08) flags.push('PSH');
          if (tcpFlagsByte & 0x10) flags.push('ACK');
          if (tcpFlagsByte & 0x20) flags.push('URG');

          windowSize = (buf[transportOffset + 14] << 8) | buf[transportOffset + 15];
          payloadLength = Math.max(0, (totalLength || buf.length - ipOffset) - ihl - tcpDataOffset);
        }
      } else if (protoNumber === 17) {
        // UDP
        protocol = 'UDP';
        if (buf.length >= transportOffset + 8) {
          srcPort = (buf[transportOffset] << 8) | buf[transportOffset + 1];
          dstPort = (buf[transportOffset + 2] << 8) | buf[transportOffset + 3];
          const udpLen = (buf[transportOffset + 4] << 8) | buf[transportOffset + 5];
          payloadLength = Math.max(0, udpLen - 8);
        }
      } else if (protoNumber === 1) {
        // ICMP — carries a type/code, NOT TCP/UDP ports. The type/code are kept
        // in the dedicated icmpType/icmpCode fields and srcPort/dstPort stay 0,
        // so ICMP packets never masquerade as port traffic downstream (port-based
        // statistics, auth/privileged port heuristics, and Probe port counting).
        protocol = 'ICMP';
        if (buf.length >= transportOffset + 4) {
          icmpType = buf[transportOffset];
          icmpCode = buf[transportOffset + 1];
          payloadLength = Math.max(0, (totalLength || buf.length - ipOffset) - ihl - 8);
        }
      }

      return {
        srcIp,
        dstIp,
        srcPort,
        dstPort,
        protocol,
        flags,
        payloadLength,
        totalLength: totalLength || buf.length - ipOffset,
        ttl,
        isFragment,
        seqNumber,
        ackNumber,
        windowSize,
        icmpType,
        icmpCode,
      };
    } catch {
      // Defensive: Return null on any parsing failure without crashing capture loop
      return null;
    }
  }
}
