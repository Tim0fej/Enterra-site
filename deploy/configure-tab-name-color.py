#!/usr/bin/env python3
"""Patch TAB groups.yml to use %enterra_colored_name% in tab list."""
import os
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
GROUPS_CONFIG = "plugins/TAB/groups.yml"

OLD = "%javascript_world%%player%"
NEW = "%javascript_world%%enterra_colored_name%"


def patch_groups(data: str) -> str:
    if "%enterra_colored_name%" in data:
        return data
    return data.replace(OLD, NEW)


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    try:
        raw = sftp.open(GROUPS_CONFIG).read().decode("utf-8")
    except OSError as error:
        print(f"Cannot read {GROUPS_CONFIG}: {error}", file=sys.stderr)
        return 1

    patched = patch_groups(raw)
    if patched == raw:
        print(f"OK: {GROUPS_CONFIG} already uses %enterra_colored_name%")
    else:
        with sftp.open(GROUPS_CONFIG, "w") as handle:
            handle.write(patched.encode("utf-8"))
        print(f"Updated {GROUPS_CONFIG}: customtabname uses %enterra_colored_name%")

    sftp.close()
    transport.close()
    print("TAB_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
