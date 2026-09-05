"""
Aegis Mini-SIEM Core Server Main Entry Point
"""

import sys
import os
import argparse

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.api.server import run_siem_server
from server.database.db import Database
from server.services.detection import DetectionEngine


def main():
    parser = argparse.ArgumentParser(description="Aegis Mini-SIEM / IDS Core Server")
    parser.add_argument("--host", default=os.environ.get("SIEM_HOST", "0.0.0.0"), help="Bind host")
    parser.add_argument("--port", type=int, default=int(os.environ.get("SIEM_PORT", "8000")), help="Bind port")
    args = parser.parse_args()

    # Pre-initialize DB and detection engine
    Database.get_instance()
    DetectionEngine.get_instance()

    server = run_siem_server(host=args.host, port=args.port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[!] SIEM Server shutting down gracefully...")
        server.server_close()


if __name__ == "__main__":
    main()
