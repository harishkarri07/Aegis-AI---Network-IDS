"""
Correlation Engine
Identifies multi-stage attack progressions across alerts and events (e.g. Brute Force -> Login -> Sudo Escalation)
and produces high-confidence Correlated Incidents.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import threading
from server.models.alert import Alert
from server.models.incident import Incident
from server.models.event import SecurityEvent
from server.database.db import Database


class CorrelationEngine:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database.get_instance()
        # In-memory incident stages per host/source: key -> dict of stages
        self._host_stages: Dict[str, Dict[str, Any]] = {}
        self._lock_state = threading.Lock()

    @classmethod
    def get_instance(cls) -> 'CorrelationEngine':
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def process_alerts_and_event(self, alerts: List[Alert], event: SecurityEvent) -> List[Incident]:
        """
        Evaluate triggered alerts and latest event to correlate multi-stage incident chains.
        """
        generated_incidents: List[Incident] = []
        host_key = f"{event.hostname}:{event.source_ip or 'local'}"

        with self._lock_state:
            if host_key not in self._host_stages:
                self._host_stages[host_key] = {
                    "stages": [],
                    "alert_ids": [],
                    "event_ids": [],
                    "mitre_chain": [],
                    "first_seen": event.timestamp,
                    "last_seen": event.timestamp,
                    "hostname": event.hostname,
                    "device_id": event.device_id,
                    "source_ip": event.source_ip,
                    "username": event.username
                }

            state = self._host_stages[host_key]
            state["last_seen"] = event.timestamp
            state["event_ids"].append(event.id)
            if event.username:
                state["username"] = event.username

            for alert in alerts:
                if alert.alert_id not in state["alert_ids"]:
                    state["alert_ids"].append(alert.alert_id)

                # Determine attack progression stage
                stage_name = None
                if "RULE-AUTH-001" in alert.rule_id or "RULE-AUTH-002" in alert.rule_id:
                    stage_name = "Stage 1: Credential Access / Authentication Probing"
                elif "RULE-AUTH-003" in alert.rule_id or "RULE-AUTH-004" in alert.rule_id:
                    stage_name = "Stage 2: Initial Access / Compromised Session"
                elif "RULE-PRIV" in alert.rule_id:
                    stage_name = "Stage 3: Privilege Escalation to Root"
                elif "RULE-PROC" in alert.rule_id or "RULE-AUDIT" in alert.rule_id:
                    stage_name = "Stage 4: Post-Exploitation / Execution"
                elif "RULE-NET" in alert.rule_id:
                    stage_name = "Stage 0: Reconnaissance / Port Sweep"

                if stage_name and stage_name not in state["stages"]:
                    state["stages"].append(stage_name)

                if alert.mitre_technique and alert.mitre_technique not in state["mitre_chain"]:
                    state["mitre_chain"].append(alert.mitre_technique)

            # Correlate into an Incident if at least 2 progression stages are observed
            if len(state["stages"]) >= 2:
                risk = 85 + (len(state["stages"]) * 4)
                risk = min(100, risk)
                sev = "CRITICAL" if risk >= 90 else "HIGH"

                summary = (
                    f"Correlated multi-stage attack detected on host '{event.hostname}'. "
                    f"Attackers progressed across {len(state['stages'])} stages: "
                    f"{' -> '.join(state['stages'])}."
                )

                incident = Incident(
                    title=f"Multi-Stage Attack Chain: {state['stages'][-1]} on {event.hostname}",
                    summary=summary,
                    severity=sev,
                    risk_score=risk,
                    hostname=event.hostname,
                    device_id=event.device_id,
                    source_ip=event.source_ip,
                    username=state.get("username") or event.username,
                    stages=list(state["stages"]),
                    alert_ids=list(state["alert_ids"]),
                    event_ids=list(state["event_ids"][-20:]),  # keep last 20 evidence events
                    first_seen=state["first_seen"],
                    last_seen=state["last_seen"],
                    status="OPEN",
                    recommendation=(
                        "CRITICAL INCIDENT: Isolate host network interface immediately, "
                        "kill active unauthorized shell sessions, invalidate user credentials, "
                        "and conduct forensic memory/disk inspection."
                    ),
                    mitre_attack_chain=list(state["mitre_chain"])
                )
                self.db.insert_or_update_incident(incident.to_dict())
                generated_incidents.append(incident)

        return generated_incidents
