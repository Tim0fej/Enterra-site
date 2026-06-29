#!/usr/bin/env python3
"""Configure SAutoRestart: daily restart at 00:00 MSK on Minerent MC server."""
import os
import sys
from pathlib import Path

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
REMOTE_CONFIG = "plugins/SAutoRestart/config.yml"
LOCAL_CONFIG = Path(__file__).resolve().parent / "_sautorestart_config.yml"


def main() -> int:
    if not LOCAL_CONFIG.is_file():
        print(f"Missing template: {LOCAL_CONFIG}", file=sys.stderr)
        return 1

    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    sftp.put(str(LOCAL_CONFIG), REMOTE_CONFIG)
    sftp.close()
    transport.close()

    print("SAutoRestart configured: daily restart at 00:00 MSK")
    print("Run /autorestart reload on the server or restart MC to apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
