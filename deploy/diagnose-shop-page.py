#!/usr/bin/env python3
"""Deep shop page diagnostics on production."""
import json
import os
import sys
import urllib.request

import paramiko

HOST = "193.222.62.4"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    print("=== public HTML/JS ===")
    html = urllib.request.urlopen("https://enterra.tech/shop", timeout=30).read().decode("utf-8", errors="replace")
    for line in html.splitlines():
        if "assets/index-" in line:
            print(line.strip())
    import re
    js_match = re.search(r'src="(/assets/index-[^"]+\.js)"', html)
    if js_match:
        js_url = "https://enterra.tech" + js_match.group(1)
        js = urllib.request.urlopen(js_url, timeout=30)
        print(f"JS bundle: {js_url} -> {js.status} {js.headers.get('Content-Length')} bytes")

    print("\n=== headers /api/shop ===")
    req = urllib.request.Request("https://enterra.tech/api/shop", headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        print("status", resp.status)
        for k in ("content-type", "content-security-policy", "cache-control"):
            if resp.headers.get(k):
                print(f"{k}: {resp.headers.get(k)[:120]}")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    cmds = [
        "tail -30 /root/.pm2/logs/enterra-site-error-0.log",
        "grep -c '/api/shop' /root/.pm2/logs/enterra-site-out-0.log 2>/dev/null || true",
        "curl -sS -H 'User-Agent: Mozilla/5.0' -H 'Accept: application/json' http://127.0.0.1:3001/api/shop | python3 -c \"import sys,json; d=json.load(sys.stdin); print('products', len(d.get('products',[])), 'enabled', d.get('easydonateEnabled'))\"",
        "ls -la /opt/enterra-site/dist/assets/index-*.js | tail -5",
    ]
    for cmd in cmds:
        print("\n---", cmd[:72], "---")
        _, o, e = c.exec_command(cmd, timeout=60)
        print((o.read() + e.read()).decode("utf-8", errors="replace").encode("ascii", "replace").decode()[:2500])

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
