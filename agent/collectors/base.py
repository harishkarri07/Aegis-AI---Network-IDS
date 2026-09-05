"""
Base Collector Interface for Endpoint Telemetry
"""

from abc import ABC, abstractmethod
from typing import List, Generator, Optional
from server.models.event import SecurityEvent


class BaseCollector(ABC):
    def __init__(self, hostname: str, device_id: str, operating_system: str, agent_version: str = "1.0.0"):
        self.hostname = hostname
        self.device_id = device_id
        self.operating_system = operating_system
        self.agent_version = agent_version

    @abstractmethod
    def collect(self) -> List[SecurityEvent]:
        """Poll and collect new security events since last run."""
        pass

    @abstractmethod
    def stream_lines(self) -> Generator[str, None, None]:
        """Follow or tail logs in real-time."""
        pass
