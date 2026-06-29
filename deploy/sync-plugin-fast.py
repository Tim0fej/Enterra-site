#!/usr/bin/env python3
"""Sync EnterraAuth api-url + faster site sync intervals."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
CONFIG_PATH = "plugins/EnterraAuth/config.yml"
SITE = "https://enterra.tech"


def patch_interval(block_name: str, value: int, data: str) -> str:
    return re.sub(
        rf"({re.escape(block_name)}:\s*\n(?:\s+.+\n)*?\s*interval-seconds:\s*)\d+",
        rf"\g<1>{value}",
        data,
        count=1,
    )


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    data = sftp.open(CONFIG_PATH).read().decode("utf-8")
    data = re.sub(r'api-url:\s*"[^"]*"', f'api-url: "{SITE}"', data)
    data = re.sub(r'website-url:\s*"[^"]*"', f'website-url: "{SITE}"', data)

    data = patch_interval("session-check", 15, data)
    data = patch_interval("auto-sync", 20, data)
    data = re.sub(
        r"(moderation-sync:\s*\n(?:\s+.+\n)*?\s*punishments-interval-seconds:\s*)\d+",
        r"\g<1>25",
        data,
        count=1,
    )

    with sftp.open(CONFIG_PATH, "w") as f:
        f.write(data.encode("utf-8"))

    sftp.close()
    transport.close()
    print(f"Updated {CONFIG_PATH} (session-check=15s, auto-sync=20s, punishments=25s)")
    print("Restart MC server in Minerent panel to apply plugin jar if updated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
