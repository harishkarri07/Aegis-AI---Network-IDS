"""
SQLite Persistence Layer for Mini-SIEM / IDS
Provides transactional storage, indexing, querying, and schema management.
"""

import sqlite3
import json
import os
import threading
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone, timedelta

DB_PATH = os.environ.get("SIEM_DB_PATH", os.path.join(os.getcwd(), "siem_data.db"))


class Database:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._local = threading.local()
        self.init_schema()

    @classmethod
    def get_instance(cls, db_path: str = DB_PATH) -> 'Database':
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls(db_path)
            return cls._instance

    def get_connection(self) -> sqlite3.Connection:
        """Get thread-local SQLite connection with WAL mode and foreign keys enabled."""
        if not hasattr(self._local, "conn") or self._local.conn is None:
            conn = sqlite3.connect(self.db_path, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA foreign_keys=ON;")
            self._local.conn = conn
        return self._local.conn

    def init_schema(self):
        """Initialize required database tables and indexes."""
        conn = self.get_connection()
        with conn:
            # 1. Events Table
            conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                received_at TEXT NOT NULL,
                hostname TEXT NOT NULL,
                device_id TEXT NOT NULL,
                operating_system TEXT,
                agent_version TEXT,
                source_ip TEXT,
                destination_ip TEXT,
                source_port INTEGER,
                destination_port INTEGER,
                username TEXT,
                event_type TEXT NOT NULL,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                severity_hint TEXT,
                raw_message TEXT,
                metadata_json TEXT,
                is_simulated INTEGER DEFAULT 0
            );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_hostname ON events(hostname);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_source_ip ON events(source_ip);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_username ON events(username);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_type_action ON events(event_type, action, status);")

            # 2. Devices Table
            conn.execute("""
            CREATE TABLE IF NOT EXISTS devices (
                device_id TEXT PRIMARY KEY,
                hostname TEXT NOT NULL,
                operating_system TEXT NOT NULL,
                agent_version TEXT,
                ip_address TEXT,
                mac_address TEXT,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'ONLINE',
                metadata_json TEXT
            );
            """)

            # 3. Alerts Table
            conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                alert_id TEXT PRIMARY KEY,
                rule_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                severity TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                hostname TEXT NOT NULL,
                device_id TEXT NOT NULL,
                source_ip TEXT,
                destination_ip TEXT,
                username TEXT,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                event_count INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'OPEN',
                matched_conditions_json TEXT,
                evidence_event_ids_json TEXT,
                recommendation TEXT,
                mitre_technique TEXT,
                mitre_tactic TEXT,
                metadata_json TEXT
            );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_last_seen ON alerts(last_seen);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);")

            # 4. Incidents (Correlated Multi-Stage Attacks)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                incident_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT,
                severity TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                hostname TEXT NOT NULL,
                device_id TEXT NOT NULL,
                source_ip TEXT,
                username TEXT,
                stages_json TEXT,
                alert_ids_json TEXT,
                event_ids_json TEXT,
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'OPEN',
                recommendation TEXT,
                mitre_attack_chain_json TEXT,
                metadata_json TEXT
            );
            """)

            # 5. Detection Rules
            conn.execute("""
            CREATE TABLE IF NOT EXISTS rules (
                rule_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                severity TEXT NOT NULL,
                risk_score INTEGER NOT NULL,
                timeframe INTEGER NOT NULL DEFAULT 120,
                count INTEGER NOT NULL DEFAULT 1,
                group_by TEXT,
                conditions_json TEXT NOT NULL,
                preceding_rule TEXT,
                enabled INTEGER NOT NULL DEFAULT 1,
                mitre_technique TEXT,
                mitre_tactic TEXT,
                recommendation TEXT
            );
            """)

    # ------------------- Event Methods -------------------
    def insert_event(self, event_dict: Dict[str, Any]) -> str:
        conn = self.get_connection()
        meta = json.dumps(event_dict.get("metadata", {}))
        is_sim = 1 if event_dict.get("is_simulated", False) else 0
        with conn:
            conn.execute("""
            INSERT OR REPLACE INTO events (
                id, timestamp, received_at, hostname, device_id, operating_system,
                agent_version, source_ip, destination_ip, source_port, destination_port,
                username, event_type, action, status, severity_hint, raw_message,
                metadata_json, is_simulated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_dict["id"],
                event_dict.get("timestamp"),
                event_dict.get("received_at"),
                event_dict.get("hostname", "unknown"),
                event_dict.get("device_id", "unknown"),
                event_dict.get("operating_system", "unknown"),
                event_dict.get("agent_version", "1.0.0"),
                event_dict.get("source_ip"),
                event_dict.get("destination_ip"),
                event_dict.get("source_port"),
                event_dict.get("destination_port"),
                event_dict.get("username"),
                event_dict.get("event_type", "system"),
                event_dict.get("action", "unknown"),
                event_dict.get("status", "info"),
                event_dict.get("severity_hint", "LOW"),
                event_dict.get("raw_message", ""),
                meta,
                is_sim
            ))
        return event_dict["id"]

    def insert_events_batch(self, events: List[Dict[str, Any]]) -> int:
        conn = self.get_connection()
        with conn:
            for ev in events:
                meta = json.dumps(ev.get("metadata", {}))
                is_sim = 1 if ev.get("is_simulated", False) else 0
                conn.execute("""
                INSERT OR REPLACE INTO events (
                    id, timestamp, received_at, hostname, device_id, operating_system,
                    agent_version, source_ip, destination_ip, source_port, destination_port,
                    username, event_type, action, status, severity_hint, raw_message,
                    metadata_json, is_simulated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    ev["id"],
                    ev.get("timestamp"),
                    ev.get("received_at"),
                    ev.get("hostname", "unknown"),
                    ev.get("device_id", "unknown"),
                    ev.get("operating_system", "unknown"),
                    ev.get("agent_version", "1.0.0"),
                    ev.get("source_ip"),
                    ev.get("destination_ip"),
                    ev.get("source_port"),
                    ev.get("destination_port"),
                    ev.get("username"),
                    ev.get("event_type", "system"),
                    ev.get("action", "unknown"),
                    ev.get("status", "info"),
                    ev.get("severity_hint", "LOW"),
                    ev.get("raw_message", ""),
                    meta,
                    is_sim
                ))
        return len(events)

    def query_events(
        self,
        limit: int = 100,
        offset: int = 0,
        hostname: Optional[str] = None,
        device_id: Optional[str] = None,
        event_type: Optional[str] = None,
        action: Optional[str] = None,
        status: Optional[str] = None,
        source_ip: Optional[str] = None,
        username: Optional[str] = None,
        since_timestamp: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM events WHERE 1=1"
        params: List[Any] = []

        if hostname:
            query += " AND hostname = ?"
            params.append(hostname)
        if device_id:
            query += " AND device_id = ?"
            params.append(device_id)
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        if action:
            query += " AND action = ?"
            params.append(action)
        if status:
            query += " AND status = ?"
            params.append(status)
        if source_ip:
            query += " AND source_ip = ?"
            params.append(source_ip)
        if username:
            query += " AND username = ?"
            params.append(username)
        if since_timestamp:
            query += " AND timestamp >= ?"
            params.append(since_timestamp)
        if search:
            query += " AND (raw_message LIKE ? OR username LIKE ? OR source_ip LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param])

        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["metadata"] = json.loads(d.pop("metadata_json") or "{}")
            d["is_simulated"] = bool(d.get("is_simulated", 0))
            results.append(d)
        return results

    def get_event_count(self) -> int:
        conn = self.get_connection()
        cursor = conn.execute("SELECT COUNT(*) FROM events")
        return cursor.fetchone()[0]

    # ------------------- Device Methods -------------------
    def register_or_update_device(self, device_dict: Dict[str, Any]) -> None:
        conn = self.get_connection()
        meta = json.dumps(device_dict.get("metadata", {}))
        with conn:
            conn.execute("""
            INSERT INTO devices (
                device_id, hostname, operating_system, agent_version,
                ip_address, mac_address, first_seen, last_seen, status, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(device_id) DO UPDATE SET
                hostname=excluded.hostname,
                operating_system=excluded.operating_system,
                agent_version=excluded.agent_version,
                ip_address=COALESCE(excluded.ip_address, devices.ip_address),
                mac_address=COALESCE(excluded.mac_address, devices.mac_address),
                last_seen=excluded.last_seen,
                status='ONLINE',
                metadata_json=excluded.metadata_json;
            """, (
                device_dict["device_id"],
                device_dict.get("hostname", "unknown"),
                device_dict.get("operating_system", "unknown"),
                device_dict.get("agent_version", "1.0.0"),
                device_dict.get("ip_address"),
                device_dict.get("mac_address"),
                device_dict.get("first_seen", datetime.now(timezone.utc).isoformat()),
                device_dict.get("last_seen", datetime.now(timezone.utc).isoformat()),
                device_dict.get("status", "ONLINE"),
                meta
            ))

    def update_device_heartbeat(self, device_id: str, last_seen: Optional[str] = None) -> None:
        conn = self.get_connection()
        ls = last_seen or datetime.now(timezone.utc).isoformat()
        with conn:
            conn.execute("""
            UPDATE devices SET last_seen = ?, status = 'ONLINE' WHERE device_id = ?
            """, (ls, device_id))

    def get_devices(self, offline_threshold_seconds: int = 300) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.execute("SELECT * FROM devices ORDER BY last_seen DESC")
        rows = cursor.fetchall()
        now = datetime.now(timezone.utc)
        results = []
        for r in rows:
            d = dict(r)
            d["metadata"] = json.loads(d.pop("metadata_json") or "{}")
            # Calculate dynamic online/offline status
            try:
                ls_dt = datetime.fromisoformat(d["last_seen"].replace("Z", "+00:00"))
                diff = (now - ls_dt).total_seconds()
                d["status"] = "ONLINE" if diff <= offline_threshold_seconds else "OFFLINE"
            except Exception:
                d["status"] = "UNKNOWN"
            results.append(d)
        return results

    # ------------------- Alert Methods -------------------
    def find_matching_open_alert(
        self,
        rule_id: str,
        hostname: str,
        source_ip: Optional[str] = None,
        username: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Find an existing OPEN alert matching the rule and context for aggregation/deduplication."""
        conn = self.get_connection()
        query = """
        SELECT * FROM alerts 
        WHERE rule_id = ? AND hostname = ? AND status = 'OPEN'
        """
        params = [rule_id, hostname]
        if source_ip:
            query += " AND (source_ip = ? OR source_ip IS NULL)"
            params.append(source_ip)
        if username:
            query += " AND (username = ? OR username IS NULL)"
            params.append(username)
            
        query += " ORDER BY last_seen DESC LIMIT 1"
        cursor = conn.execute(query, params)
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["matched_conditions"] = json.loads(d.pop("matched_conditions_json") or "[]")
            d["evidence_event_ids"] = json.loads(d.pop("evidence_event_ids_json") or "[]")
            d["metadata"] = json.loads(d.pop("metadata_json") or "{}")
            return d
        return None

    def insert_alert(self, alert_dict: Dict[str, Any]) -> str:
        conn = self.get_connection()
        matched = json.dumps(alert_dict.get("matched_conditions", []))
        evidence = json.dumps(alert_dict.get("evidence_event_ids", []))
        meta = json.dumps(alert_dict.get("metadata", {}))
        with conn:
            conn.execute("""
            INSERT OR REPLACE INTO alerts (
                alert_id, rule_id, title, description, severity, risk_score,
                hostname, device_id, source_ip, destination_ip, username,
                first_seen, last_seen, event_count, status, matched_conditions_json,
                evidence_event_ids_json, recommendation, mitre_technique, mitre_tactic,
                metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                alert_dict["alert_id"],
                alert_dict.get("rule_id", "GENERIC"),
                alert_dict.get("title", "Security Alert"),
                alert_dict.get("description", ""),
                alert_dict.get("severity", "MEDIUM"),
                alert_dict.get("risk_score", 50),
                alert_dict.get("hostname", "unknown"),
                alert_dict.get("device_id", "unknown"),
                alert_dict.get("source_ip"),
                alert_dict.get("destination_ip"),
                alert_dict.get("username"),
                alert_dict.get("first_seen"),
                alert_dict.get("last_seen"),
                alert_dict.get("event_count", 1),
                alert_dict.get("status", "OPEN"),
                matched,
                evidence,
                alert_dict.get("recommendation", ""),
                alert_dict.get("mitre_technique"),
                alert_dict.get("mitre_tactic"),
                meta
            ))
        return alert_dict["alert_id"]

    def update_alert_status(self, alert_id: str, new_status: str) -> bool:
        conn = self.get_connection()
        with conn:
            cursor = conn.execute(
                "UPDATE alerts SET status = ? WHERE alert_id = ?",
                (new_status, alert_id)
            )
            return cursor.rowcount > 0

    def query_alerts(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        hostname: Optional[str] = None,
        device_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        query = "SELECT * FROM alerts WHERE 1=1"
        params: List[Any] = []

        if status:
            query += " AND status = ?"
            params.append(status)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if hostname:
            query += " AND hostname = ?"
            params.append(hostname)
        if device_id:
            query += " AND device_id = ?"
            params.append(device_id)

        query += " ORDER BY last_seen DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor = conn.execute(query, params)
        rows = cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["matched_conditions"] = json.loads(d.pop("matched_conditions_json") or "[]")
            d["evidence_event_ids"] = json.loads(d.pop("evidence_event_ids_json") or "[]")
            d["metadata"] = json.loads(d.pop("metadata_json") or "{}")
            results.append(d)
        return results

    # ------------------- Incident Methods -------------------
    def insert_or_update_incident(self, inc_dict: Dict[str, Any]) -> str:
        conn = self.get_connection()
        stages = json.dumps(inc_dict.get("stages", []))
        alerts = json.dumps(inc_dict.get("alert_ids", []))
        events = json.dumps(inc_dict.get("event_ids", []))
        mitre = json.dumps(inc_dict.get("mitre_attack_chain", []))
        meta = json.dumps(inc_dict.get("metadata", {}))

        with conn:
            conn.execute("""
            INSERT OR REPLACE INTO incidents (
                incident_id, title, summary, severity, risk_score,
                hostname, device_id, source_ip, username, stages_json,
                alert_ids_json, event_ids_json, first_seen, last_seen,
                status, recommendation, mitre_attack_chain_json, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                inc_dict["incident_id"],
                inc_dict.get("title", "Correlated Incident"),
                inc_dict.get("summary", ""),
                inc_dict.get("severity", "HIGH"),
                inc_dict.get("risk_score", 75),
                inc_dict.get("hostname", "unknown"),
                inc_dict.get("device_id", "unknown"),
                inc_dict.get("source_ip"),
                inc_dict.get("username"),
                stages,
                alerts,
                events,
                inc_dict.get("first_seen"),
                inc_dict.get("last_seen"),
                inc_dict.get("status", "OPEN"),
                inc_dict.get("recommendation", ""),
                mitre,
                meta
            ))
        return inc_dict["incident_id"]

    def query_incidents(self, limit: int = 20) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.execute("SELECT * FROM incidents ORDER BY last_seen DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            d["stages"] = json.loads(d.pop("stages_json") or "[]")
            d["alert_ids"] = json.loads(d.pop("alert_ids_json") or "[]")
            d["event_ids"] = json.loads(d.pop("event_ids_json") or "[]")
            d["mitre_attack_chain"] = json.loads(d.pop("mitre_attack_chain_json") or "[]")
            d["metadata"] = json.loads(d.pop("metadata_json") or "{}")
            results.append(d)
        return results

    # ------------------- Metrics & Aggregations -------------------
    def get_soc_overview_metrics(self) -> Dict[str, Any]:
        """Aggregate fast SOC overview metrics in a single query pass."""
        conn = self.get_connection()
        
        # 1. Total events
        ev_count = conn.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        
        # 2. Total alerts & breakdown by severity
        cursor = conn.execute("""
        SELECT severity, COUNT(*) as cnt, SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_cnt
        FROM alerts GROUP BY severity
        """)
        sev_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
        total_open_alerts = 0
        critical_alerts = 0
        for row in cursor.fetchall():
            s = row["severity"]
            cnt = row["cnt"]
            open_cnt = row["open_cnt"]
            if s in sev_counts:
                sev_counts[s] = cnt
            if s == "CRITICAL":
                critical_alerts += open_cnt
            total_open_alerts += open_cnt

        # 3. Devices count & online status
        devices = self.get_devices()
        total_devices = len(devices)
        online_devices = sum(1 for d in devices if d["status"] == "ONLINE")

        # 4. Top source IPs
        cursor = conn.execute("""
        SELECT source_ip, COUNT(*) as cnt 
        FROM events 
        WHERE source_ip IS NOT NULL AND source_ip != ''
        GROUP BY source_ip ORDER BY cnt DESC LIMIT 5
        """)
        top_ips = [{"ip": r["source_ip"], "count": r["cnt"]} for r in cursor.fetchall()]

        # 5. Top affected hosts
        cursor = conn.execute("""
        SELECT hostname, COUNT(*) as cnt 
        FROM events 
        GROUP BY hostname ORDER BY cnt DESC LIMIT 5
        """)
        top_hosts = [{"hostname": r["hostname"], "count": r["cnt"]} for r in cursor.fetchall()]

        # 6. Event type distribution
        cursor = conn.execute("""
        SELECT event_type, COUNT(*) as cnt 
        FROM events GROUP BY event_type ORDER BY cnt DESC
        """)
        event_types = {r["event_type"]: r["cnt"] for r in cursor.fetchall()}

        return {
            "total_events": ev_count,
            "total_open_alerts": total_open_alerts,
            "critical_alerts": critical_alerts,
            "severity_distribution": sev_counts,
            "total_devices": total_devices,
            "online_devices": online_devices,
            "top_source_ips": top_ips,
            "top_affected_hosts": top_hosts,
            "event_type_distribution": event_types
        }
