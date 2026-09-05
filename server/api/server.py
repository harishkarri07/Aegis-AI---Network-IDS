"""
Mini-SIEM / IDS REST API Server
Standard Python 3 HTTP Server providing REST API endpoints for ingestion, telemetry,
alert triage, device management, reporting, and demo attack simulation.
"""

import http.server
import json
import urllib.parse
import os
import threading
from typing import Dict, Any, Optional

from server.database.db import Database
from server.services.ingestion import IngestionService
from server.services.reporting import ReportService
from detection.rule_loader import RuleLoader
from demo.simulator import DemoSimulator


class SIEMRequestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Clean logging for requests."""
        # Suppress noisy healthcheck logs if needed
        return

    def _send_json(self, status_code: int, data: Any):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # Restrict CORS to trusted origins only
        # In production, restrict to same-origin; in development, allow localhost
        import os
        is_production = os.environ.get('NODE_ENV') == 'production' or not os.environ.get('ELECTRON_START_URL')
        if is_production:
            # In production (Electron), restrict to same-origin (null origin for file://)
            self.send_header("Access-Control-Allow-Origin", "null")
        else:
            # In development, allow localhost
            self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Agent-Token")
        self.end_headers()
        self.wfile.write(body)

    def _send_text(self, status_code: int, text: str, content_type: str = "text/plain"):
        body = text.encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        # Restrict CORS to trusted origins only
        # In production, restrict to same-origin; in development, allow localhost
        import os
        is_production = os.environ.get('NODE_ENV') == 'production' or not os.environ.get('ELECTRON_START_URL')
        if is_production:
            # In production (Electron), restrict to same-origin (null origin for file://)
            self.send_header("Access-Control-Allow-Origin", "null")
        else:
            # In development, allow localhost
            self.send_header("Access-Control-Allow-Origin", "http://localhost:3000")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Agent-Token")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        db = Database.get_instance()

        if path == "/api/v1/health":
            self._send_json(200, {"status": "healthy", "service": "Aegis Mini-SIEM Core Engine"})
            return

        elif path == "/api/v1/overview":
            metrics = db.get_soc_overview_metrics()
            self._send_json(200, metrics)
            return

        elif path == "/api/v1/events":
            limit = int(query.get("limit", ["100"])[0])
            offset = int(query.get("offset", ["0"])[0])
            hostname = query.get("hostname", [None])[0]
            device_id = query.get("device_id", [None])[0]
            event_type = query.get("event_type", [None])[0]
            action = query.get("action", [None])[0]
            status = query.get("status", [None])[0]
            source_ip = query.get("source_ip", [None])[0]
            username = query.get("username", [None])[0]
            since = query.get("since", [None])[0]
            search = query.get("search", [None])[0]

            events = db.query_events(
                limit=limit,
                offset=offset,
                hostname=hostname,
                device_id=device_id,
                event_type=event_type,
                action=action,
                status=status,
                source_ip=source_ip,
                username=username,
                since_timestamp=since,
                search=search
            )
            self._send_json(200, {"events": events, "count": len(events)})
            return

        elif path == "/api/v1/alerts":
            limit = int(query.get("limit", ["50"])[0])
            offset = int(query.get("offset", ["0"])[0])
            status = query.get("status", [None])[0]
            severity = query.get("severity", [None])[0]
            hostname = query.get("hostname", [None])[0]
            device_id = query.get("device_id", [None])[0]

            alerts = db.query_alerts(
                limit=limit,
                offset=offset,
                status=status,
                severity=severity,
                hostname=hostname,
                device_id=device_id
            )
            self._send_json(200, {"alerts": alerts, "count": len(alerts)})
            return

        elif path == "/api/v1/incidents":
            limit = int(query.get("limit", ["20"])[0])
            incidents = db.query_incidents(limit=limit)
            self._send_json(200, {"incidents": incidents, "count": len(incidents)})
            return

        elif path == "/api/v1/devices":
            devices = db.get_devices()
            self._send_json(200, {"devices": devices, "count": len(devices)})
            return

        elif path == "/api/v1/rules":
            rules = RuleLoader.load_rules()
            self._send_json(200, {"rules": [r.to_dict() for r in rules], "count": len(rules)})
            return

        elif path == "/api/v1/reports/executive":
            md_report = ReportService.generate_executive_report_md(db)
            self._send_text(200, md_report, "text/markdown; charset=utf-8")
            return

        elif path == "/api/v1/reports/alerts.csv":
            csv_report = ReportService.generate_alerts_csv(db)
            self._send_text(200, csv_report, "text/csv; charset=utf-8")
            return

        else:
            self._send_json(404, {"error": "Endpoint not found", "path": path})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.wfile.read(length) if length > 0 else b"{}"

        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            self._send_json(400, {"error": "Invalid JSON payload"})
            return

        db = Database.get_instance()
        ingestion = IngestionService.get_instance()

        if path == "/api/v1/register":
            if not payload.get("device_id") or not payload.get("hostname"):
                self._send_json(400, {"error": "Missing required fields: device_id and hostname"})
                return
            db.register_or_update_device(payload)
            self._send_json(200, {"status": "registered", "device_id": payload["device_id"]})
            return

        elif path == "/api/v1/events":
            res = ingestion.process_event(payload)
            self._send_json(200, res)
            return

        elif path == "/api/v1/events/batch":
            events_list = payload.get("events", [])
            if not isinstance(events_list, list):
                self._send_json(400, {"error": "Payload must contain an 'events' list"})
                return
            res = ingestion.process_batch(events_list)
            self._send_json(200, res)
            return

        elif path == "/api/v1/demo/simulate":
            scenario = payload.get("scenario", "ssh_brute_force")
            count = int(payload.get("count", 5))
            target_host = payload.get("hostname", "target-srv01")
            source_ip = payload.get("source_ip", "198.51.100.42")

            sim_events = DemoSimulator.generate_scenario(
                scenario=scenario,
                count=count,
                hostname=target_host,
                source_ip=source_ip
            )
            ingest_result = ingestion.process_batch([e.to_dict() for e in sim_events])
            self._send_json(200, {
                "status": "success",
                "scenario": scenario,
                "generated_events": len(sim_events),
                "alerts_created": ingest_result["total_alerts"],
                "incidents_created": ingest_result["total_incidents"]
            })
            return

        else:
            self._send_json(404, {"error": "Endpoint not found", "path": path})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.wfile.read(length) if length > 0 else b"{}"

        try:
            payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            self._send_json(400, {"error": "Invalid JSON payload"})
            return

        db = Database.get_instance()

        if path.startswith("/api/v1/alerts/"):
            alert_id = path.split("/api/v1/alerts/")[1].strip()
            new_status = payload.get("status", "").upper()
            if new_status not in ("OPEN", "ACKNOWLEDGED", "RESOLVED"):
                self._send_json(400, {"error": "Invalid status. Must be OPEN, ACKNOWLEDGED, or RESOLVED"})
                return
            updated = db.update_alert_status(alert_id, new_status)
            if updated:
                self._send_json(200, {"status": "updated", "alert_id": alert_id, "new_status": new_status})
            else:
                self._send_json(404, {"error": "Alert not found", "alert_id": alert_id})
            return

        self._send_json(404, {"error": "Endpoint not found", "path": path})


def run_siem_server(host: str = "0.0.0.0", port: int = 8000) -> http.server.HTTPServer:
    """Start the SIEM HTTP server."""
    server = http.server.HTTPServer((host, port), SIEMRequestHandler)
    print(f"[*] Aegis Mini-SIEM Core Engine listening on http://{host}:{port}")
    return server
