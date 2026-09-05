"""
Ingestion Pipeline Service
Validates, normalizes, persists, tracks device status, evaluates detection, and triggers correlation.
"""

from typing import Dict, Any, List, Optional
from server.models.event import SecurityEvent
from server.models.alert import Alert
from server.models.incident import Incident
from server.database.db import Database
from server.services.detection import DetectionEngine
from server.services.correlation import CorrelationEngine
from server.services.risk import RiskEngine


class IngestionService:
    _instance = None

    def __init__(
        self,
        db: Optional[Database] = None,
        detection_engine: Optional[DetectionEngine] = None,
        correlation_engine: Optional[CorrelationEngine] = None
    ):
        self.db = db or Database.get_instance()
        self.detection_engine = detection_engine or DetectionEngine.get_instance()
        self.correlation_engine = correlation_engine or CorrelationEngine.get_instance()

    @classmethod
    def get_instance(cls) -> 'IngestionService':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def process_event(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single incoming telemetry event through the end-to-end SIEM pipeline.
        """
        # Step 1: Normalize & Validate Model
        event = SecurityEvent.from_dict(raw_data)
        
        # Calculate event-level risk score hint if not provided
        if not event.severity_hint or event.severity_hint == "LOW":
            event_risk = RiskEngine.calculate_event_risk(event)
            event.severity_hint = event_risk["tier"]
            event.metadata["risk_score"] = event_risk["score"]

        # Step 2: Persist Event to Database
        self.db.insert_event(event.to_dict())

        # Step 3: Update Device Heartbeat / Registration
        if event.device_id and event.device_id != "unknown":
            self.db.register_or_update_device({
                "device_id": event.device_id,
                "hostname": event.hostname,
                "operating_system": event.operating_system,
                "agent_version": event.agent_version,
                "ip_address": event.source_ip,
                "last_seen": event.timestamp
            })

        # Step 4: Stateful Detection Evaluation
        triggered_alerts = self.detection_engine.evaluate_event(event)

        # Step 5: Correlation & Multi-Stage Incident Evaluation
        correlated_incidents = []
        if triggered_alerts:
            correlated_incidents = self.correlation_engine.process_alerts_and_event(
                triggered_alerts, event
            )

        return {
            "status": "success",
            "event_id": event.id,
            "alerts_generated": len(triggered_alerts),
            "alerts": [a.to_dict() for a in triggered_alerts],
            "incidents_generated": len(correlated_incidents),
            "incidents": [i.to_dict() for i in correlated_incidents]
        }

    def process_batch(self, batch_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Process a batch of events efficiently.
        """
        results = []
        total_alerts = 0
        total_incidents = 0

        for item in batch_data:
            res = self.process_event(item)
            results.append(res)
            total_alerts += res.get("alerts_generated", 0)
            total_incidents += res.get("incidents_generated", 0)

        return {
            "status": "success",
            "processed_count": len(batch_data),
            "total_alerts": total_alerts,
            "total_incidents": total_incidents
        }
