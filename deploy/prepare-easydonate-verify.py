#!/usr/bin/env python3
"""Prepare MC server for EasyDonate MOTD verification."""
import re
import sys
from datetime import datetime

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = "SCCPm@W39sMjd.h"
MOTD = "2db513f586b8ff904209e4e522d5cf98"
REMOTE_PROPS = "server.properties"
REMOTE_MINIMOTD = "plugins/MiniMOTD/main.conf"
REMOTE_MINIMOTD_BAK = "plugins/MiniMOTD/main.conf.bak-easydonate"


def dedupe_motd(content: str, motd: str) -> str:
    lines = []
    motd_written = False
    for line in content.splitlines():
        if line.startswith("motd="):
            if not motd_written:
                lines.append(f"motd={motd}")
                motd_written = True
            continue
        lines.append(line)
    if not motd_written:
        lines.append(f"motd={motd}")
    return "\n".join(lines).rstrip() + "\n"


def disable_minimotd(content: str) -> str:
    if "motd-enabled=false" in content:
        return content
    return re.sub(r"^motd-enabled=true\s*$", "motd-enabled=false", content, flags=re.MULTILINE)


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    with sftp.open(REMOTE_PROPS, "r") as f:
        props = f.read().decode("utf-8", errors="replace")
    new_props = dedupe_motd(props, MOTD)
    with sftp.open(REMOTE_PROPS, "w") as f:
        f.write(new_props.encode("utf-8"))
    print("server.properties: single motd line set")

    with sftp.open(REMOTE_MINIMOTD, "r") as f:
        minimotd = f.read().decode("utf-8", errors="replace")

    try:
        sftp.stat(REMOTE_MINIMOTD_BAK)
    except OSError:
        with sftp.open(REMOTE_MINIMOTD_BAK, "w") as f:
            f.write(minimotd.encode("utf-8"))
        print(f"backup: {REMOTE_MINIMOTD_BAK}")

    new_minimotd = disable_minimotd(minimotd)
    with sftp.open(REMOTE_MINIMOTD, "w") as f:
        f.write(new_minimotd.encode("utf-8"))
    print("MiniMOTD: motd-enabled=false (vanilla motd from server.properties)")

    sftp.close()
    transport.close()

    print()
    print("NEXT: In MineRent panel START or RESTART the Minecraft server.")
    print("Then click Verify in EasyDonate.")
    print(f"Expected MOTD: {MOTD}")
    print(f"Prepared at: {datetime.now().isoformat(timespec='seconds')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
