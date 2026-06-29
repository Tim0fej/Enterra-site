#!/usr/bin/env python3
"""Restore enterra.tech nginx + HTTPS after a bad deploy."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent
HOST = "193.222.62.4"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")
EMAIL = "romazaytsev917@gmail.com"


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

    script = f"""set -e
export DEBIAN_FRONTEND=noninteractive
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null 2>&1 || true

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

sed -i 's|^SITE_URL=.*|SITE_URL=https://enterra.tech|' /opt/enterra-site/.env
grep -q '^TRUST_PROXY=' /opt/enterra-site/.env || echo 'TRUST_PROXY=true' >> /opt/enterra-site/.env

if [ -d /etc/letsencrypt/live/enterra.tech ]; then
  certbot --nginx -d enterra.tech -d www.enterra.tech --non-interactive --agree-tos -m {EMAIL} --redirect
else
  certbot --nginx -d enterra.tech -d www.enterra.tech --non-interactive --agree-tos -m {EMAIL} --redirect
fi

nginx -t
systemctl reload nginx

export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env 2>/dev/null || true

sleep 2
echo "=== ports ==="
ss -tlnp | grep -E ':80|:443|:3001' || true
echo "=== https ==="
curl -sf https://enterra.tech/api/health || echo FAIL
echo
echo "=== http root ==="
curl -sfI https://enterra.tech/ | head -5 || true
echo REPAIR_OK
"""

    _, stdout, _ = client.exec_command(script, timeout=300, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "REPAIR_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
