"""
Normalized Security Event Model
Represents standard defensive telemetry across all endpoints and operating systems.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import uuid


def utc_now_iso() -> str:
    """Return current UTC timestamp formatted as ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()


@dataclass
class SecurityEvent:
    # Identifiers & Timestamps
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=utc_now_iso)  # ISO-8601 UTC
    received_at: str = field(default_factory=utc_now_iso)  # ISO-8601 UTC
    
    # Endpoint / Host Identification
    hostname: str = "unknown-host"
    device_id: str = "unknown-device"
    operating_system: str = "unknown-os"  # Linux, Windows, Darwin/macOS
    agent_version: str = "1.0.0"
    
    # Network 4-Tuple
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    
    # Security Context & Taxonomy
    username: Optional[str] = None
    event_type: str = "system"  # authentication, privilege, connection, process, audit, system
    action: str = "unknown"     # login, logout, sudo, exec, scan, connect, access
    status: str = "info"        # success, failure, denied, attempt, info, warning
    severity_hint: str = "LOW"  # LOW, MEDIUM, HIGH, CRITICAL, INFO
    
    # Payload & Raw Logs
    raw_message: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    # Optional Flag for Demo/Simulated Events
    is_simulated: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert SecurityEvent to a dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SecurityEvent':
        """Create SecurityEvent safely from dictionary."""
        valid_keys = cls.__dataclass_fields__.keys()
        filtered = {k: v for k, v in data.items() if k in valid_keys}
        if 'id' not in filtered or not filtered['id']:
            filtered['id'] = str(uuid.uuid4())
        if 'timestamp' not in filtered or not filtered['timestamp']:
            filtered['timestamp'] = utc_now_iso()
        if 'received_at' not in filtered or not filtered['received_at']:
            filtered['received_at'] = utc_now_iso()
        if 'metadata' not in filtered or filtered['metadata'] is None:
            filtered['metadata'] = {}
        return cls(**filtered)
