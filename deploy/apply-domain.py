#!/usr/bin/env python3
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent
HOST = "193.222.62.4"
DOMAIN = os.environ.get("DOMAIN", "enterra.tech")
EMAIL = os.environ.get("CERTBOT_EMAIL", "romazaytsev917@gmail.com")
PASSWORD = os.environ.get("DEPLOY_PASSWORD")


def run(client: paramiko.SSHClient, script: str, timeout: int = 300) -> tuple[str, int]:
    _, stdout, _ = client.exec_command(script, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    return out, code


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

    out, code = run(
        client,
        """set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

sed -i 's|^SITE_URL=.*|SITE_URL=https://enterra.tech|' /opt/enterra-site/.env
grep -q '^TRUST_PROXY=' /opt/enterra-site/.env || echo 'TRUST_PROXY=true' >> /opt/enterra-site/.env
export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env 2>/dev/null || true

echo "=== DNS from server ==="
getent hosts enterra.tech || true
getent hosts www.enterra.tech || true

echo "=== certbot ==="
certbot --nginx -d enterra.tech -d www.enterra.tech \\
  --non-interactive --agree-tos -m """ + EMAIL + """ \\
  --redirect || echo CERTBOT_FAILED

nginx -t
systemctl reload nginx
curl -sf http://127.0.0.1/api/health && echo
echo DONE
""",
        timeout=600,
    )

    print(out.encode("ascii", errors="replace").decode("ascii"))
    print("exit code:", code)
    client.close()
    return 0 if "DONE" in out else 1


if __name__ == "__main__":
    sys.exit(main())
