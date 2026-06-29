#!/usr/bin/env python3
"""One-shot deploy to VDS via SSH."""
import os
import secrets
import sys
import time

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "193.222.62.4")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ["DEPLOY_PASSWORD"]
LOCAL_DB = os.environ.get(
    "LOCAL_DB",
    os.path.join(os.path.dirname(__file__), "..", "data", "enterra.db"),
)

JWT_SECRET = secrets.token_hex(32)

REMOTE_SCRIPT = f"""set -e
export DEBIAN_FRONTEND=noninteractive

echo "=== System packages ==="
apt-get update -qq
apt-get install -y -qq curl git nginx build-essential >/dev/null

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  echo "=== Node.js 22 ==="
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs >/dev/null
fi

node -v
npm -v

mkdir -p /var/lib/enterra/data

echo "=== Clone / update repo ==="
if [ -d /opt/enterra-site/.git ]; then
  cd /opt/enterra-site
  git fetch origin
  git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || true
  git pull --ff-only 2>/dev/null || true
else
  rm -rf /opt/enterra-site
  git clone https://github.com/Tim0fej/Enterra-site.git /opt/enterra-site
  cd /opt/enterra-site
fi

echo "=== config.ts MC IP ==="
sed -i "s/ip: 'play.enterra.ru'/ip: 'Enterra.minerent.io'/" src/config.ts || true
sed -i 's/ip: "play.enterra.ru"/ip: "Enterra.minerent.io"/' src/config.ts || true

echo "=== .env ==="
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
SITE_URL=http://Enterra.minerent.io:22130
TRUST_PROXY=true
JWT_SECRET={JWT_SECRET}
MINECRAFT_API_KEY=enterra-plugin-key
DATA_DIR=/var/lib/enterra/data
MC_HOST=Enterra.minerent.io
MC_PORT=25565
SERVER_MONTHLY_COST=1500
ENVEOF

echo "=== npm build ==="
npm ci
npm run build

echo "=== PM2 ==="
npm install -g pm2
pm2 delete enterra-site 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== nginx ==="
cat > /etc/nginx/sites-available/enterra << 'NGINXEOF'
server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 193.222.62.4 _;

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
NGINXEOF

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

echo "=== Health check ==="
sleep 2
curl -sf http://127.0.0.1:3001/api/health
echo ""
curl -sf http://127.0.0.1/api/health || curl -sf http://127.0.0.1:80/api/health
echo ""
echo "DEPLOY_OK"
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 900) -> tuple[int, str, str]:
    print(f"\n>>> {cmd[:120]}{'...' if len(cmd) > 120 else ''}")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out:
        safe = out.encode("utf-8", errors="replace").decode("utf-8", errors="replace")
        try:
            print(safe, end="" if safe.endswith("\n") else "\n")
        except UnicodeEncodeError:
            print(safe.encode("ascii", errors="replace").decode("ascii"), end="\n")
    if err and code != 0:
        print(err, file=sys.stderr, end="" if err.endswith("\n") else "\n")
    return code, out, err


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"Connecting to {USER}@{HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)

    run(client, "mkdir -p /var/lib/enterra/data", timeout=30)

    if os.path.isfile(LOCAL_DB):
        print(f"Uploading database: {LOCAL_DB}")
        sftp = client.open_sftp()
        sftp.put(LOCAL_DB, "/var/lib/enterra/data/enterra.db")
        sftp.close()
    else:
        print("No local enterra.db — server will create a fresh database.")

    print("Running remote deploy script (may take several minutes)...")
    code, out, err = run(client, REMOTE_SCRIPT, timeout=1200)

    if "DEPLOY_OK" not in out:
        print("Deploy may have failed.", file=sys.stderr)
        client.close()
        return 1 if code != 0 else 0

    print("\n=== External checks ===")
    for url in (
        "http://193.222.62.4/api/health",
        "http://Enterra.minerent.io:22130/api/health",
    ):
        c, o, _ = run(client, f"curl -sf -o /dev/null -w '%{{http_code}}' {url} 2>/dev/null || echo FAIL", timeout=30)
        print(f"{url} -> {o.strip()}")

    client.close()
    print("\nDone. Site: http://Enterra.minerent.io:22130")
    print("Plugin EnterraAuth config.yml:")
    print('  api-url: "http://Enterra.minerent.io:22130"')
    print('  api-key: "enterra-plugin-key"')
    print('  website-url: "http://Enterra.minerent.io:22130"')
    return 0


if __name__ == "__main__":
    if "DEPLOY_PASSWORD" not in os.environ:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        sys.exit(1)
    sys.exit(main())
