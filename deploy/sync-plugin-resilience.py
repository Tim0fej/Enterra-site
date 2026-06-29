#!/usr/bin/env python3
"""Sync EnterraAuth api-url + slower polling intervals after resilience update."""
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


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    data = sftp.open(CONFIG_PATH).read().decode("utf-8")
    data = re.sub(r'api-url:\s*"[^"]*"', f'api-url: "{SITE}"', data)
    data = re.sub(r'website-url:\s*"[^"]*"', f'website-url: "{SITE}"', data)

    if re.search(r"^\s*interval-seconds:\s*\d+", data, flags=re.MULTILINE):
        data = re.sub(
            r"(session-check:\s*\n(?:\s+.+\n)*?\s*interval-seconds:\s*)\d+",
            r"\g<1>30",
            data,
            count=1,
        )
        data = re.sub(
            r"(auto-sync:\s*\n(?:\s+.+\n)*?\s*interval-seconds:\s*)\d+",
            r"\g<1>45",
            data,
            count=1,
        )
    else:
        print("Warning: interval-seconds blocks not found", file=sys.stderr)

    with sftp.open(CONFIG_PATH, "w") as f:
        f.write(data.encode("utf-8"))

    sftp.close()
    transport.close()
    print(f"Updated {CONFIG_PATH} (api-url, session-check=30s, auto-sync=45s)")
    print("Restart MC server in Minerent panel to load EnterraAuth-2.5.5.jar")
    return 0


if __name__ == "__main__":
    sys.exit(main())
