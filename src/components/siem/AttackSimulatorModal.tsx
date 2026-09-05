'use client';

import React, { useState } from 'react';
import { Play, CheckCircle2, FlaskConical } from 'lucide-react';
import {
  Button,
  Dialog,
  Input,
  Label,
  cn
} from '../ui';

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
      name: 'SSH brute force',
      description: 'Rapid failed SSH logins from an external attacker (triggers RULE-AUTH-001).',
      defaultCount: 5
    },
    {
      id: 'attack_chain_compromise',
      name: 'Multi-stage compromise',
      description: 'Brute force → successful login → unauthorized root escalation (correlated incident).',
      defaultCount: 6
    },
    {
      id: 'port_scan',
      name: 'Port reconnaissance',
      description: 'Rapid TCP scans across 10 service ports to simulate discovery probes (RULE-NET-001).',
      defaultCount: 10
    },
    {
      id: 'root_login',
      name: 'Direct root login',
      description: 'External SSH login directly to the root account (triggers RULE-AUTH-004).',
      defaultCount: 1
    },
    {
      id: 'privilege_denial',
      name: 'Sudo escalation burst',
      description: 'Repeated denied sudo attempts by a standard user (triggers RULE-PRIV-002).',
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
    <Dialog
      onClose={onClose}
      eyebrow="Test data — simulated events"
      title="Attack scenario simulator"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleRunSimulation} disabled={isRunning}>
            <Play className={cn('w-3.5 h-3.5', isRunning && 'animate-spin')} />
            {isRunning ? 'Executing…' : 'Run scenario'}
          </Button>
        </>
      }
      wide
    >
      <div className="space-y-5">
        <p className="text-caption text-secondary leading-relaxed">
          Inject realistic security event sequences into the ingestion pipeline to test rule firing,
          sliding-window thresholds, and incident correlation. Events are marked as simulated.
        </p>

        <div>
          <Label>Attack vector</Label>
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setScenario(s.id);
                  setCount(s.defaultCount);
                }}
                className={cn(
                  'w-full text-left p-3 rounded-card border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
                  scenario === s.id
                    ? 'bg-surface-2 border-hairline-strong'
                    : 'bg-canvas-deep border-hairline hover:border-hairline-strong'
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-caption font-semibold text-primary">{s.name}</span>
                  <span className="text-micro font-mono text-muted">{s.id}</span>
                </div>
                <p className="text-caption text-secondary leading-relaxed">{s.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sim-hostname">Target hostname</Label>
            <Input
              id="sim-hostname"
              className="font-mono"
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sim-source-ip">Source attacker IP</Label>
            <Input
              id="sim-source-ip"
              className="font-mono"
              type="text"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
            />
          </div>
        </div>

        {result && (
          <div className="p-3.5 rounded-card border border-hairline bg-surface-2 space-y-2">
            {result.error ? (
              <div className="flex items-center gap-2 text-caption font-medium text-critical">
                <FlaskConical className="w-4 h-4" />
                {result.error}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-caption font-medium text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  Scenario ingested and evaluated
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted tabular-nums">
                  <span>Events: <strong className="text-primary">{result.events_generated}</strong></span>
                  <span>Alerts: <strong className="text-primary">{result.alerts_created}</strong></span>
                  <span>Incidents: <strong className="text-primary">{result.incidents_created}</strong></span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
