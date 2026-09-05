/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { contextBridge, ipcRenderer } from 'electron';
import { AttackCategory, AttackExplanation, EngineStatus, NetworkInterfaceInfo, Packet } from '../src/types';

/**
 * Secure contextBridge exposing only typed methods to the renderer.
 * Node.js APIs and dangerous primitives are completely isolated.
 */
contextBridge.exposeInMainWorld('aegisApi', {
  isElectron: true,

  listInterfaces: async (): Promise<NetworkInterfaceInfo[]> => {
    return await ipcRenderer.invoke('aegis:list-interfaces');
  },

  startCapture: async (interfaceId: string, pps?: number): Promise<{ success: boolean; message: string; error?: string }> => {
    return await ipcRenderer.invoke('aegis:start-capture', interfaceId, pps);
  },

  stopCapture: async (): Promise<{ success: boolean }> => {
    return await ipcRenderer.invoke('aegis:stop-capture');
  },

  getStatus: async (): Promise<EngineStatus | null> => {
    return await ipcRenderer.invoke('aegis:get-status');
  },

  explainVector: async (category: AttackCategory): Promise<AttackExplanation | null> => {
    return await ipcRenderer.invoke('aegis:explain-vector', category);
  },

  onPacket: (callback: (packet: Packet) => void) => {
    // Support both legacy single-packet and new batched packet IPC.
    const onSingle = (_event: any, packet: Packet) => callback(packet);
    const onBatch = (_event: any, packets: Packet[]) => {
      for (let i = 0; i < packets.length; i++) {
        callback(packets[i]);
      }
    };
    ipcRenderer.on('aegis:packet', onSingle);
    ipcRenderer.on('aegis:packets', onBatch);
    return () => {
      ipcRenderer.removeListener('aegis:packet', onSingle);
      ipcRenderer.removeListener('aegis:packets', onBatch);
    };
  },

  onStatus: (callback: (status: EngineStatus) => void) => {
    const subscription = (_event: any, status: EngineStatus) => callback(status);
    ipcRenderer.on('aegis:status', subscription);
    return () => {
      ipcRenderer.removeListener('aegis:status', subscription);
    };
  },

  onCaptureError: (callback: (error: string) => void) => {
    const subscription = (_event: any, error: string) => callback(error);
    ipcRenderer.on('aegis:capture-error', subscription);
    return () => {
      ipcRenderer.removeListener('aegis:capture-error', subscription);
    };
  },
});
