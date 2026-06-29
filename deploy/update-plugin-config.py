#!/usr/bin/env python3
"""Append pending-auth block to EnterraAuth config if missing."""
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

PENDING_AUTH_BLOCK = """
pending-auth:
  blindness: true
  invulnerable: true
  no-hunger: true
  boss-bar: true
  title-hint: true
  timeout-seconds: 45
  reminder-interval-seconds: 8
"""

SESSION_CHECK_BLOCK = """
session-check:
  enabled: true
  interval-seconds: 10
"""

NEED_CODE_BOX = """need-code-box: |
    &8&m━━━━━━━━━━&r &b&lEnterra &8· &7Авторизация &8&m━━━━━━━━━━
    &7Код лежит в профиле на сайте:
    &b%website%/profile
    &8»
    &f/code &7<твой_код>
    &7На ввод: &c%seconds% сек
    &8&m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

COMMAND_BLOCKED = 'command-blocked: "&cСначала подтверди вход: &f/code &7<код из профиля>"'
CODE_TIMEOUT = 'code-timeout: "&cВремя вышло (%seconds% сек). Зайди снова и введи /code."'
CODE_RESET_KICK = 'code-reset-kick: "&cКод доступа обновлён на сайте.\\n&7Зайди снова и введи &f/code &7с новым кодом из профиля."'
CODE_SUCCESS = 'code-success: "&a&l✓ &aКод принят! &7Приятной игры на Enterra."'
MULTI_ACCOUNT_BLOCKED = """multi-account-blocked: |
    &cМультиаккаунт запрещён.
    &7С этого IP уже есть аккаунт на Enterra.
    &7Один аккаунт на человека — правило сервера."""
MULTI_ACCOUNT_ONLINE = """multi-account-online: |
    &cС этого IP уже играет другой аккаунт.
    &7Выйди с него или напиши в поддержку на сайте."""
MAINTENANCE_BLOCKED_DEFAULT = 'maintenance-blocked-default: "Технические работы. Сервер временно недоступен."'
MAINTENANCE_BLOCKED = """maintenance-blocked: |
    &c%message%
    &7Следи за новостями на сайте."""

STAFF_PROTECTION_BLOCK = """
staff-protection:
  enabled: true
  allow-bypass-punish: false
  groups:
    - admin
    - dev
    - moder
  site-roles:
    - admin
    - moderator
  moderation-commands:
    - ban
    - tempban
    - ipban
    - kick
    - mute
    - tempmute
    - warn
    - punish
"""

STAFF_PROTECTION_MESSAGE = """  staff-protection:
    blocked: "&cЭтого игрока нельзя кикнуть, забанить или замутить — он staff."
    reverted: "&cЭтого игрока нельзя кикнуть, забанить или замутить — он staff. &7Наказание отменено."
"""


def upsert_line(data: str, key: str, line: str) -> str:
    pattern = rf"^{re.escape(key)}:.*(?:\n(?:  .+|\|.*|\s+\S.*))*"
    if re.search(pattern, data, flags=re.MULTILINE):
        return re.sub(pattern, line.rstrip(), data, count=1, flags=re.MULTILINE)
    if "messages:" in data:
        return data.replace("messages:", "messages:\n  " + line.strip(), 1)
    return data.rstrip() + "\n\nmessages:\n  " + line.strip() + "\n"


def main() -> int:
    transport = paramiko.Transport((HOST, PORT))
    transport.connect(username=USER, password=PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)

    data = sftp.open(CONFIG_PATH).read().decode("utf-8")
    data = re.sub(r'api-url:\s*"[^"]*"', f'api-url: "{SITE}"', data)
    data = re.sub(r'website-url:\s*"[^"]*"', f'website-url: "{SITE}"', data)

    if "pending-auth:" not in data:
        if "messages:" in data:
            data = data.replace("messages:", PENDING_AUTH_BLOCK + "\nmessages:", 1)
        else:
            data = data.rstrip() + "\n" + PENDING_AUTH_BLOCK

    if "timeout-seconds:" not in data:
        data = data.replace(
            "reminder-interval-seconds: 8",
            "timeout-seconds: 45\n  reminder-interval-seconds: 8",
            1,
        )

    if "session-check:" not in data:
        if "pending-auth:" in data:
            data = data.replace("pending-auth:", SESSION_CHECK_BLOCK + "\npending-auth:", 1)
        else:
            data = data.rstrip() + "\n" + SESSION_CHECK_BLOCK

    if "need-code-box:" not in data:
        data = upsert_line(data, "need-code-box", NEED_CODE_BOX)
    if "command-blocked:" not in data:
        data = upsert_line(data, "command-blocked", COMMAND_BLOCKED)
    if "code-timeout:" not in data:
        data = upsert_line(data, "code-timeout", CODE_TIMEOUT)
    if "code-reset-kick:" not in data:
        data = upsert_line(data, "code-reset-kick", CODE_RESET_KICK)
    if "code-success:" in data:
        data = re.sub(r'^  code-success:.*$', "  " + CODE_SUCCESS, data, flags=re.MULTILINE)
    if "multi-account-blocked:" not in data:
        data = upsert_line(data, "multi-account-blocked", MULTI_ACCOUNT_BLOCKED)
    if "multi-account-online:" not in data:
        data = upsert_line(data, "multi-account-online", MULTI_ACCOUNT_ONLINE)
    if "maintenance-blocked-default:" not in data:
        data = upsert_line(data, "maintenance-blocked-default", MAINTENANCE_BLOCKED_DEFAULT)
    if "maintenance-blocked:" not in data:
        data = upsert_line(data, "maintenance-blocked", MAINTENANCE_BLOCKED)

    if "staff-protection:" not in data:
        if "session-check:" in data:
            data = data.replace("session-check:", STAFF_PROTECTION_BLOCK + "\nsession-check:", 1)
        elif "pending-auth:" in data:
            data = data.replace("pending-auth:", STAFF_PROTECTION_BLOCK + "\npending-auth:", 1)
        else:
            data = data.rstrip() + "\n" + STAFF_PROTECTION_BLOCK

    if "staff-protection:\n    blocked:" not in data and "  staff-protection:" not in data:
        if "messages:" in data:
            data = data.replace("messages:", "messages:\n" + STAFF_PROTECTION_MESSAGE, 1)

    with sftp.open(CONFIG_PATH, "w") as f:
        f.write(data.encode("utf-8"))

    sftp.close()
    transport.close()
    print(f"Updated {CONFIG_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
