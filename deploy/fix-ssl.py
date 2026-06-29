#!/usr/bin/env python3
"""Fix nginx SSL: remove duplicate www block without certificates."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent
HOST = "193.222.62.4"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")


def main() -> int:
    if not PASSWORD:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=PASSWORD, timeout=30)

    sftp = client.open_sftp()
    sftp.put(str(ROOT / "enterra.tech.nginx"), "/etc/nginx/sites-available/enterra")
    sftp.close()

    script = """set -e
ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=== cert files ==="
ls -la /etc/letsencrypt/live/enterra.tech/ 2>&1 || true

echo "=== openssl enterra.tech ==="
echo | openssl s_client -connect 127.0.0.1:443 -servername enterra.tech 2>/dev/null | openssl x509 -noout -subject -dates 2>&1 || true

echo "=== openssl www.enterra.tech ==="
echo | openssl s_client -connect 127.0.0.1:443 -servername www.enterra.tech 2>/dev/null | openssl x509 -noout -subject -dates 2>&1 || true

echo "=== curl https ==="
curl -sfI https://enterra.tech/api/health | head -5
curl -sfI https://www.enterra.tech/ | head -5

echo SSL_FIX_OK
"""

    _, stdout, stderr = client.exec_command(script, timeout=120, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err.strip():
        print(err.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "SSL_FIX_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
