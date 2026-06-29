#!/usr/bin/env python3
"""Restore MiniMOTD after EasyDonate verification."""
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"
REMOTE_MINIMOTD = "plugins/MiniMOTD/main.conf"
REMOTE_MINIMOTD_BAK = "plugins/MiniMOTD/main.conf.bak-easydonate"
REMOTE_PROPS = "server.properties"


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    with sftp.open(REMOTE_MINIMOTD_BAK, "r") as f:
        backup = f.read()
    with sftp.open(REMOTE_MINIMOTD, "w") as f:
        f.write(backup)
    print("MiniMOTD restored from backup")

    with sftp.open(REMOTE_PROPS, "r") as f:
        props = f.read().decode("utf-8", errors="replace")
    lines = []
    motd_set = False
    for line in props.splitlines():
        if line.startswith("motd="):
            if not motd_set:
                lines.append("motd=Enterra")
                motd_set = True
            continue
        lines.append(line)
    if not motd_set:
        lines.append("motd=Enterra")
    with sftp.open(REMOTE_PROPS, "w") as f:
        f.write(("\n".join(lines).rstrip() + "\n").encode("utf-8"))
    print("server.properties motd=Enterra")

    sftp.close()
    transport.close()
    print("Restart MC server in MineRent to show Enterra MOTD again.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
