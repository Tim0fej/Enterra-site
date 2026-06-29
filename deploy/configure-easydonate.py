#!/usr/bin/env python3
"""Configure EasyDonate env vars on production."""
import os
import sys

import paramiko

HOST = "193.222.62.4"
REMOTE_ENV = "/opt/enterra-site/.env"

# Заполните перед запуском или передайте через окружение:
SHOP_KEY = os.environ.get("EASYDONATE_SHOP_KEY", "").strip()
SERVER_ID = os.environ.get("EASYDONATE_SERVER_ID", "").strip()
SHOP_URL = os.environ.get("EASYDONATE_SHOP_URL", "").strip()
PRODUCT_1 = os.environ.get("EASYDONATE_VIP_PRODUCT_1", "1098490").strip()
PRODUCT_3 = os.environ.get("EASYDONATE_VIP_PRODUCT_3", "1098491").strip()
PRODUCT_6 = os.environ.get("EASYDONATE_VIP_PRODUCT_6", "1098492").strip()
SHOP_URL = os.environ.get("EASYDONATE_SHOP_URL", "https://enterra.easydonate.ru").strip()


def upsert_env_line(content: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    lines = content.splitlines()
    found = False
    out = []
    for row in lines:
        if row.startswith(f"{key}="):
            out.append(line)
            found = True
        else:
            out.append(row)
    if not found:
        out.append(line)
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    if not os.environ.get("DEPLOY_PASSWORD"):
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1
    if not SHOP_KEY or not SERVER_ID or not PRODUCT_1:
        print(
            "Set EASYDONATE_SHOP_KEY, EASYDONATE_SERVER_ID, EASYDONATE_VIP_PRODUCT_1 "
            "(and optionally PRODUCT_3, PRODUCT_6, EASYDONATE_SHOP_URL)",
            file=sys.stderr,
        )
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()
    with sftp.open(REMOTE_ENV, "r") as f:
        content = f.read().decode("utf-8", errors="replace")

    content = upsert_env_line(content, "EASYDONATE_ENABLED", "true")
    content = upsert_env_line(content, "EASYDONATE_SHOP_KEY", SHOP_KEY)
    content = upsert_env_line(content, "EASYDONATE_SERVER_ID", SERVER_ID)
    if SHOP_URL:
        content = upsert_env_line(content, "EASYDONATE_SHOP_URL", SHOP_URL)
    content = upsert_env_line(content, "EASYDONATE_VIP_PRODUCT_1", PRODUCT_1)
    if PRODUCT_3:
        content = upsert_env_line(content, "EASYDONATE_VIP_PRODUCT_3", PRODUCT_3)
    if PRODUCT_6:
        content = upsert_env_line(content, "EASYDONATE_VIP_PRODUCT_6", PRODUCT_6)
    webhook = "https://enterra.tech/api/support/easydonate/webhook"
    content = upsert_env_line(content, "EASYDONATE_CALLBACK_HINT", webhook)

    with sftp.open(REMOTE_ENV, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site && pm2 restart enterra-site --update-env && "
        "sleep 3 && curl -sf https://enterra.tech/api/support | head -c 400",
        timeout=90,
    )
    print(o.read().decode("utf-8", errors="replace"))
    print("Configure EasyDonate callback URL in cp.easydonate.ru:")
    print(webhook)
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
