#!/usr/bin/env python3
"""Point nginx + certbot at a custom domain on the VDS."""
import os
import sys

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "193.222.62.4")
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")
DOMAIN = os.environ.get("DOMAIN", "enterra.tech")
EMAIL = os.environ.get("CERTBOT_EMAIL", "romazaytsev917@gmail.com")
SITE_URL = os.environ.get("SITE_URL", f"https://{DOMAIN}")


def main() -> int:
    if not PASSWORD:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    www = f"www.{DOMAIN}"
    nginx_conf = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} {www};

    client_max_body_size 55M;

    location / {{
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""

    remote_script = f"""set -e
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx >/dev/null

cat > /etc/nginx/sites-available/enterra << 'NGINXEOF'
{nginx_conf}NGINXEOF

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if [ -f /opt/enterra-site/.env ]; then
  if grep -q '^SITE_URL=' /opt/enterra-site/.env; then
    sed -i 's|^SITE_URL=.*|SITE_URL={SITE_URL}|' /opt/enterra-site/.env
  else
    echo 'SITE_URL={SITE_URL}' >> /opt/enterra-site/.env
  fi
  grep -q '^TRUST_PROXY=' /opt/enterra-site/.env || echo 'TRUST_PROXY=true' >> /opt/enterra-site/.env
  export PATH="/usr/local/bin:/usr/bin:$PATH"
  pm2 restart enterra-site --update-env 2>/dev/null || true
fi

echo "=== DNS check (must be {HOST}) ==="
getent hosts {DOMAIN} || true
getent hosts {www} || true

echo "=== certbot ==="
certbot --nginx -d {DOMAIN} -d {www} \\
  --non-interactive --agree-tos -m {EMAIL} \\
  --redirect || echo "CERTBOT_FAILED: update DNS A records to {HOST} first"

nginx -t
systemctl reload nginx

echo "=== health ==="
curl -sf http://127.0.0.1/api/health || true
echo
curl -sfI -H "Host: {DOMAIN}" http://127.0.0.1/api/health | head -3 || true
echo
echo DOMAIN_SETUP_OK
"""

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print(f"Configuring domain {DOMAIN} on {HOST}...")
    _, stdout, stderr = client.exec_command(remote_script, timeout=600, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()

    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err:
        print(err.encode("ascii", errors="replace").decode("ascii"))
    print("exit code:", code)

    client.close()
    return 0 if "DOMAIN_SETUP_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
