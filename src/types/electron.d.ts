/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackCategory, AttackExplanation, EngineStatus, NetworkInterfaceInfo, Packet } from '../types';

export interface AegisElectronApi {
  isElectron: boolean;
  listInterfaces: () => Promise<NetworkInterfaceInfo[]>;
  startCapture: (interfaceId: string, pps?: number) => Promise<{ success: boolean; message: string; error?: string }>;
  stopCapture: () => Promise<{ success: boolean }>;
  getStatus: () => Promise<EngineStatus | null>;
  explainVector: (category: AttackCategory) => Promise<AttackExplanation | null>;
  onPacket: (callback: (packet: Packet) => void) => () => void;
  onStatus: (callback: (status: EngineStatus) => void) => () => void;
  onCaptureError: (callback: (error: string) => void) => () => void;
}

declare global {
  interface Window {
    aegisApi?: AegisElectronApi;
  }
}

