"""
Linux Log Collector
Monitors /var/log/auth.log, /var/log/secure, and /var/log/syslog with log rotation support.
"""

import os
import time
from typing import List, Generator, Dict, Any, Optional
from server.models.event import SecurityEvent
from agent.collectors.base import BaseCollector
from agent.parser import LinuxLogParser

DEFAULT_LOG_PATHS = [
    "/var/log/auth.log",
    "/var/log/secure",
    "/var/log/syslog"
]


class LinuxCollector(BaseCollector):
    def __init__(
        self,
        hostname: str,
        device_id: str,
        operating_system: str = "Linux",
        agent_version: str = "1.0.0",
        log_paths: Optional[List[str]] = None
    ):
        super().__init__(hostname, device_id, operating_system, agent_version)
        self.log_paths = log_paths or [p for p in DEFAULT_LOG_PATHS if os.path.exists(p)]
        self._file_positions: Dict[str, int] = {}

    def collect(self) -> List[SecurityEvent]:
        """Read newly appended lines from monitored log files without blocking."""
        events: List[SecurityEvent] = []

        for path in self.log_paths:
            if not os.path.exists(path) or not os.access(path, os.R_OK):
                continue

            current_size = os.path.getsize(path)
            last_pos = self._file_positions.get(path, 0)

            # Handle log rotation (file shrunk)
            if current_size < last_pos:
                last_pos = 0

            if current_size == last_pos:
                continue

            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    f.seek(last_pos)
                    lines = f.readlines()
                    self._file_positions[path] = f.tell()

                    for line in lines:
                        ev = LinuxLogParser.parse_line(
                            line,
                            hostname=self.hostname,
                            device_id=self.device_id,
                            operating_system=self.operating_system
                        )
                        if ev:
                            events.append(ev)
            except Exception as e:
                # Silently handle permission/locking issues in non-root test environments
                pass

        return events

    def stream_lines(self) -> Generator[str, None, None]:
        """Generator tailing log files."""
        while True:
            for path in self.log_paths:
                if not os.path.exists(path):
                    continue
                try:
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        f.seek(self._file_positions.get(path, 0))
                        while True:
                            line = f.readline()
                            if not line:
                                break
                            self._file_positions[path] = f.tell()
                            yield line
                except Exception:
                    pass
            time.sleep(1)
