"""
Device / Endpoint Registration Model
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional, Dict, Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Device:
    device_id: str
    hostname: str
    operating_system: str
    agent_version: str = "1.0.0"
    ip_address: Optional[str] = None
    mac_address: Optional[str] = None
    first_seen: str = field(default_factory=utc_now_iso)
    last_seen: str = field(default_factory=utc_now_iso)
    status: str = "ONLINE"  # ONLINE, OFFLINE, UNKNOWN
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Device':
        valid_keys = cls.__dataclass_fields__.keys()
        filtered = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered)
