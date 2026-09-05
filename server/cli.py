"""
Aegis Mini-SIEM CLI Interface
Provides fast, structured JSON command-line operations for Next.js API routes and SOC automation.
"""

import sys
import os
import json
import argparse

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.database.db import Database
from server.services.ingestion import IngestionService
from server.services.reporting import ReportService
from detection.rule_loader import RuleLoader
from demo.simulator import DemoSimulator


def main():
    parser = argparse.ArgumentParser(description="Aegis Mini-SIEM CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # 1. overview
    subparsers.add_parser("overview")

    # 2. events
    events_parser = subparsers.add_parser("events")
    events_parser.add_argument("--limit", type=int, default=100)
    events_parser.add_argument("--offset", type=int, default=0)
    events_parser.add_argument("--hostname", default=None)
    events_parser.add_argument("--device-id", default=None)
    events_parser.add_argument("--event-type", default=None)
    events_parser.add_argument("--action", default=None)
    events_parser.add_argument("--status", default=None)
    events_parser.add_argument("--source-ip", default=None)
    events_parser.add_argument("--username", default=None)
    events_parser.add_argument("--since", default=None)
    events_parser.add_argument("--search", default=None)

    # 3. alerts
    alerts_parser = subparsers.add_parser("alerts")
    alerts_parser.add_argument("--limit", type=int, default=50)
    alerts_parser.add_argument("--offset", type=int, default=0)
    alerts_parser.add_argument("--status", default=None)
    alerts_parser.add_argument("--severity", default=None)
    alerts_parser.add_argument("--hostname", default=None)
    alerts_parser.add_argument("--device-id", default=None)

    # 4. update-alert
    update_alert_parser = subparsers.add_parser("update-alert")
    update_alert_parser.add_argument("alert_id")
    update_alert_parser.add_argument("status")

    # 5. incidents
    subparsers.add_parser("incidents")

    # 6. devices
    subparsers.add_parser("devices")

    # 7. rules
    subparsers.add_parser("rules")

    # 8. report
    report_parser = subparsers.add_parser("report")
    report_parser.add_argument("--format", choices=["markdown", "csv"], default="markdown")

    # 9. simulate
    sim_parser = subparsers.add_parser("simulate")
    sim_parser.add_argument("--scenario", default="ssh_brute_force")
    sim_parser.add_argument("--count", type=int, default=5)
    sim_parser.add_argument("--hostname", default="endpoint-alpha")
    sim_parser.add_argument("--source-ip", default="198.51.100.42")

    # 10. ingest
    ingest_parser = subparsers.add_parser("ingest")
    ingest_parser.add_argument("json_payload")

    args = parser.parse_args()

    db = Database.get_instance()
    ingestion = IngestionService.get_instance()

    if args.command == "overview":
        metrics = db.get_soc_overview_metrics()
        print(json.dumps(metrics))

    elif args.command == "events":
        events = db.query_events(
            limit=args.limit,
            offset=args.offset,
            hostname=args.hostname,
            device_id=args.device_id,
            event_type=args.event_type,
            action=args.action,
            status=args.status,
            source_ip=args.source_ip,
            username=args.username,
            since_timestamp=args.since,
            search=args.search
        )
        print(json.dumps({"events": events, "count": len(events)}))

    elif args.command == "alerts":
        alerts = db.query_alerts(
            limit=args.limit,
            offset=args.offset,
            status=args.status,
            severity=args.severity,
            hostname=args.hostname,
            device_id=args.device_id
        )
        print(json.dumps({"alerts": alerts, "count": len(alerts)}))

    elif args.command == "update-alert":
        updated = db.update_alert_status(args.alert_id, args.status.upper())
        print(json.dumps({"success": updated, "alert_id": args.alert_id, "new_status": args.status.upper()}))

    elif args.command == "incidents":
        incidents = db.query_incidents(limit=20)
        print(json.dumps({"incidents": incidents, "count": len(incidents)}))

    elif args.command == "devices":
        devices = db.get_devices()
        print(json.dumps({"devices": devices, "count": len(devices)}))

    elif args.command == "rules":
        rules = RuleLoader.load_rules()
        print(json.dumps({"rules": [r.to_dict() for r in rules], "count": len(rules)}))

    elif args.command == "report":
        if args.format == "csv":
            print(ReportService.generate_alerts_csv(db))
        else:
            print(ReportService.generate_executive_report_md(db))

    elif args.command == "simulate":
        sim_events = DemoSimulator.generate_scenario(
            scenario=args.scenario,
            count=args.count,
            hostname=args.hostname,
            source_ip=args.source_ip
        )
        res = ingestion.process_batch([e.to_dict() for e in sim_events])
        print(json.dumps({
            "status": "success",
            "scenario": args.scenario,
            "events_generated": len(sim_events),
            "alerts_created": res["total_alerts"],
            "incidents_created": res["total_incidents"]
        }))

    elif args.command == "ingest":
        try:
            payload = json.loads(args.json_payload)
            if isinstance(payload, list):
                res = ingestion.process_batch(payload)
            elif isinstance(payload, dict) and "events" in payload:
                res = ingestion.process_batch(payload["events"])
            else:
                res = ingestion.process_event(payload)
            print(json.dumps(res))
        except Exception as e:
            print(json.dumps({"error": str(e)}), file=sys.stderr)
            sys.exit(1)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
