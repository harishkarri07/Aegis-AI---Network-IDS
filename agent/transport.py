"""
Reliable Transport Layer for Endpoint Agent
Handles secure batching, retries with exponential backoff, headers/tokens, and timeout handling.
"""

import json
import urllib.request
import urllib.error
import time
from typing import List, Dict, Any, Optional
from server.models.event import SecurityEvent


class AgentTransport:
    def __init__(
        self,
        server_url: str = "http://127.0.0.1:8000",
        auth_token: Optional[str] = None,
        max_retries: int = 4,
        base_backoff_sec: float = 1.0,
        timeout_sec: float = 5.0
    ):
        self.server_url = server_url.rstrip("/")
        self.auth_token = auth_token
        self.max_retries = max_retries
        self.base_backoff_sec = base_backoff_sec
        self.timeout_sec = timeout_sec

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Aegis-Endpoint-Agent/1.0.0"
        }
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            headers["X-Agent-Token"] = self.auth_token
        return headers

    def register_device(self, device_info: Dict[str, Any]) -> bool:
        """Register or heartbeat device status with SIEM server."""
        url = f"{self.server_url}/api/v1/register"
        data = json.dumps(device_info).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=self._get_headers(), method="POST")

        try:
            with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                return resp.status in (200, 201)
        except Exception:
            return False

    def send_events_batch(self, events: List[SecurityEvent]) -> bool:
        """
        Send a batch of normalized SecurityEvents to SIEM server with retry & exponential backoff.
        """
        if not events:
            return True

        url = f"{self.server_url}/api/v1/events/batch"
        payload = {"events": [e.to_dict() for e in events]}
        data = json.dumps(payload).encode("utf-8")

        for attempt in range(self.max_retries):
            try:
                req = urllib.request.Request(url, data=data, headers=self._get_headers(), method="POST")
                with urllib.request.urlopen(req, timeout=self.timeout_sec) as resp:
                    if resp.status in (200, 201):
                        return True
            except Exception as e:
                backoff = self.base_backoff_sec * (2 ** attempt)
                if attempt < self.max_retries - 1:
                    time.sleep(backoff)
                else:
                    return False

        return False
