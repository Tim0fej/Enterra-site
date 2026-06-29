#!/usr/bin/env python3
"""Fetch production facts for site content sync."""
import json
import os
import re
import sys

import paramiko

HOST = "193.222.62.4"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    cmds = [
        "grep -E '^(SITE_URL|MC_HOST|MC_PORT|SERVER_MONTHLY_COST|EASYDONATE_)' /opt/enterra-site/.env | sed 's/SHOP_KEY=.*/SHOP_KEY=***/'",
        "curl -sf http://127.0.0.1:3001/api/health && echo",
        "curl -sf http://127.0.0.1:3001/api/players/status 2>/dev/null || curl -sf http://127.0.0.1:3001/api/minecraft/status 2>/dev/null || true",
        "python3 -c \"import json; d=json.load(open('/var/lib/enterra/data/easydonate-products.json')); print('products', len(d.get('products',[]))); [print(p.get('id'), p.get('name'), p.get('price')) for p in d.get('products',[])]\" 2>/dev/null || true",
    ]
    for cmd in cmds:
        print("\n---", cmd[:70], "---")
        _, o, e = c.exec_command(cmd, timeout=60)
        print((o.read() + e.read()).decode("utf-8", errors="replace").encode("ascii", "replace").decode())

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
