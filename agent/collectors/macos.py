"""
macOS Unified Log Collector Abstraction
"""

from typing import List, Generator
from server.models.event import SecurityEvent
from agent.collectors.base import BaseCollector


class MacOSCollector(BaseCollector):
    def __init__(self, hostname: str, device_id: str, operating_system: str = "Darwin", agent_version: str = "1.0.0"):
        super().__init__(hostname, device_id, operating_system, agent_version)

    def collect(self) -> List[SecurityEvent]:
        """
        Poll macOS Unified Log stream (log stream --predicate 'process == "sshd" OR process == "sudo"').
        """
        return []

    def stream_lines(self) -> Generator[str, None, None]:
        return
        yield
