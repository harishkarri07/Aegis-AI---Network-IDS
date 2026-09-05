/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttackCategory = 'NORMAL' | 'DoS' | 'Probe' | 'R2L' | 'U2R';

export interface Packet {
  id: string;
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  dst_port: number;
  src_port?: number;
  protocol: string;
  category: AttackCategory;
  confidence: number;
  is_anomaly: boolean;
  iso_score: number;
  binary: 0 | 1;
  explanation?: AttackExplanation;
  features?: number[];
  flags?: string[];
  length?: number;
  interface?: string;
  rule_triggered?: string;
}

export interface AttackExplanation {
  attack_name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  narrative: string;
  mitigation: string;
  indicators: Indicator[];
  top_features: FeatureImportance[];
  icon: string;
}

export interface Indicator {
  feature: string;
  value: number | string;
  threshold: string;
  description: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface IDSMetadata {
  feature_names: string[];
  class_names_multi: AttackCategory[];
  n_train: number;
  n_test: number;
  engine_type?: string;
  active_rules?: number;
  window_duration_seconds?: number;
}

export interface SimulationStats {
  totalPackets: number;
  attackCounts: Record<AttackCategory, number>;
  anomalyCount: number;
}

export interface NetworkInterfaceInfo {
  id: string;
  name: string;
  description: string;
  addresses: string[];
  family: 'IPv4' | 'IPv6' | 'mixed';
  internal: boolean;
  mac?: string;
  rawDeviceId?: string;
}

export interface EngineStatus {
  isCapturing: boolean;
  selectedInterface: string;
  totalCaptured: number;
  totalProcessed: number;
  activeFlows: number;
  droppedPackets: number;
  captureMode: 'native_pcap' | 'raw_socket' | 'unavailable';
  privilegeLevel: 'elevated' | 'standard';
  statusMessage: string;
  errorMessage?: string;
  startTime?: number;
}

export interface AegisApi {
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
    aegisApi?: AegisApi;
  }
}

// -------------------------------------------------------------
// Endpoint SIEM / Security Monitoring Models
// -------------------------------------------------------------

export interface SecurityEvent {
  id: string;
  timestamp: string;
  received_at: string;
  hostname: string;
  device_id: string;
  operating_system: string;
  agent_version?: string;
  source_ip?: string;
  destination_ip?: string;
  source_port?: number;
  destination_port?: number;
  username?: string;
  event_type: 'authentication' | 'privilege' | 'connection' | 'process' | 'audit' | 'system' | string;
  action: 'login' | 'logout' | 'sudo' | 'exec' | 'scan' | 'connect' | 'access' | string;
  status: 'success' | 'failure' | 'denied' | 'attempt' | 'info' | 'warning' | string;
  severity_hint?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO' | string;
  raw_message?: string;
  metadata?: Record<string, any>;
  is_simulated?: boolean;
}

export interface MonitoredDevice {
  device_id: string;
  hostname: string;
  operating_system: string;
  agent_version?: string;
  ip_address?: string;
  mac_address?: string;
  first_seen: string;
  last_seen: string;
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  metadata?: Record<string, any>;
}

export interface SecurityAlert {
  alert_id: string;
  rule_id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  hostname: string;
  device_id: string;
  source_ip?: string;
  destination_ip?: string;
  username?: string;
  first_seen: string;
  last_seen: string;
  event_count: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  matched_conditions?: string[];
  evidence_event_ids?: string[];
  recommendation: string;
  mitre_technique?: string;
  mitre_tactic?: string;
  metadata?: Record<string, any>;
}

export interface CorrelatedIncident {
  incident_id: string;
  title: string;
  summary: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  hostname: string;
  device_id: string;
  source_ip?: string;
  username?: string;
  stages: string[];
  alert_ids: string[];
  event_ids: string[];
  first_seen: string;
  last_seen: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  recommendation: string;
  mitre_attack_chain?: string[];
  metadata?: Record<string, any>;
}

export interface SIEMDetectionRule {
  rule_id: string;
  name: string;
  description: string;
  severity: string;
  risk_score: number;
  timeframe: number;
  count: number;
  group_by?: string;
  conditions: Record<string, any>;
  preceding_rule?: string;
  enabled: boolean;
  mitre_technique?: string;
  mitre_tactic?: string;
  recommendation: string;
}

export interface SOCMetrics {
  total_events: number;
  total_open_alerts: number;
  critical_alerts: number;
  severity_distribution: Record<string, number>;
  total_devices: number;
  online_devices: number;
  top_source_ips: { ip: string; count: number }[];
  top_affected_hosts: { hostname: string; count: number }[];
  event_type_distribution: Record<string, number>;
}

