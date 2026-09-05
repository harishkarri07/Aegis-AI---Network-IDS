'use client';

import React, { useState } from 'react';
import {
  Zap,
  X,
  ShieldAlert,
  Play,
  CheckCircle,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';

interface AttackSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AttackSimulatorModal: React.FC<AttackSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [scenario, setScenario] = useState('ssh_brute_force');
  const [count, setCount] = useState(5);
  const [hostname, setHostname] = useState('endpoint-alpha');
  const [sourceIp, setSourceIp] = useState('198.51.100.42');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'ssh_brute_force',
      name: 'SSH Brute Force Attack',
      description: 'Generates 5 rapid failed SSH login events targeting root/admin from an external attacker IP (triggers RULE-AUTH-001).',
      defaultCount: 5
    },
    {
      id: 'attack_chain_compromise',
      name: 'Multi-Stage Compromise Chain',
      description: 'Generates Brute Force -> Successful Initial Access Login -> Unauthorized Root Sudo Escalation. Triggers correlated high-risk Incident.',
      defaultCount: 6
    },
    {
      id: 'port_scan',
      name: 'Port Reconnaissance & Scan',
      description: 'Generates rapid TCP scan connections across 10 distinct service ports to simulate discovery probes (triggers RULE-NET-001).',
      defaultCount: 10
    },
    {
      id: 'root_login',
      name: 'Direct Root SSH Login',
      description: 'Simulates direct external SSH login to root account (triggers RULE-AUTH-004).',
      defaultCount: 1
    },
    {
      id: 'privilege_denial',
      name: 'Unauthorized Sudo Escalation Burst',
      description: 'Simulates 3 consecutive denied sudo password attempts by standard user (triggers RULE-PRIV-002).',
      defaultCount: 3
    }
  ];

  const handleRunSimulation = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/siem/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          count,
          hostname,
          source_ip: sourceIp
        })
      });
      const data = await res.json();
      setResult(data);
      onSuccess();
    } catch (err: any) {
      setResult({ error: err.message || 'Simulation execution failed' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-[#1e3a5f] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-[#1e3a5f] pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00d4ff]" />
            <h3 className="font-bold text-sm text-white">
              Deterministic Attack Scenario Simulator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#7090b0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#7090b0]">
          Inject realistic security event sequences directly into the Aegis Ingestion Pipeline to test rule firing, sliding-window thresholds, and incident correlation.
        </p>

        {/* Scenario Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#7090b0] uppercase tracking-wider block">
            Select Attack Vector
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {scenarios.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setScenario(s.id);
                  setCount(s.defaultCount);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  scenario === s.id
                    ? 'bg-[#1e293b] border-[#00d4ff]'
                    : 'bg-[#0a0e1a] border-[#1e3a5f] hover:border-[#7090b0]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{s.name}</span>
                  <span className="font-mono text-[10px] text-[#00d4ff] font-semibold">{s.id}</span>
                </div>
                <p className="text-[11px] text-[#7090b0]">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Config Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-[#7090b0] block mb-1">
              Target Hostname
            </label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-white font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[#7090b0] block mb-1">
              Source Attacker IP
            </label>
            <input
              type="text"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#0a0e1a] border border-[#1e3a5f] rounded-lg text-white font-mono"
            />
          </div>
        </div>

        {/* Results Banner */}
        {result && (
          <div className="p-3 bg-[#00ff88]/10 border border-[#00ff88]/40 rounded-lg text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-[#00ff88] font-bold">
              <CheckCircle className="w-4 h-4" />
              Scenario Ingested & Evaluated Successfully!
            </div>
            <div className="text-[#b0c4de] text-[11px]">
              Events generated: <strong>{result.events_generated}</strong> | Alerts created: <strong className="text-[#ffaa00]">{result.alerts_created}</strong> | Incidents created: <strong className="text-[#ff3366]">{result.incidents_created}</strong>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/80 text-white rounded-lg text-xs font-bold"
          >
            Close
          </button>
          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-4 py-2 bg-[#00d4ff] hover:bg-white text-[#0a0e1a] rounded-lg text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executing...' : 'Run Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
};
