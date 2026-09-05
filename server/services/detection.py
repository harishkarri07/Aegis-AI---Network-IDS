"""
Stateful Time-Windowed Detection Engine
Evaluates security events against rules with sliding time windows, threshold counting,
preceding condition tracking, and alert deduplication/aggregation.
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone, timedelta
import threading
from server.models.event import SecurityEvent
from server.models.alert import Alert
from server.database.db import Database
from server.services.risk import RiskEngine
from detection.rule_loader import RuleLoader, DetectionRule


def parse_iso_utc(ts_str: str) -> datetime:
    """Parse ISO timestamp to UTC datetime object safely."""
    try:
        clean = ts_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return datetime.now(timezone.utc)


class DetectionEngine:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, db: Optional[Database] = None, rules: Optional[List[DetectionRule]] = None):
        self.db = db or Database.get_instance()
        self.rules = rules if rules is not None else RuleLoader.load_rules()
        # In-memory sliding buffer: key -> list of (event, timestamp)
        # key format: f"{rule_id}:{group_val}"
        self._sliding_buffers: Dict[str, List[Tuple[SecurityEvent, datetime]]] = {}
        # Preceding rule trigger history: key -> timestamp of trigger
        self._rule_trigger_history: Dict[str, datetime] = {}
        self._state_lock = threading.Lock()

    @classmethod
    def get_instance(cls) -> 'DetectionEngine':
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    def reload_rules(self, rules_path: Optional[str] = None):
        with self._state_lock:
            self.rules = RuleLoader.load_rules(rules_path)

    def evaluate_event(self, event: SecurityEvent) -> List[Alert]:
        """
        Evaluate a single incoming SecurityEvent across all active rules.
        Returns any newly triggered or updated Alerts.
        """
        triggered_alerts: List[Alert] = []
        event_dt = parse_iso_utc(event.timestamp)

        with self._state_lock:
            for rule in self.rules:
                if not rule.enabled:
                    continue

                # Step 1: Match static event conditions
                if not self._match_conditions(event, rule.conditions):
                    continue

                # Step 2: Check preceding rule constraint if required
                if rule.preceding_rule:
                    prec_key = self._build_group_key(rule.preceding_rule, rule.group_by, event)
                    last_prec_time = self._rule_trigger_history.get(prec_key)
                    if not last_prec_time:
                        continue
                    # Check if preceding trigger was within rule timeframe
                    if (event_dt - last_prec_time).total_seconds() > rule.timeframe:
                        continue

                # Step 3: Handle single-event immediate trigger rules (count == 1)
                if rule.count <= 1:
                    alert = self._create_or_update_alert(rule, [event], event)
                    triggered_alerts.append(alert)
                    # Record trigger history
                    hist_key = self._build_group_key(rule.rule_id, rule.group_by, event)
                    self._rule_trigger_history[hist_key] = event_dt
                    continue

                # Step 4: Sliding window buffer evaluation for multi-event threshold rules
                group_key = self._build_group_key(rule.rule_id, rule.group_by, event)
                if group_key not in self._sliding_buffers:
                    self._sliding_buffers[group_key] = []

                # Append current event to sliding buffer
                self._sliding_buffers[group_key].append((event, event_dt))

                # Prune events older than rule.timeframe
                cutoff = event_dt - timedelta(seconds=rule.timeframe)
                self._sliding_buffers[group_key] = [
                    (ev, ts) for (ev, ts) in self._sliding_buffers[group_key]
                    if ts >= cutoff
                ]

                # Check if threshold count is satisfied
                matching_events = [ev for (ev, ts) in self._sliding_buffers[group_key]]
                if len(matching_events) >= rule.count:
                    alert = self._create_or_update_alert(rule, matching_events, event)
                    triggered_alerts.append(alert)
                    
                    # Record trigger history for downstream chaining
                    hist_key = self._build_group_key(rule.rule_id, rule.group_by, event)
                    self._rule_trigger_history[hist_key] = event_dt

        return triggered_alerts

    def _match_conditions(self, event: SecurityEvent, conditions: Dict[str, Any]) -> bool:
        """Check if event satisfies all key-value condition pairs."""
        if not conditions:
            return True

        for k, expected_v in conditions.items():
            actual_v = getattr(event, k, None)
            if actual_v is None and k in event.metadata:
                actual_v = event.metadata[k]

            if expected_v is None:
                continue

            if isinstance(expected_v, str):
                if str(actual_v or "").lower() != expected_v.lower():
                    return False
            elif isinstance(expected_v, (int, float)):
                if actual_v != expected_v:
                    return False
            elif isinstance(expected_v, bool):
                if bool(actual_v) != expected_v:
                    return False

        return True

    def _build_group_key(self, rule_id: str, group_by: Optional[str], event: SecurityEvent) -> str:
        """Build grouping key for sliding window aggregation."""
        val = "global"
        if group_by:
            val = getattr(event, group_by, None) or event.metadata.get(group_by) or "unknown"
        return f"{rule_id}:{val}"

    def _create_or_update_alert(
        self,
        rule: DetectionRule,
        evidence_events: List[SecurityEvent],
        latest_event: SecurityEvent
    ) -> Alert:
        """
        Deduplicates and updates an existing OPEN alert, or creates a new high-fidelity Alert.
        """
        evidence_ids = [ev.id for ev in evidence_events]
        matched_conds = [f"{k}={v}" for k, v in rule.conditions.items()]
        is_priv = bool(latest_event.username and latest_event.username.lower() in ("root", "admin", "administrator"))

        # Check for an existing open alert for this rule on this host/source
        existing = self.db.find_matching_open_alert(
            rule_id=rule.rule_id,
            hostname=latest_event.hostname,
            source_ip=latest_event.source_ip,
            username=latest_event.username
        )

        if existing:
            # Aggregate / deduplicate
            new_count = existing["event_count"] + len(evidence_events)
            merged_evidence = list(set(existing["evidence_event_ids"] + evidence_ids))
            
            risk_calc = RiskEngine.calculate_alert_risk(
                base_rule_score=rule.risk_score,
                severity=rule.severity,
                event_count=new_count,
                has_correlation=bool(rule.preceding_rule),
                is_privileged=is_priv
            )

            updated_alert = Alert(
                alert_id=existing["alert_id"],
                rule_id=rule.rule_id,
                title=rule.name,
                description=rule.description,
                severity=rule.severity,
                risk_score=risk_calc["score"],
                hostname=latest_event.hostname,
                device_id=latest_event.device_id,
                source_ip=latest_event.source_ip,
                destination_ip=latest_event.destination_ip,
                username=latest_event.username,
                first_seen=existing["first_seen"],
                last_seen=latest_event.timestamp,
                event_count=new_count,
                status="OPEN",
                matched_conditions=matched_conds,
                evidence_event_ids=merged_evidence,
                recommendation=rule.recommendation,
                mitre_technique=rule.mitre_technique,
                mitre_tactic=rule.mitre_tactic,
                metadata={"risk_factors": risk_calc["factors"]}
            )
            self.db.insert_alert(updated_alert.to_dict())
            return updated_alert
        else:
            # Create fresh alert
            risk_calc = RiskEngine.calculate_alert_risk(
                base_rule_score=rule.risk_score,
                severity=rule.severity,
                event_count=len(evidence_events),
                has_correlation=bool(rule.preceding_rule),
                is_privileged=is_priv
            )

            new_alert = Alert(
                rule_id=rule.rule_id,
                title=rule.name,
                description=rule.description,
                severity=rule.severity,
                risk_score=risk_calc["score"],
                hostname=latest_event.hostname,
                device_id=latest_event.device_id,
                source_ip=latest_event.source_ip,
                destination_ip=latest_event.destination_ip,
                username=latest_event.username,
                first_seen=evidence_events[0].timestamp if evidence_events else latest_event.timestamp,
                last_seen=latest_event.timestamp,
                event_count=len(evidence_events),
                status="OPEN",
                matched_conditions=matched_conds,
                evidence_event_ids=evidence_ids,
                recommendation=rule.recommendation,
                mitre_technique=rule.mitre_technique,
                mitre_tactic=rule.mitre_tactic,
                metadata={"risk_factors": risk_calc["factors"]}
            )
            self.db.insert_alert(new_alert.to_dict())
            return new_alert
