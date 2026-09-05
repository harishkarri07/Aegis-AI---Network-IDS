"""
Correlated Security Incident Model
Represents multi-stage attack progressions or related clusters of alerts.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import uuid


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Incident:
    incident_id: str = field(default_factory=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}")
    title: str = "Correlated Attack Progression"
    summary: str = ""
    severity: str = "HIGH"    # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: int = 75      # 0 to 100
    
    hostname: str = "unknown"
    device_id: str = "unknown"
    source_ip: Optional[str] = None
    username: Optional[str] = None
    
    stages: List[str] = field(default_factory=list)
    alert_ids: List[str] = field(default_factory=list)
    event_ids: List[str] = field(default_factory=list)
    
    first_seen: str = field(default_factory=utc_now_iso)
    last_seen: str = field(default_factory=utc_now_iso)
    status: str = "OPEN"      # OPEN, INVESTIGATING, RESOLVED
    
    recommendation: str = "Isolate host, terminate rogue sessions, and reset compromised credentials."
    mitre_attack_chain: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Incident':
        valid_keys = cls.__dataclass_fields__.keys()
        filtered = {k: v for k, v in data.items() if k in valid_keys}
        return cls(**filtered)
