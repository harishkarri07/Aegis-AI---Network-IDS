"""
Safe Security Telemetry & Attack Scenario Simulator
Generates controlled, transparently simulated security events for demonstration and training.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import uuid
from server.models.event import SecurityEvent


class DemoSimulator:
    @staticmethod
    def generate_scenario(
        scenario: str = "ssh_brute_force",
        count: int = 5,
        hostname: str = "endpoint-alpha",
        source_ip: str = "198.51.100.42"
    ) -> List[SecurityEvent]:
        """
        Generate a list of simulated SecurityEvents for a chosen scenario.
        """
        events: List[SecurityEvent] = []
        now = datetime.now(timezone.utc)

        if scenario == "ssh_brute_force":
            # Multiple failed SSH logins within short timeframe
            for i in range(count):
                ts = (now - timedelta(seconds=(count - i) * 10)).isoformat()
                ev = SecurityEvent(
                    id=str(uuid.uuid4()),
                    timestamp=ts,
                    received_at=ts,
                    hostname=hostname,
                    device_id=f"dev-{hostname}",
                    operating_system="Linux (Ubuntu 22.04 LTS)",
                    agent_version="1.0.0",
                    source_ip=source_ip,
                    destination_ip="192.168.1.100",
                    source_port=49000 + i,
                    destination_port=22,
                    username=f"user_{i}",
                    event_type="authentication",
                    action="login",
                    status="failure",
                    severity_hint="MEDIUM",
                    raw_message=f"Failed password for invalid user user_{i} from {source_ip} port {49000+i} ssh2",
                    metadata={"service": "sshd", "auth_method": "password", "simulated_scenario": "ssh_brute_force"},
                    is_simulated=True
                )
                events.append(ev)

        elif scenario == "credential_compromise_chain":
            # Multi-stage attack chain: 4 failed attempts -> 1 successful login -> sudo privilege escalation
            # Stage 1: Failed attempts
            for i in range(4):
                ts = (now - timedelta(seconds=(6 - i) * 20)).isoformat()
                events.append(SecurityEvent(
                    id=str(uuid.uuid4()),
                    timestamp=ts,
                    received_at=ts,
                    hostname=hostname,
                    device_id=f"dev-{hostname}",
                    operating_system="Linux (Ubuntu 22.04 LTS)",
                    agent_version="1.0.0",
                    source_ip=source_ip,
                    destination_ip="192.168.1.100",
                    source_port=51000 + i,
                    destination_port=22,
                    username="deploy_service",
                    event_type="authentication",
                    action="login",
                    status="failure",
                    severity_hint="MEDIUM",
                    raw_message=f"Failed password for deploy_service from {source_ip} port {51000+i} ssh2",
                    metadata={"service": "sshd", "simulated_scenario": "credential_compromise_chain"},
                    is_simulated=True
                ))
            # Stage 2: Successful login following failures
            ts_success = (now - timedelta(seconds=30)).isoformat()
            events.append(SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=ts_success,
                received_at=ts_success,
                hostname=hostname,
                device_id=f"dev-{hostname}",
                operating_system="Linux (Ubuntu 22.04 LTS)",
                agent_version="1.0.0",
                source_ip=source_ip,
                destination_ip="192.168.1.100",
                source_port=51010,
                destination_port=22,
                username="deploy_service",
                event_type="authentication",
                action="login",
                status="success",
                severity_hint="CRITICAL",
                raw_message=f"Accepted password for deploy_service from {source_ip} port 51010 ssh2",
                metadata={"service": "sshd", "simulated_scenario": "credential_compromise_chain"},
                is_simulated=True
            ))
            # Stage 3: Privilege escalation via sudo
            ts_sudo = (now - timedelta(seconds=10)).isoformat()
            events.append(SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=ts_sudo,
                received_at=ts_sudo,
                hostname=hostname,
                device_id=f"dev-{hostname}",
                operating_system="Linux (Ubuntu 22.04 LTS)",
                agent_version="1.0.0",
                source_ip=source_ip,
                destination_ip="192.168.1.100",
                username="root",
                event_type="privilege",
                action="sudo",
                status="success",
                severity_hint="HIGH",
                raw_message=f"deploy_service : TTY=pts/0 ; PWD=/tmp ; USER=root ; COMMAND=/bin/bash",
                metadata={"command": "/bin/bash", "executed_by": "deploy_service", "simulated_scenario": "credential_compromise_chain"},
                is_simulated=True
            ))

        elif scenario == "port_scan":
            # Reconnaissance port sweep across 12 distinct ports
            common_ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 8080]
            for i, p in enumerate(common_ports[:count]):
                ts = (now - timedelta(seconds=(count - i) * 2)).isoformat()
                events.append(SecurityEvent(
                    id=str(uuid.uuid4()),
                    timestamp=ts,
                    received_at=ts,
                    hostname=hostname,
                    device_id=f"dev-{hostname}",
                    operating_system="Linux (Ubuntu 22.04 LTS)",
                    agent_version="1.0.0",
                    source_ip=source_ip,
                    destination_ip="192.168.1.100",
                    source_port=60000 + i,
                    destination_port=p,
                    event_type="connection",
                    action="scan",
                    status="attempt",
                    severity_hint="MEDIUM",
                    raw_message=f"TCP SYN probe received on port {p} from {source_ip}",
                    metadata={"flag": "SYN", "port": p, "simulated_scenario": "port_scan"},
                    is_simulated=True
                ))

        elif scenario == "suspicious_root_login":
            ts = now.isoformat()
            events.append(SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=ts,
                received_at=ts,
                hostname=hostname,
                device_id=f"dev-{hostname}",
                operating_system="Linux (Ubuntu 22.04 LTS)",
                agent_version="1.0.0",
                source_ip=source_ip,
                destination_ip="192.168.1.100",
                source_port=48892,
                destination_port=22,
                username="root",
                event_type="authentication",
                action="login",
                status="success",
                severity_hint="HIGH",
                raw_message=f"Accepted password for root from {source_ip} port 48892 ssh2",
                metadata={"service": "sshd", "simulated_scenario": "suspicious_root_login"},
                is_simulated=True
            ))

        elif scenario == "privilege_denial":
            for i in range(count):
                ts = (now - timedelta(seconds=(count - i) * 15)).isoformat()
                events.append(SecurityEvent(
                    id=str(uuid.uuid4()),
                    timestamp=ts,
                    received_at=ts,
                    hostname=hostname,
                    device_id=f"dev-{hostname}",
                    operating_system="Linux (Ubuntu 22.04 LTS)",
                    agent_version="1.0.0",
                    source_ip="127.0.0.1",
                    username="guest_user",
                    event_type="privilege",
                    action="sudo",
                    status="denied",
                    severity_hint="HIGH",
                    raw_message=f"guest_user : user NOT in sudoers ; TTY=pts/1 ; PWD=/home/guest ; COMMAND=/bin/cat /etc/shadow",
                    metadata={"command": "/bin/cat /etc/shadow", "simulated_scenario": "privilege_denial"},
                    is_simulated=True
                ))

        return events
