#!/usr/bin/env python3
"""Set EasyDonate verification MOTD in server.properties on Minerent."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
REMOTE = "server.properties"
MOTD = os.environ.get("EASYDONATE_MOTD", "2db513f586b8ff904209e4e522d5cf98")


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    with sftp.open(REMOTE, "r") as f:
        content = f.read().decode("utf-8", errors="replace")

    old_motd = None
    for line in content.splitlines():
        if line.startswith("motd="):
            old_motd = line.split("=", 1)[1]
            break

    new_content = re.sub(r"^motd=.*$", f"motd={MOTD}", content, flags=re.MULTILINE)
    if new_content == content:
        new_content = content.rstrip() + f"\nmotd={MOTD}\n"

    with sftp.open(REMOTE, "w") as f:
        f.write(new_content.encode("utf-8"))

    sftp.close()
    transport.close()

    print(f"OLD motd={old_motd!r}")
    print(f"NEW motd={MOTD}")
    print("Restart the Minecraft server in MineRent panel, then verify in EasyDonate.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
