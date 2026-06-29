#!/usr/bin/env python3
"""Ensure Violet-NameFormat config exists on MC server and EnterraAuth has name-color messages."""
import os
import re
import sys

import paramiko

HOST = "enterra.minerent.io"
PORT = 2050
USER = "tw1xty.a005b814"
PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")
VIOLET_CONFIG = "plugins/Violet-NameFormat/config.yml"
ENTERRA_CONFIG = "plugins/EnterraAuth/config.yml"

VIOLET_DEFAULT = """Nick-Max-Length: 16

Messages:
  Unknown-Command: "Unknown command!"
  Config-Reloaded: "Config reloaded!"
  Player-Only: "Only players can use this command!"
  Args-Missing: "Args missing"
  Help: "Help? NO"
  No-MainHand-Item: "No items on main hand"
  Max-Limit: "&4Nickname length exceeds max symbols value!"
  No-Player: "&4Unknown player!"
  New-Name: "You change nickname: {newName}"
  Set-Nick: "You change nickname {newName} for {player}"
  Set-Nick-Player-Msg: "Your nickname changed to {newName}"

Players:
"""

NAME_COLOR_LINES = (
    '  name-color-applied: "&aЦвет ника обновлён с сайта."\n'
    '  name-color-reset: "&7Цвет ника сброшен."\n'
)


def upsert_name_color_messages(data: str) -> str:
    data = re.sub(r'^[ \t]*name-color-applied:.*\n', '', data, flags=re.MULTILINE)
    data = re.sub(r'^[ \t]*name-color-reset:.*\n', '', data, flags=re.MULTILINE)

    if "name-color-applied:" in data:
        return data

    marker = '  sync-failed: "&cНе удалось синхронизировать статус. Проверь привилегию на сайте."'
    if marker in data:
        return data.replace(marker, marker + "\n" + NAME_COLOR_LINES.rstrip(), 1)

    match = re.search(r'^  sync-failed:.*$', data, flags=re.MULTILINE)
    if match:
        line = match.group(0)
        return data.replace(line, line + "\n" + NAME_COLOR_LINES.rstrip(), 1)

    return data


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    try:
        sftp.stat(VIOLET_CONFIG)
        print(f"OK: {VIOLET_CONFIG} exists")
    except OSError:
        print(f"Creating {VIOLET_CONFIG}")
        with sftp.open(VIOLET_CONFIG, "w") as f:
            f.write(VIOLET_DEFAULT.encode("utf-8"))

    data = sftp.open(ENTERRA_CONFIG).read().decode("utf-8")
    fixed = upsert_name_color_messages(data)
    if fixed != data:
        with sftp.open(ENTERRA_CONFIG, "w") as f:
            f.write(fixed.encode("utf-8"))
        print(f"Updated {ENTERRA_CONFIG} name-color messages")
    else:
        print(f"OK: {ENTERRA_CONFIG} already valid")

    sftp.close()
    transport.close()
    print("VIOLET_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
