"""
Windows Security Event Log Collector Abstraction
"""

from typing import List, Generator
from server.models.event import SecurityEvent
from agent.collectors.base import BaseCollector


class WindowsCollector(BaseCollector):
    def __init__(self, hostname: str, device_id: str, operating_system: str = "Windows", agent_version: str = "1.0.0"):
        super().__init__(hostname, device_id, operating_system, agent_version)

    def collect(self) -> List[SecurityEvent]:
        """
        Poll Windows Event Logs (Security Channel Event IDs 4624, 4625, 4672, 4688).
        """
        # Production stub with graceful cross-platform safety
        return []

    def stream_lines(self) -> Generator[str, None, None]:
        return
        yield
