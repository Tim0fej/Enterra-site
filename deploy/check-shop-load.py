#!/usr/bin/env python3
"""Check /api/shop latency and asset consistency on production."""
import os
import re
import sys
import time
import urllib.request

import paramiko

HOST = "193.222.62.4"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    t0 = time.time()
    try:
        with urllib.request.urlopen("https://enterra.tech/api/shop", timeout=30) as resp:
            body = resp.read()
            print(f"public /api/shop: {resp.status} {len(body)} bytes in {time.time()-t0:.2f}s")
    except Exception as ex:
        print(f"public /api/shop FAILED after {time.time()-t0:.2f}s:", ex)

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    cmds = [
        "grep -oE 'assets/index-[^\"]+\\.(js|css)' /opt/enterra-site/dist/index.html",
        "for f in $(grep -oE 'assets/index-[^\"]+\\.(js|css)' /opt/enterra-site/dist/index.html); do "
        "test -f /opt/enterra-site/dist/$f && echo OK $f || echo MISSING $f; done",
        "time curl -sS -o /dev/null -w 'local shop api: %{http_code} %{time_total}s\\n' http://127.0.0.1:3001/api/shop",
    ]
    for cmd in cmds:
        print("\n---", cmd[:70], "---")
        _, o, e = c.exec_command(cmd, timeout=90)
        print((o.read() + e.read()).decode("utf-8", errors="replace").encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
