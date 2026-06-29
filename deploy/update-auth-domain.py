#!/usr/bin/env python3
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

    with sftp.open(CONFIG_PATH, "w") as f:
        f.write(data.encode("utf-8"))

    sftp.close()
    transport.close()
    print(f"EnterraAuth -> api-url/website-url: {SITE}")
    print("Restart MC server or /enterraauth reload if available")
    return 0


if __name__ == "__main__":
    sys.exit(main())
