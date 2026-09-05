"""
Security Log Parsers & Normalizers
Extracts structured security context from raw syslog, auth.log, sshd, sudo, and audit logs.
"""

import re
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timezone
import uuid
from server.models.event import SecurityEvent


class LinuxLogParser:
    # Regex patterns for common Linux security logs
    SSHD_FAILED = re.compile(
        r"sshd\[\d+\]:\s+Failed password for (invalid user )?(?P<user>\S+) from (?P<ip>[\d\.:a-fA-F]+) port (?P<port>\d+) ssh2",
        re.IGNORECASE
    )
    SSHD_ACCEPTED = re.compile(
        r"sshd\[\d+\]:\s+Accepted (password|publickey) for (?P<user>\S+) from (?P<ip>[\d\.:a-fA-F]+) port (?P<port>\d+) ssh2",
        re.IGNORECASE
    )
    SSHD_INVALID_USER = re.compile(
        r"sshd\[\d+\]:\s+Invalid user (?P<user>\S+) from (?P<ip>[\d\.:a-fA-F]+) port (?P<port>\d+)",
        re.IGNORECASE
    )
    SUDO_SUCCESS = re.compile(
        r"sudo:\s+(?P<user>\S+)\s*:\s*TTY=(?P<tty>\S+)\s*;\s*PWD=(?P<pwd>\S+)\s*;\s*USER=(?P<target_user>\S+)\s*;\s*COMMAND=(?P<cmd>.+)",
        re.IGNORECASE
    )
    SUDO_DENIED = re.compile(
        r"sudo:\s+(?P<user>\S+)\s*:\s*user NOT in sudoers\s*;\s*TTY=(?P<tty>\S+)\s*;\s*PWD=(?P<pwd>\S+)\s*;\s*COMMAND=(?P<cmd>.+)",
        re.IGNORECASE
    )
    SUDO_INCORRECT_PW = re.compile(
        r"sudo:\s+(?P<user>\S+)\s*:\s*\d+ incorrect password attempt",
        re.IGNORECASE
    )

    @classmethod
    def parse_line(
        cls,
        line: str,
        hostname: str = "endpoint",
        device_id: str = "dev-01",
        operating_system: str = "Linux"
    ) -> Optional[SecurityEvent]:
        """
        Parse a single log line into a normalized SecurityEvent.
        """
        line_clean = line.strip()
        if not line_clean:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Check SSH Failed Login
        m = cls.SSHD_FAILED.search(line_clean)
        if m:
            user = m.group("user")
            ip = m.group("ip")
            port = int(m.group("port"))
            return SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=now_iso,
                received_at=now_iso,
                hostname=hostname,
                device_id=device_id,
                operating_system=operating_system,
                source_ip=ip,
                destination_port=22,
                source_port=port,
                username=user,
                event_type="authentication",
                action="login",
                status="failure",
                severity_hint="MEDIUM" if user != "root" else "HIGH",
                raw_message=line_clean,
                metadata={"service": "sshd", "auth_result": "failed_password"}
            )

        # 2. Check SSH Accepted Login
        m = cls.SSHD_ACCEPTED.search(line_clean)
        if m:
            user = m.group("user")
            ip = m.group("ip")
            port = int(m.group("port"))
            is_root = user.lower() == "root"
            return SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=now_iso,
                received_at=now_iso,
                hostname=hostname,
                device_id=device_id,
                operating_system=operating_system,
                source_ip=ip,
                destination_port=22,
                source_port=port,
                username=user,
                event_type="authentication",
                action="login",
                status="success",
                severity_hint="HIGH" if is_root else "LOW",
                raw_message=line_clean,
                metadata={"service": "sshd", "auth_result": "accepted"}
            )

        # 3. Check SSH Invalid User
        m = cls.SSHD_INVALID_USER.search(line_clean)
        if m:
            user = m.group("user")
            ip = m.group("ip")
            port = int(m.group("port"))
            return SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=now_iso,
                received_at=now_iso,
                hostname=hostname,
                device_id=device_id,
                operating_system=operating_system,
                source_ip=ip,
                destination_port=22,
                source_port=port,
                username=user,
                event_type="authentication",
                action="login",
                status="failure",
                severity_hint="MEDIUM",
                raw_message=line_clean,
                metadata={"service": "sshd", "reason": "invalid_user"}
            )

        # 4. Check Sudo Successful Execution
        m = cls.SUDO_SUCCESS.search(line_clean)
        if m:
            user = m.group("user")
            target_user = m.group("target_user")
            cmd = m.group("cmd")
            return SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=now_iso,
                received_at=now_iso,
                hostname=hostname,
                device_id=device_id,
                operating_system=operating_system,
                username=target_user,
                event_type="privilege",
                action="sudo",
                status="success",
                severity_hint="HIGH" if target_user == "root" else "MEDIUM",
                raw_message=line_clean,
                metadata={"executed_by": user, "target_user": target_user, "command": cmd}
            )

        # 5. Check Sudo Denied / Not in sudoers
        m = cls.SUDO_DENIED.search(line_clean)
        if m:
            user = m.group("user")
            cmd = m.group("cmd")
            return SecurityEvent(
                id=str(uuid.uuid4()),
                timestamp=now_iso,
                received_at=now_iso,
                hostname=hostname,
                device_id=device_id,
                operating_system=operating_system,
                username=user,
                event_type="privilege",
                action="sudo",
                status="denied",
                severity_hint="HIGH",
                raw_message=line_clean,
                metadata={"executed_by": user, "command": cmd, "reason": "not_in_sudoers"}
            )

        # Generic syslog fallback
        return SecurityEvent(
            id=str(uuid.uuid4()),
            timestamp=now_iso,
            received_at=now_iso,
            hostname=hostname,
            device_id=device_id,
            operating_system=operating_system,
            event_type="system",
            action="log",
            status="info",
            severity_hint="LOW",
            raw_message=line_clean
        )
