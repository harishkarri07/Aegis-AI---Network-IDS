"""
Unit & Integration Test Suite for Aegis Mini-SIEM / IDS Core
Tests Event Model, Log Parsing, Persistence, Stateful Detection Rules,
Correlation Chains, Risk Scoring, Alert Deduplication, and Reporting.
"""

import unittest
import os
import tempfile
import json
from datetime import datetime, timezone, timedelta
import uuid

from server.models.event import SecurityEvent
from server.models.device import Device
from server.models.alert import Alert
from server.models.incident import Incident
from server.database.db import Database
from server.services.detection import DetectionEngine
from server.services.correlation import CorrelationEngine
from server.services.risk import RiskEngine
from server.services.ingestion import IngestionService
from server.services.reporting import ReportService
from agent.parser import LinuxLogParser
from detection.rule_loader import RuleLoader, DetectionRule


class TestEventModel(unittest.TestCase):
    def test_event_creation_and_dict(self):
        ev = SecurityEvent(
            hostname="web-prod-01",
            device_id="dev-100",
            source_ip="192.168.1.50",
            destination_port=22,
            username="alice",
            event_type="authentication",
            action="login",
            status="failure"
        )
        d = ev.to_dict()
        self.assertEqual(d["hostname"], "web-prod-01")
        self.assertEqual(d["username"], "alice")
        self.assertEqual(d["destination_port"], 22)

        reconstructed = SecurityEvent.from_dict(d)
        self.assertEqual(reconstructed.id, ev.id)
        self.assertEqual(reconstructed.hostname, "web-prod-01")


class TestLogParsing(unittest.TestCase):
    def test_parse_ssh_failure(self):
        line = "Jan 15 10:20:30 ubuntu sshd[1234]: Failed password for invalid user admin from 203.0.113.19 port 48123 ssh2"
        ev = LinuxLogParser.parse_line(line, hostname="test-host", device_id="dev-01")
        self.assertIsNotNone(ev)
        self.assertEqual(ev.username, "admin")
        self.assertEqual(ev.source_ip, "203.0.113.19")
        self.assertEqual(ev.source_port, 48123)
        self.assertEqual(ev.destination_port, 22)
        self.assertEqual(ev.action, "login")
        self.assertEqual(ev.status, "failure")

    def test_parse_ssh_success(self):
        line = "Jan 15 10:22:00 ubuntu sshd[5678]: Accepted password for root from 198.51.100.22 port 50234 ssh2"
        ev = LinuxLogParser.parse_line(line, hostname="test-host", device_id="dev-01")
        self.assertIsNotNone(ev)
        self.assertEqual(ev.username, "root")
        self.assertEqual(ev.source_ip, "198.51.100.22")
        self.assertEqual(ev.status, "success")
        self.assertEqual(ev.severity_hint, "HIGH")

    def test_parse_sudo_success(self):
        line = "Jan 15 10:25:12 ubuntu sudo: bob : TTY=pts/1 ; PWD=/home/bob ; USER=root ; COMMAND=/bin/bash"
        ev = LinuxLogParser.parse_line(line, hostname="test-host", device_id="dev-01")
        self.assertIsNotNone(ev)
        self.assertEqual(ev.username, "root")
        self.assertEqual(ev.event_type, "privilege")
        self.assertEqual(ev.action, "sudo")
        self.assertEqual(ev.status, "success")
        self.assertEqual(ev.metadata.get("executed_by"), "bob")

    def test_parse_sudo_denied(self):
        line = "Jan 15 10:26:00 ubuntu sudo: eve : user NOT in sudoers ; TTY=pts/2 ; PWD=/home/eve ; COMMAND=/bin/cat /etc/shadow"
        ev = LinuxLogParser.parse_line(line, hostname="test-host", device_id="dev-01")
        self.assertIsNotNone(ev)
        self.assertEqual(ev.username, "eve")
        self.assertEqual(ev.event_type, "privilege")
        self.assertEqual(ev.action, "sudo")
        self.assertEqual(ev.status, "denied")


class TestDatabaseAndIngestion(unittest.TestCase):
    def setUp(self):
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.temp_db.close()
        self.db = Database(self.temp_db.name)
        self.detection = DetectionEngine(db=self.db)
        self.correlation = CorrelationEngine(db=self.db)
        self.ingestion = IngestionService(
            db=self.db,
            detection_engine=self.detection,
            correlation_engine=self.correlation
        )

    def tearDown(self):
        # Close SQLite connections before removing the temp file
        # to avoid Windows PermissionError: file in use
        try:
            conn = self.db.get_connection()
            conn.close()
        except Exception:
            pass
        try:
            if hasattr(self.db, '_local') and hasattr(self.db._local, 'conn'):
                self.db._local.conn = None
        except Exception:
            pass
        if os.path.exists(self.temp_db.name):
            try:
                os.remove(self.temp_db.name)
            except PermissionError:
                pass

    def test_device_registration(self):
        self.db.register_or_update_device({
            "device_id": "dev-alpha-01",
            "hostname": "alpha-host",
            "operating_system": "Linux",
            "agent_version": "1.0.0"
        })
        devices = self.db.get_devices()
        self.assertEqual(len(devices), 1)
        self.assertEqual(devices[0]["hostname"], "alpha-host")
        self.assertEqual(devices[0]["status"], "ONLINE")

    def test_ssh_brute_force_detection(self):
        """Simulate 5 failed SSH logins from 198.51.100.99 and verify alert triggers."""
        now = datetime.now(timezone.utc)
        alerts_created = []

        for i in range(5):
            ts = (now - timedelta(seconds=(5 - i) * 5)).isoformat()
            raw_ev = {
                "id": str(uuid.uuid4()),
                "timestamp": ts,
                "hostname": "srv-prod",
                "device_id": "dev-prod",
                "operating_system": "Linux",
                "source_ip": "198.51.100.99",
                "destination_port": 22,
                "username": f"user{i}",
                "event_type": "authentication",
                "action": "login",
                "status": "failure"
            }
            res = self.ingestion.process_event(raw_ev)
            if res["alerts_generated"] > 0:
                alerts_created.extend(res["alerts"])

        # Should have generated alerts (RULE-AUTH-002 on 3rd, and RULE-AUTH-001 on 5th)
        self.assertGreater(len(alerts_created), 0)
        rule_ids = [a["rule_id"] for a in alerts_created]
        self.assertIn("RULE-AUTH-001", rule_ids)

        # Verify DB query
        db_alerts = self.db.query_alerts()
        self.assertGreaterEqual(len(db_alerts), 1)

    def test_multi_stage_correlation_incident(self):
        """Test attack chain: brute force -> login success -> sudo root escalation."""
        now = datetime.now(timezone.utc)
        attacker_ip = "203.0.113.88"
        host = "db-node-01"

        # 1. 5 failed logins (Triggers RULE-AUTH-001 and RULE-AUTH-002)
        for i in range(5):
            ts = (now - timedelta(seconds=100 - i * 10)).isoformat()
            self.ingestion.process_event({
                "timestamp": ts,
                "hostname": host,
                "device_id": "dev-db",
                "operating_system": "Linux",
                "source_ip": attacker_ip,
                "destination_port": 22,
                "username": "deploy",
                "event_type": "authentication",
                "action": "login",
                "status": "failure"
            })

        # 2. 1 successful login (Triggers RULE-AUTH-003: Login following failures)
        ts_login = (now - timedelta(seconds=40)).isoformat()
        res_login = self.ingestion.process_event({
            "timestamp": ts_login,
            "hostname": host,
            "device_id": "dev-db",
            "operating_system": "Linux",
            "source_ip": attacker_ip,
            "destination_port": 22,
            "username": "deploy",
            "event_type": "authentication",
            "action": "login",
            "status": "success"
        })

        # 3. Privilege Escalation (Triggers RULE-PRIV-001)
        ts_sudo = (now - timedelta(seconds=10)).isoformat()
        res_sudo = self.ingestion.process_event({
            "timestamp": ts_sudo,
            "hostname": host,
            "device_id": "dev-db",
            "operating_system": "Linux",
            "source_ip": attacker_ip,
            "username": "root",
            "event_type": "privilege",
            "action": "sudo",
            "status": "success",
            "metadata": {"command": "/bin/bash", "executed_by": "deploy"}
        })

        # Check that Correlated Incident was produced
        incidents = self.db.query_incidents()
        self.assertGreaterEqual(len(incidents), 1)
        inc = incidents[0]
        self.assertEqual(inc["hostname"], host)
        self.assertEqual(inc["severity"], "CRITICAL")
        self.assertGreaterEqual(inc["risk_score"], 90)
        self.assertGreaterEqual(len(inc["stages"]), 2)

    def test_report_generation(self):
        # Insert a sample event and alert
        self.ingestion.process_event({
            "hostname": "alpha-host",
            "device_id": "dev-alpha",
            "operating_system": "Linux",
            "source_ip": "10.0.0.5",
            "destination_port": 22,
            "username": "root",
            "event_type": "authentication",
            "action": "login",
            "status": "success"
        })

        md = ReportService.generate_executive_report_md(self.db)
        self.assertIn("Aegis Mini-SIEM", md)
        self.assertIn("Executive Summary", md)

        csv_data = ReportService.generate_alerts_csv(self.db)
        self.assertIn("alert_id", csv_data)


if __name__ == "__main__":
    unittest.main()
