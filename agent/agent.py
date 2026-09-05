"""
Aegis Endpoint Security Monitoring Agent
Collects local OS security telemetry, normalizes events, registers host, and transmits batches to SIEM server.
"""

import os
import sys
import time
import socket
import platform
import uuid
import signal
import json
from typing import Dict, Any, Optional

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.collectors.linux import LinuxCollector
from agent.collectors.windows import WindowsCollector
from agent.collectors.macos import MacOSCollector
from agent.collectors.base import BaseCollector
from agent.transport import AgentTransport


def get_machine_device_id() -> str:
    """Generate or retrieve persistent deterministic device UUID."""
    id_file = os.path.expanduser("~/.aegis_device_id")
    if os.path.exists(id_file):
        try:
            with open(id_file, "r") as f:
                saved = f.read().strip()
                if saved:
                    return saved
        except Exception:
            pass

    new_id = f"dev-{uuid.uuid4().hex[:12]}"
    try:
        with open(id_file, "w") as f:
            f.write(new_id)
    except Exception:
        pass
    return new_id


class EndpointAgent:
    def __init__(self, config_path: Optional[str] = None):
        self.running = True
        self.config = self._load_config(config_path)
        
        self.hostname = socket.gethostname()
        self.os_type = platform.system()
        self.os_release = f"{self.os_type} {platform.release()}"
        self.device_id = get_machine_device_id()
        self.agent_version = "1.0.0"

        self.transport = AgentTransport(
            server_url=self.config.get("server_url", "http://127.0.0.1:8000"),
            auth_token=self.config.get("auth_token")
        )

        self.collector: BaseCollector = self._init_collector()
        self.last_heartbeat = 0.0

    def _load_config(self, path: Optional[str]) -> Dict[str, Any]:
        default_path = os.path.join(os.path.dirname(__file__), "config.json")
        target = path or default_path
        if os.path.exists(target):
            try:
                with open(target, "r") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "server_url": "http://127.0.0.1:8000",
            "poll_interval_seconds": 3,
            "heartbeat_interval_seconds": 30,
            "batch_size": 50
        }

    def _init_collector(self) -> BaseCollector:
        if self.os_type == "Linux":
            return LinuxCollector(
                hostname=self.hostname,
                device_id=self.device_id,
                operating_system=self.os_release,
                agent_version=self.agent_version,
                log_paths=self.config.get("monitored_logs")
            )
        elif self.os_type == "Windows":
            return WindowsCollector(
                hostname=self.hostname,
                device_id=self.device_id,
                operating_system=self.os_release,
                agent_version=self.agent_version
            )
        else:
            return MacOSCollector(
                hostname=self.hostname,
                device_id=self.device_id,
                operating_system=self.os_release,
                agent_version=self.agent_version
            )

    def register(self):
        """Self-register endpoint with SIEM server."""
        info = {
            "device_id": self.device_id,
            "hostname": self.hostname,
            "operating_system": self.os_release,
            "agent_version": self.agent_version,
            "status": "ONLINE"
        }
        success = self.transport.register_device(info)
        if success:
            print(f"[+] Agent successfully registered with SIEM as '{self.device_id}' ({self.hostname})")
        else:
            print(f"[!] Warning: Initial registration with SIEM server at {self.transport.server_url} failed (will retry)")

    def run(self):
        """Main agent loop."""
        print(f"[*] Starting Aegis Endpoint Security Agent v{self.agent_version}")
        print(f"[*] Host: {self.hostname} | OS: {self.os_release} | Device ID: {self.device_id}")

        self.register()
        poll_interval = self.config.get("poll_interval_seconds", 3)
        hb_interval = self.config.get("heartbeat_interval_seconds", 30)

        while self.running:
            try:
                now = time.time()
                # 1. Periodic Heartbeat
                if now - self.last_heartbeat > hb_interval:
                    self.transport.register_device({
                        "device_id": self.device_id,
                        "hostname": self.hostname,
                        "operating_system": self.os_release,
                        "agent_version": self.agent_version,
                        "status": "ONLINE"
                    })
                    self.last_heartbeat = now

                # 2. Collect local security events
                events = self.collector.collect()
                if events:
                    print(f"[*] Collected {len(events)} security events from local logs. Sending...")
                    self.transport.send_events_batch(events)

                time.sleep(poll_interval)
            except Exception as e:
                time.sleep(poll_interval)

    def stop(self):
        self.running = False
        print("[!] Stopping Aegis Endpoint Security Agent...")


def handle_sig(sig, frame):
    if agent_instance:
        agent_instance.stop()
    sys.exit(0)


agent_instance: Optional[EndpointAgent] = None

if __name__ == "__main__":
    signal.signal(signal.SIGINT, handle_sig)
    signal.signal(signal.SIGTERM, handle_sig)
    agent_instance = EndpointAgent()
    agent_instance.run()
