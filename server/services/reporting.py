"""
Security Reporting Service
Generates structured Markdown, HTML, and CSV SOC reports.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import io
import csv
from server.database.db import Database


class ReportService:
    @staticmethod
    def generate_executive_report_md(db: Optional[Database] = None) -> str:
        database = db or Database.get_instance()
        metrics = database.get_soc_overview_metrics()
        alerts = database.query_alerts(limit=20)
        incidents = database.query_incidents(limit=10)
        devices = database.get_devices()

        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        md = []
        md.append("# Aegis Mini-SIEM / IDS — Security Executive Report")
        md.append(f"**Generated:** {now_str}\n")
        md.append("---")
        md.append("## 1. Executive Summary")
        md.append(f"- **Total Security Events Ingested:** `{metrics['total_events']:,}`")
        md.append(f"- **Active Monitored Endpoints:** `{metrics['online_devices']} online / {metrics['total_devices']} registered`")
        md.append(f"- **Open Security Alerts:** `{metrics['total_open_alerts']}` (`{metrics['critical_alerts']}` Critical)")
        md.append(f"- **Correlated Multi-Stage Incidents:** `{len(incidents)}`\n")

        md.append("## 2. Threat Severity Breakdown")
        md.append("| Severity | Active Count |")
        md.append("| :--- | :--- |")
        for sev, count in metrics["severity_distribution"].items():
            md.append(f"| **{sev}** | {count} |")
        md.append("")

        md.append("## 3. High-Priority Alerts & Investigations")
        if not alerts:
            md.append("*No security alerts recorded.*")
        else:
            md.append("| Alert ID | Severity | Title | Host | Source IP | Time (UTC) | Status |")
            md.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
            for a in alerts[:10]:
                md.append(
                    f"| `{a['alert_id']}` | **{a['severity']}** | {a['title']} | "
                    f"`{a['hostname']}` | `{a.get('source_ip') or 'N/A'}` | {a['last_seen'][:19]} | {a['status']} |"
                )
        md.append("")

        md.append("## 4. Correlated Multi-Stage Incidents")
        if not incidents:
            md.append("*No correlated multi-stage attack chains detected.*")
        else:
            for inc in incidents:
                md.append(f"### Incident: `{inc['incident_id']}` — {inc['title']}")
                md.append(f"- **Severity:** **{inc['severity']}** (Risk Score: `{inc['risk_score']}/100`)")
                md.append(f"- **Target Host:** `{inc['hostname']}` | **Attacker IP:** `{inc.get('source_ip') or 'Unknown'}`")
                md.append(f"- **Observed Stages:** {' → '.join(inc['stages'])}")
                md.append(f"- **MITRE ATT&CK Techniques:** {', '.join(inc['mitre_attack_chain']) if inc['mitre_attack_chain'] else 'None'}")
                md.append(f"- **Actionable Recommendation:** {inc['recommendation']}")
                md.append("")

        md.append("## 5. Top Threat Sources & Monitored Assets")
        md.append("### Top Originating Source IPs")
        if metrics["top_source_ips"]:
            for ip_info in metrics["top_source_ips"]:
                md.append(f"- `{ip_info['ip']}`: {ip_info['count']} events")
        else:
            md.append("- *No external source IPs recorded.*")
        md.append("")

        md.append("## 6. Strategic Recommendations")
        md.append("1. **Firewall Ingress Policy:** Isolate repeated brute-force source IPs identified above.")
        md.append("2. **Privileged Access Control:** Enforce multi-factor authentication (MFA) and audit sudoers configuration on Linux hosts.")
        md.append("3. **Endpoint Hygiene:** Ensure all monitored devices have active heartbeats and zero unacknowledged critical alerts.")

        return "\n".join(md)

    @staticmethod
    def generate_alerts_csv(db: Optional[Database] = None) -> str:
        database = db or Database.get_instance()
        alerts = database.query_alerts(limit=500)
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "alert_id", "rule_id", "severity", "risk_score", "title",
            "hostname", "source_ip", "username", "first_seen", "last_seen",
            "event_count", "status", "mitre_technique", "recommendation"
        ])

        for a in alerts:
            writer.writerow([
                a.get("alert_id"),
                a.get("rule_id"),
                a.get("severity"),
                a.get("risk_score"),
                a.get("title"),
                a.get("hostname"),
                a.get("source_ip"),
                a.get("username"),
                a.get("first_seen"),
                a.get("last_seen"),
                a.get("event_count"),
                a.get("status"),
                a.get("mitre_technique"),
                a.get("recommendation")
            ])

        return output.getvalue()
