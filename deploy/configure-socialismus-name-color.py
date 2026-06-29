#!/usr/bin/env python3
"""Patch Socialismus chat formats to use MiniMessage placeholder for colored nicknames."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
CHATS_CONFIG = "plugins/Socialismus/chats/chats-default.yml"

DISPLAY_PATTERN = re.compile(r"(?<![:/]){playerName}")


def patch_formats(data: str) -> str:
    updated = data.replace("%enterra_colored_name%", "%enterra_colored_name_mm%")
    if "%enterra_colored_name_mm%" in updated:
        return updated
    return DISPLAY_PATTERN.sub("%enterra_colored_name_mm%", updated)


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    try:
        raw = sftp.open(CHATS_CONFIG).read().decode("utf-8")
    except OSError as error:
        print(f"Cannot read {CHATS_CONFIG}: {error}", file=sys.stderr)
        return 1

    patched = patch_formats(raw)
    if patched == raw:
        print(f"OK: {CHATS_CONFIG} already uses %enterra_colored_name_mm%")
    else:
        with sftp.open(CHATS_CONFIG, "w") as handle:
            handle.write(patched.encode("utf-8"))
        print(f"Updated {CHATS_CONFIG} -> %enterra_colored_name_mm%")

    sftp.close()
    transport.close()
    print("SOCIALISMUS_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
