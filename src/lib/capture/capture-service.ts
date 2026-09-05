/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EngineStatus, Packet } from '../../types';
import { PacketDecoder, DecodedPacketHeader } from './packet-decoder';
import { FlowTracker } from './flow-tracker';
import { DetectionEngine } from './detection-engine';

export type PacketCallback = (packet: Packet) => void;
export type StatusCallback = (status: EngineStatus) => void;
export type ErrorCallback = (error: string) => void;

/**
 * Orchestrates native network interface packet capture via Npcap / libpcap (Cap binding),
 * packet decoding, stateful flow analysis, and real-time threat detection.
 * 
 * STRICT ARCHITECTURE RULE: ZERO SYNTHETIC FALLBACK IN PRODUCTION.
 * If native packet capture fails or drivers are missing, the service cleanly enters
 * CAPTURE UNAVAILABLE state and informs the user.
 *
 * CRITICAL PERFORMANCE ARCHITECTURE:
 * The cap.on('packet') native callback MUST NOT perform heavy synchronous work.
 * It only decodes the raw buffer (while data is still valid in the shared capture
 * buffer) and pushes the decoded header to a queue. A background processor drains
 * the queue via setImmediate, yielding to the Electron main event loop between
 * batches. This prevents Windows "Not Responding" at high packet rates.
 */
export class CaptureService {
  private static instance: CaptureService;
  private flowTracker: FlowTracker = new FlowTracker(10_000, 10_000, 60_000);
  private isCapturing: boolean = false;
  private selectedInterface: string = 'any';
  private packetCallbacks: Set<PacketCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();

  private totalCaptured: number = 0;
  private totalProcessed: number = 0;
  private droppedPackets: number = 0;
  private nativeCapInstance: any = null;
  private captureStartTime: number | null = null;
  private packetSequence: number = 0;
  private lastErrorMessage: string = '';

  // --- Deferred packet processing queue ---
  // The cap.on('packet') native callback only decodes the raw buffer (while
  // data is still valid in the shared capture buffer) and pushes the decoded
  // header here. A background setImmediate loop drains this queue.
  private decodedQueue: DecodedPacketHeader[] = [];
  private queueHead: number = 0;
  private drainScheduled: boolean = false;
  private captureBuffer: Buffer | null = null;

  /**
   * Maximum decoded packets to buffer before dropping excess.
   * If processing can't keep up with packet arrival rate, excess decoded
   * packets are dropped (counted in droppedPackets).
   */
  private static readonly MAX_DECODED_QUEUE = 100_000;

  /**
   * Number of packets to process per setImmediate tick.
   * This yields to the event loop after each batch, allowing IPC,
   * timers, and Windows messages to be processed.
   */
  private static readonly DRAIN_BATCH_SIZE = 50;

  public static getInstance(): CaptureService {
    if (!CaptureService.instance) {
      CaptureService.instance = new CaptureService();
    }
    return CaptureService.instance;
  }

  /**
   * Start live packet capture on the selected network interface.
   * STRICT REQUIREMENT: Only succeeds if a real native capture handle is initialized.
   */
  public async startCapture(interfaceId: string, _packetsPerSecond?: number): Promise<{ success: boolean; message: string; error?: string }> {
    if (this.isCapturing) {
      this.stopCapture();
    }

    this.selectedInterface = interfaceId || '';
    this.lastErrorMessage = '';

    // Validate interface selection
    if (!interfaceId || interfaceId === 'none' || interfaceId.trim() === '') {
      const err = 'No network adapter selected. Please select a valid physical or virtual network interface from the dropdown.';
      this.lastErrorMessage = err;
      this.notifyError(err);
      this.notifyStatus('unavailable', 'Capture Unavailable: No interface selected');
      return { success: false, message: 'No interface selected', error: err };
    }

    if (interfaceId === 'any' && process.platform === 'win32') {
      const err = "The pseudo-device 'any' is not supported by Npcap on Windows. Please select a specific native adapter (such as Wi-Fi or Ethernet).";
      this.lastErrorMessage = err;
      this.notifyError(err);
      this.notifyStatus('unavailable', 'Capture Unavailable: Specific adapter required on Windows');
      return { success: false, message: 'Invalid interface for Windows', error: err };
    }

    // Check if running in Node.js / Electron environment with native capture capabilities
    let capPackage: any = null;
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
        capPackage = nodeRequire('cap');
      }
    } catch (e: any) {
      const err = `Native packet capture module ('cap') could not be loaded: ${e?.message || 'Missing driver or native binary'}`;
      this.lastErrorMessage = err;
      this.notifyError(err);
      this.notifyStatus('unavailable', 'Capture Unavailable: Npcap/libpcap driver required');
      return { success: false, message: 'Native packet capture unavailable', error: err };
    }

    if (!capPackage || !capPackage.Cap) {
      const err = 'Native packet capture binding is unavailable in this environment. Aegis requires Npcap (Windows) or libpcap (macOS/Linux) and the Aegis desktop application.';
      this.lastErrorMessage = err;
      this.notifyError(err);
      this.notifyStatus('unavailable', 'Capture Unavailable: Desktop environment required');
      return { success: false, message: 'Capture unavailable in browser environment', error: err };
    }

    try {
      const Cap = capPackage.Cap;
      const cap = new Cap();
      const device = interfaceId;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[CaptureService] Opening capture on native device: '${device}' with filter: 'ip'`);
      }

      const filter = 'ip';
      const bufSize = 10 * 1024 * 1024;
      const buffer = Buffer.alloc(65535);

      const linkType = cap.open(device, filter, bufSize, buffer);
      if (typeof cap.setMinBytes === 'function') {
        cap.setMinBytes(0);
      }

      // Store buffer reference for the fast callback
      this.captureBuffer = buffer;

      // CRITICAL: The cap.on('packet') native callback runs synchronously on the
      // main event loop. At high packet rates (1000+ pps), doing heavy synchronous
      // processing here blocks the event loop and causes Windows "Not Responding".
      //
      // Solution: The callback only decodes the raw buffer (MUST happen here while
      // the shared capture buffer data is still valid) and pushes the decoded header
      // to a queue. A background setImmediate loop drains the queue in controlled
      // batches, yielding to the event loop between ticks.
      cap.on('packet', (nbytes: number, _trunc: boolean) => {
        this.totalCaptured++;

        // Decode immediately — the shared capture buffer is reused by libpcap,
        // so we MUST decode while the data is still valid in this callback.
        const rawSlice = buffer.subarray(0, nbytes);
        const decoded = PacketDecoder.decode(rawSlice);

        if (!decoded) {
          this.droppedPackets++;
          return;
        }

        // Check queue bounds — if processing can't keep up, drop excess
        if (this.decodedQueue.length - this.queueHead >= CaptureService.MAX_DECODED_QUEUE) {
          this.droppedPackets++;
          return;
        }

        this.decodedQueue.push(decoded);

        // Schedule background processing if not already running
        if (!this.drainScheduled) {
          this.drainScheduled = true;
          setImmediate(this.processBatch);
        }
      });

      this.nativeCapInstance = cap;
      this.isCapturing = true;
      this.captureStartTime = Date.now();

      const statusMessage = `Live native libpcap/Npcap capture running on ${device} (LinkType: ${linkType})`;
      this.notifyStatus('native_pcap', statusMessage);
      return { success: true, message: statusMessage };

    } catch (openError: any) {
      const msg = openError?.message || 'Failed to open network interface in promiscuous mode';
      const fullError = `Failed to open interface '${interfaceId}': ${msg}. Ensure Npcap / libpcap is installed and the application is run with Administrator or root/cap_net_raw privileges.`;
      
      this.isCapturing = false;
      this.nativeCapInstance = null;
      this.lastErrorMessage = fullError;
      this.notifyError(fullError);
      this.notifyStatus('unavailable', `Capture Failed: ${msg}`);
      return { success: false, message: 'Failed to start native packet capture', error: fullError };
    }
  }

  /**
   * Stop packet capture and cleanly free native resources.
   */
  public stopCapture(): void {
    this.isCapturing = false;
    this.captureStartTime = null;
    this.drainScheduled = false;
    this.captureBuffer = null;

    // Drain any remaining decoded packets before stopping
    while (this.queueHead < this.decodedQueue.length) {
      const decoded = this.decodedQueue[this.queueHead++];
      this.processDecodedHeader(decoded);
    }
    this.decodedQueue = [];
    this.queueHead = 0;

    if (this.nativeCapInstance) {
      try {
        if (typeof this.nativeCapInstance.close === 'function') {
          this.nativeCapInstance.close();
        }
      } catch (e) {
        console.warn('Error closing native capture instance:', e);
      }
      this.nativeCapInstance = null;
    }

    this.notifyStatus('unavailable', 'Capture stopped. System in Standby.');
  }

  /**
   * Background batch processor — drains the decoded packet queue in controlled
   * batches, yielding to the event loop via setImmediate between ticks.
   *
   * This is the KEY PERFORMANCE FIX: by processing packets in setImmediate
   * batches, the Electron main event loop can process IPC messages, timers,
   * and Windows messages between batches, preventing "Not Responding".
   */
  private processBatch = (): void => {
    this.drainScheduled = false;

    const batchEnd = Math.min(
      this.queueHead + CaptureService.DRAIN_BATCH_SIZE,
      this.decodedQueue.length
    );

    for (let i = this.queueHead; i < batchEnd; i++) {
      this.processDecodedHeader(this.decodedQueue[i]);
    }
    this.queueHead = batchEnd;

    // Compact the queue periodically to prevent memory waste
    if (this.queueHead > 5000 && this.queueHead > this.decodedQueue.length >> 1) {
      this.decodedQueue = this.decodedQueue.slice(this.queueHead);
      this.queueHead = 0;
    }

    // If more packets remain, schedule another batch (yields to event loop first)
    if (this.queueHead < this.decodedQueue.length) {
      this.drainScheduled = true;
      setImmediate(this.processBatch);
    }
  };

  /**
   * Process a raw frame buffer through Decoder -> Flow Tracker -> Detection Engine.
   * Kept for external callers; the main capture path uses the deferred queue.
   */
  public processRawBuffer(buffer: Buffer | Uint8Array, customTimestamp?: string): Packet | null {
    try {
      const decoded = PacketDecoder.decode(buffer);
      if (!decoded) {
        this.droppedPackets++;
        return null;
      }

      return this.processDecodedHeader(decoded, customTimestamp);
    } catch {
      this.droppedPackets++;
      return null;
    }
  }

  /**
   * Evaluates a decoded header against stateful flow tracking and deterministic rules.
   */
  public processDecodedHeader(decoded: DecodedPacketHeader, customTimestamp?: string): Packet {
    const now = Date.now();
    const { flow, hostStats } = this.flowTracker.update(decoded, now);
    const evaluation = DetectionEngine.evaluate(decoded, flow, hostStats);

    this.totalProcessed++;
    this.packetSequence++;

    // Deterministic Packet Identifier without Math.random()
    const packetId = `pkt_${now}_${this.packetSequence}`;

    const packet: Packet = {
      id: packetId,
      timestamp: customTimestamp || new Date(now).toISOString(),
      src_ip: decoded.srcIp,
      dst_ip: decoded.dstIp,
      dst_port: decoded.dstPort,
      src_port: decoded.srcPort,
      protocol: decoded.protocol,
      flags: decoded.flags,
      length: decoded.totalLength,
      interface: this.selectedInterface,
      category: evaluation.category,
      confidence: evaluation.confidence,
      is_anomaly: evaluation.is_anomaly,
      iso_score: evaluation.iso_score,
      binary: evaluation.binary,
      explanation: evaluation.explanation,
      features: evaluation.features,
      rule_triggered: evaluation.ruleTriggered,
    };

    // Emit packet to listeners
    this.packetCallbacks.forEach(cb => {
      try {
        cb(packet);
      } catch (e) {
        console.error('Error in packet callback:', e);
      }
    });

    return packet;
  }

  public onPacket(callback: PacketCallback): () => void {
    this.packetCallbacks.add(callback);
    return () => this.packetCallbacks.delete(callback);
  }

  public onStatus(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  public onCaptureError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  private notifyError(errorMessage: string): void {
    this.errorCallbacks.forEach(cb => {
      try {
        cb(errorMessage);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });
  }

  private notifyStatus(mode: EngineStatus['captureMode'], message: string): void {
    const status: EngineStatus = {
      isCapturing: this.isCapturing,
      selectedInterface: this.selectedInterface,
      totalCaptured: this.totalCaptured,
      totalProcessed: this.totalProcessed,
      activeFlows: this.flowTracker.getActiveFlowCount(),
      droppedPackets: this.droppedPackets,
      captureMode: mode,
      privilegeLevel: this.nativeCapInstance ? 'elevated' : 'standard',
      statusMessage: message,
      errorMessage: this.lastErrorMessage || undefined,
      startTime: this.captureStartTime || undefined,
    };

    this.statusCallbacks.forEach(cb => {
      try {
        cb(status);
      } catch (e) {
        console.error('Error in status callback:', e);
      }
    });
  }

  public getStatus(): EngineStatus {
    return {
      isCapturing: this.isCapturing,
      selectedInterface: this.selectedInterface,
      totalCaptured: this.totalCaptured,
      totalProcessed: this.totalProcessed,
      activeFlows: this.flowTracker.getActiveFlowCount(),
      droppedPackets: this.droppedPackets,
      captureMode: this.isCapturing && this.nativeCapInstance ? 'native_pcap' : 'unavailable',
      privilegeLevel: this.nativeCapInstance ? 'elevated' : 'standard',
      statusMessage: this.isCapturing ? 'Capture engine running on real network adapter' : 'Engine in standby',
      errorMessage: this.lastErrorMessage || undefined,
      startTime: this.captureStartTime || undefined,
    };
  }

  public resetStats(): void {
    this.totalCaptured = 0;
    this.totalProcessed = 0;
    this.droppedPackets = 0;
    this.packetSequence = 0;
    this.flowTracker.reset();
  }
}
