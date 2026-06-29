#!/usr/bin/env python3
"""Fetch EasyDonate shop info (callback field) from production env."""
import json
import os
import re
import sys
import urllib.request

import paramiko

HOST = "193.222.62.4"
REMOTE_ENV = "/opt/enterra-site/.env"


def load_shop_key() -> str:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    _, o, _ = c.exec_command(f"grep '^EASYDONATE_SHOP_KEY=' {REMOTE_ENV}", timeout=30)
    line = o.read().decode().strip()
    c.close()
    if not line or "=" not in line:
        raise RuntimeError("EASYDONATE_SHOP_KEY not found")
    return line.split("=", 1)[1].strip()


def main() -> int:
    if not os.environ.get("DEPLOY_PASSWORD"):
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1
    key = load_shop_key()
    req = urllib.request.Request(
        "https://easydonate.ru/api/v3/shop",
        headers={"Shop-Key": key},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode())
    shop = data.get("response", {})
    print(json.dumps(shop, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
