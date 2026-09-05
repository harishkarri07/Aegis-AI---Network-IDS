/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import os from 'os';
import { NetworkInterfaceInfo } from '../../types';

/**
 * Discovers and formats genuine physical and virtual network interfaces
 * directly from host operating system APIs and libpcap/Npcap device listings.
 * 
 * STRICT REQUIREMENT: ZERO MOCK OR HARDCODED INTERFACES.
 * If discovery yields no interfaces, returns an empty array with clear diagnostic state.
 * 
 * WINDOWS Npcap MAPPING ARCHITECTURE:
 * - Windows OS reports friendly adapter names (e.g., 'Wi-Fi', 'Ethernet 2').
 * - Npcap deviceList() reports native device identifiers (e.g., '\Device\NPF_{GUID}').
 * - The returned NetworkInterfaceInfo.id MUST be the exact Npcap identifier for cap.open().
 * - The returned NetworkInterfaceInfo.name is the friendly formatted display name.
 */
export class InterfaceManager {
  /**
   * List all network interfaces discovered on the host operating system.
   * Works across Windows, macOS, and Linux.
   */
  public static listInterfaces(): NetworkInterfaceInfo[] {
    const interfaces: NetworkInterfaceInfo[] = [];

    // 1. Query native Cap device list directly when running inside Electron with Npcap/libpcap
    let capDevices: Array<{ name: string; description?: string; addresses?: any[]; flags?: string }> = [];
    try {
      let nodeRequire: typeof require | undefined;
      if (typeof (globalThis as any).require === 'function') {
        nodeRequire = (globalThis as any).require;
      } else {
        // Try to create a require from the module module
        try {
          const { createRequire } = require('module');
          // @ts-ignore
          nodeRequire = createRequire(__filename);
        } catch {
          nodeRequire = undefined;
        }
      }
      if (nodeRequire) {
        const capPackage = nodeRequire('cap');
        if (capPackage && capPackage.Cap && typeof capPackage.Cap.deviceList === 'function') {
          const devList = capPackage.Cap.deviceList();
          if (Array.isArray(devList)) {
            capDevices = devList;
          }
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[InterfaceManager] Cap.deviceList() not available in current runtime:', e);
      }
    }

    // Development logging for verified native devices
    if (process.env.NODE_ENV === 'development' && capDevices.length > 0) {
      console.log(`[InterfaceManager] Discovered ${capDevices.length} native Npcap/libpcap devices:`,
        capDevices.map(d => ({ name: d.name, description: d.description, addresses: d.addresses }))
      );
    }

    // 2. Query OS Network Interfaces from Node.js 'os' module
    const osInterfaces: Record<string, os.NetworkInterfaceInfo[]> = {};
    try {
      if (typeof os !== 'undefined' && typeof os.networkInterfaces === 'function') {
        const netInterfaces = os.networkInterfaces();
        if (netInterfaces) {
          Object.assign(osInterfaces, netInterfaces);
        }
      }
    } catch (e) {
      console.warn('[InterfaceManager] Could not query os.networkInterfaces():', e);
    }

    // 3. Build lookup table of OS interfaces indexed by IP address
    const ipToOsAdapter = new Map<string, { adapterName: string; info: os.NetworkInterfaceInfo }>();
    const osAdapterDetails = new Map<string, {
      name: string;
      ipv4: string[];
      ipv6: string[];
      mac: string;
      internal: boolean;
    }>();

    for (const [adapterName, addrs] of Object.entries(osInterfaces)) {
      if (!addrs || !Array.isArray(addrs)) continue;

      const ipv4: string[] = [];
      const ipv6: string[] = [];
      let mac = '';
      let internal = false;

      for (const addr of addrs) {
        const ip = (addr.address || '').trim().toLowerCase();
        if (ip) {
          ipToOsAdapter.set(ip, { adapterName, info: addr });
        }

        if (addr.family === 'IPv4' || (addr as any).family === 4) {
          ipv4.push(addr.address);
        } else if (addr.family === 'IPv6' || (addr as any).family === 6) {
          ipv6.push(addr.address);
        }

        if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
          mac = addr.mac;
        }
        if (addr.internal) {
          internal = true;
        }
      }

      osAdapterDetails.set(adapterName, {
        name: adapterName,
        ipv4,
        ipv6,
        mac,
        internal,
      });
    }

    // 4. Map native Npcap devices to friendly names and preserve exact capture IDs
    if (capDevices.length > 0) {
      for (const capDev of capDevices) {
        if (!capDev.name) continue;

        const nativeId = capDev.name; // e.g. "\\Device\\NPF_{GUID}" on Windows, "eth0" on Linux, "en0" on macOS
        const driverDesc = (capDev.description || '').trim();

        // Extract IP addresses from cap device
        const capIpv4List: string[] = [];
        const capIpv6List: string[] = [];
        let matchedOsAdapterName: string | null = null;
        let matchedOsDetails: { name: string; ipv4: string[]; ipv6: string[]; mac: string; internal: boolean } | null = null;

        if (Array.isArray(capDev.addresses)) {
          for (const a of capDev.addresses) {
            const ipStr = (a.addr || a.address || '').trim();
            if (!ipStr) continue;

            if (ipStr.includes(':')) {
              capIpv6List.push(ipStr);
            } else if (ipStr.includes('.')) {
              capIpv4List.push(ipStr);
            }

            // Attempt to match with OS adapter by IP address
            const match = ipToOsAdapter.get(ipStr.toLowerCase());
            if (match && !matchedOsAdapterName) {
              matchedOsAdapterName = match.adapterName;
              matchedOsDetails = osAdapterDetails.get(match.adapterName) || null;
            }
          }
        }

        // Secondary matching heuristics if IP did not match:
        const isLoopback = 
          nativeId.toLowerCase().includes('loopback') || 
          driverDesc.toLowerCase().includes('loopback') ||
          capIpv4List.includes('127.0.0.1');

        if (!matchedOsAdapterName && isLoopback) {
          for (const [osName, details] of osAdapterDetails.entries()) {
            if (details.internal || osName.toLowerCase().includes('loopback')) {
              matchedOsAdapterName = osName;
              matchedOsDetails = details;
              break;
            }
          }
        }

        if (!matchedOsAdapterName && driverDesc) {
          const lowerDesc = driverDesc.toLowerCase();
          for (const [osName, details] of osAdapterDetails.entries()) {
            const lowerOsName = osName.toLowerCase();
            if (
              (lowerDesc.includes('wi-fi') || lowerDesc.includes('wireless') || lowerDesc.includes('802.11')) &&
              (lowerOsName.includes('wi-fi') || lowerOsName.includes('wlan') || lowerOsName.includes('wireless'))
            ) {
              matchedOsAdapterName = osName;
              matchedOsDetails = details;
              break;
            } else if (
              (lowerDesc.includes('ethernet') || lowerDesc.includes('gigabit') || lowerDesc.includes('realtek') || lowerDesc.includes('intel') || lowerDesc.includes('pcie')) &&
              (lowerOsName.includes('ethernet') || lowerOsName.includes('eth') || lowerOsName.includes('lan'))
            ) {
              matchedOsAdapterName = osName;
              matchedOsDetails = details;
              break;
            }
          }
        }

        // Construct friendly human-readable UI label
        const primaryIp = capIpv4List[0] || (matchedOsDetails && matchedOsDetails.ipv4[0]) || capIpv6List[0] || '';
        let friendlyDisplayName = '';

        if (matchedOsAdapterName) {
          if (driverDesc && !driverDesc.toLowerCase().includes(matchedOsAdapterName.toLowerCase())) {
            friendlyDisplayName = primaryIp
              ? `${matchedOsAdapterName} (${primaryIp}) — ${driverDesc}`
              : `${matchedOsAdapterName} — ${driverDesc}`;
          } else {
            friendlyDisplayName = primaryIp
              ? `${matchedOsAdapterName} (${primaryIp})`
              : matchedOsAdapterName;
          }
        } else if (driverDesc) {
          friendlyDisplayName = primaryIp
            ? `${driverDesc} (${primaryIp})`
            : driverDesc;
        } else {
          friendlyDisplayName = primaryIp
            ? `Network Adapter (${primaryIp}) [${nativeId.slice(-12)}]`
            : `Network Adapter [${nativeId.slice(-12)}]`;
        }

        const allIps = Array.from(new Set([...capIpv4List, ...capIpv6List, ...(matchedOsDetails?.ipv4 || []), ...(matchedOsDetails?.ipv6 || [])]));

        interfaces.push({
          id: nativeId, // Exact Npcap device ID (e.g. \Device\NPF_{GUID}) passed to cap.open()
          name: friendlyDisplayName,
          description: driverDesc ? `${driverDesc} [${nativeId}]` : `Npcap Device [${nativeId}]`,
          addresses: allIps.length > 0 ? allIps : ['No IP assigned'],
          family: capIpv4List.length > 0 && capIpv6List.length > 0 ? 'mixed' : capIpv6List.length > 0 ? 'IPv6' : 'IPv4',
          internal: isLoopback || (matchedOsDetails?.internal ?? false),
          mac: matchedOsDetails?.mac || undefined,
          rawDeviceId: nativeId,
        });
      }
    } else {
      // Cap deviceList() was not available (e.g. standard Node.js without cap / browser sandbox)
      // STRICT REQUIREMENT: NO fake Wi-Fi, Ethernet, or synthetic adapters.
      // If on Linux/macOS and os.networkInterfaces() is available, list Unix interface identifiers
      if (process.platform !== 'win32' && Object.keys(osInterfaces).length > 0) {
        for (const [name, details] of osAdapterDetails.entries()) {
          const allAddresses = [...details.ipv4, ...details.ipv6];
          const primaryIp = details.ipv4[0] || details.ipv6[0] || '';
          interfaces.push({
            id: name,
            name: `${name} ${primaryIp ? `(${primaryIp})` : ''}`,
            description: details.internal ? 'Local loopback interface' : 'Unix network interface',
            addresses: allAddresses.length > 0 ? allAddresses : ['No IP assigned'],
            family: details.ipv4.length > 0 && details.ipv6.length > 0 ? 'mixed' : details.ipv6.length > 0 ? 'IPv6' : 'IPv4',
            internal: details.internal,
            mac: details.mac || undefined,
            rawDeviceId: name,
          });
        }
      }
    }

    // On Linux only, libpcap supports the 'any' pseudo-device
    if (process.platform === 'linux' && interfaces.length > 0 && !interfaces.some(i => i.id === 'any')) {
      interfaces.unshift({
        id: 'any',
        name: "Pseudo-Device: 'any' (Linux Multi-Interface Capture)",
        description: "Special libpcap pseudo-device capturing across all non-loopback Linux sockets",
        addresses: ['0.0.0.0'],
        family: 'mixed',
        internal: false,
        rawDeviceId: 'any',
      });
    }

    // STRICT: Returns [] if no real interfaces found (e.g. browser environment without Npcap)
    return interfaces;
  }
}


