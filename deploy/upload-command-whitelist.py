#!/usr/bin/env python3
"""Upload CommandWhitelist config to MC server."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "command-whitelist-config.yml"
REMOTE = "plugins/CommandWhitelist/config.yml"

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")


def main() -> int:
    if not CONFIG.is_file():
        print(f"Missing {CONFIG}", file=sys.stderr)
        return 1

    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)
    sftp.put(str(CONFIG), REMOTE)
    sftp.close()
    transport.close()
    print(f"Uploaded -> {REMOTE}")
    print("Run /commandwhitelist reload on the server or restart MC.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
