#!/usr/bin/env python3
"""Diagnose shop / EasyDonate on production."""
import json
import os
import re
import sys

import paramiko

HOST = "193.222.62.4"
REMOTE_ENV = "/opt/enterra-site/.env"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    sftp = c.open_sftp()
    with sftp.open(REMOTE_ENV, "r") as f:
        env_text = f.read().decode("utf-8", errors="replace")
    sftp.close()

    env = {}
    for line in env_text.splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip()

    print("=== EasyDonate env (masked) ===")
    for key in sorted(k for k in env if k.startswith("EASYDONATE_")):
        val = env.get(key, "")
        if "KEY" in key or "SECRET" in key:
            shown = (val[:4] + "…" + val[-4:]) if len(val) > 8 else ("set" if val else "MISSING")
        else:
            shown = val or "MISSING"
        print(f"{key}={shown}")

    shop_key = env.get("EASYDONATE_SHOP_KEY", "")
    server_id = env.get("EASYDONATE_SERVER_ID", "")

    cmds = [
        "curl -sS http://127.0.0.1:3001/api/shop",
    ]
    if shop_key and server_id:
        cmds.append(
            "curl -sS -w '\\nHTTP_CODE:%{http_code} TYPE:%{content_type}\\n' "
            f"-H 'Shop-Key: {shop_key}' "
            f"'https://easydonate.ru/api/v3/shop/products?server_id={server_id}' | head -c 1500"
        )

    cmds.extend([
        "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 describe enterra-site 2>/dev/null | grep -E 'restarts|status|uptime|unstable'",
        "curl -sS -o /dev/null -w 'shop page HTTP %{http_code}\\n' https://enterra.tech/shop",
        "curl -sS https://enterra.tech/api/shop | python3 -c \"import sys,json; d=json.load(sys.stdin); print('public products', len(d.get('products',[])), 'enabled', d.get('easydonateEnabled'))\"",
        "grep -i easydonate /root/.pm2/logs/enterra-site-error-0.log | tail -5",
    ])

    for cmd in cmds:
        print("\n===", cmd[:100], "===")
        _, o, e = c.exec_command(cmd, timeout=60)
        out = (o.read() + e.read()).decode("utf-8", errors="replace")
        print(out.encode("ascii", "replace").decode())

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
