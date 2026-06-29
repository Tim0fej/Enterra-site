#!/usr/bin/env python3
"""Apply DDoS rate limits in nginx (conf.d zones + site config)."""
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
    sftp.put(str(ROOT / "nginx-http-limits.conf"), "/etc/nginx/conf.d/enterra-limits.conf")
    sftp.put(str(ROOT / "enterra.tech.nginx"), "/etc/nginx/sites-available/enterra")
    sftp.close()

    script = """set -e

# Debian/Ubuntu: conf.d is usually included from nginx.conf
if ! grep -q 'conf.d/\\*.conf' /etc/nginx/nginx.conf 2>/dev/null; then
  echo "WARN: /etc/nginx/nginx.conf may not include conf.d/*.conf"
fi

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default

echo "=== nginx -t ==="
nginx -t

echo "=== reload nginx ==="
systemctl reload nginx
systemctl is-active nginx

echo "=== limits file ==="
head -5 /etc/nginx/conf.d/enterra-limits.conf

echo "=== health (local) ==="
curl -sf --max-time 5 -H 'Host: enterra.tech' http://127.0.0.1/api/health
echo

echo "=== health (https) ==="
curl -sfI --max-time 10 https://enterra.tech/api/health | head -6

echo NGINX_LIMITS_OK
"""

    _, stdout, stderr = client.exec_command(script, timeout=120, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err.strip():
        print(err.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "NGINX_LIMITS_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
