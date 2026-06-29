#!/usr/bin/env python3
"""Verify production deploy state and shop health."""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

import paramiko

HOST = "193.222.62.4"


def fetch(url: str, timeout: float = 20) -> tuple[int, bytes, float]:
    t0 = time.time()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read()
        return resp.status, body, time.time() - t0


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    print("=== PUBLIC CHECKS ===")
    for url in [
        "https://enterra.tech/shop",
        "https://enterra.tech/api/shop",
        "https://enterra.tech/api/health",
    ]:
        try:
            status, body, elapsed = fetch(url)
            extra = ""
            if url.endswith("/api/shop"):
                data = json.loads(body.decode())
                extra = f" products={len(data.get('products', []))}"
            elif url.endswith("/shop"):
                m = re.search(r'assets/index-([^.]+)\.js', body.decode("utf-8", errors="replace"))
                extra = f" js={m.group(0) if m else 'MISSING'}"
            print(f"OK {url} -> {status} {len(body)}b {elapsed:.2f}s{extra}")
        except Exception as ex:
            print(f"FAIL {url} -> {ex}")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    cmds = [
        "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 status",
        "grep -oE 'assets/index-[^\"]+\\.(js|css)' /opt/enterra-site/dist/index.html",
        "ls -la /opt/enterra-site/dist/assets/index-*.js | tail -3",
        "head -5 /opt/enterra-site/server/routes/shop.ts",
        "grep -n 'getCachedEasyDonateProducts\\|loadShopProducts' /opt/enterra-site/server/routes/shop.ts || true",
        "test -f /var/lib/enterra/data/easydonate-products.json && wc -c /var/lib/enterra/data/easydonate-products.json || echo NO_CACHE",
        "curl -sS -w '\\nHTTP:%{http_code} time:%{time_total}s\\n' http://127.0.0.1:3001/api/shop | tail -c 200",
        "tail -15 /root/.pm2/logs/enterra-site-error-0.log",
    ]
    for cmd in cmds:
        print("\n---", cmd[:70], "---")
        _, o, e = c.exec_command(cmd, timeout=90)
        out = (o.read() + e.read()).decode("utf-8", errors="replace")
        print(out.encode("ascii", "replace").decode()[:3000])

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
