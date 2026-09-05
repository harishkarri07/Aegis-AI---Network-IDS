/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttackCategory, AttackExplanation } from '../types';
import { DetectionEngine } from './capture/detection-engine';

// Standardized flow & packet feature names derived from real-time stateful analysis
export const FEATURE_NAMES = [
  'duration',
  'protocol',
  'dst_port',
  'flag_count',
  'total_length',
  'flow_bytes',
  'src_pps',
  'dst_ports_10s',
  'dst_hosts_10s',
  'auth_attempts',
  'auth_resets',
  'established',
  'priv_burst',
  'rst_count',
  'syn_count',
  'ack_count',
  'syn_ack_ratio',
  'rate_deviation',
  'composite_anomaly',
  'anomaly_score'
];

/**
 * Transparent detection engine wrapper for backward-compatibility with UI components.
 * Driven entirely by deterministic flow tracking and verifiable intrusion heuristics.
 */
export class MLEngine {
  /**
   * Deterministic explanation generator based on actual threat heuristics and threshold indicators.
   */
  public static explain(category: AttackCategory, _features?: number[]): AttackExplanation {
    return DetectionEngine.explainVector(category);
  }
}
