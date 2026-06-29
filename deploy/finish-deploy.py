#!/usr/bin/env python3
import os
import secrets
import sys

import paramiko

HOST = "193.222.62.4"
USER = "root"
PASSWORD = os.environ["DEPLOY_PASSWORD"]
JWT_SECRET = secrets.token_hex(32)

REMOTE_SCRIPT = f"""set -e
cd /opt/enterra-site

sed -i "s/ip: 'play.enterra.ru'/ip: 'Enterra.minerent.io'/" src/config.ts || true

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

npm run build

export PATH="/usr/local/bin:/usr/bin:$PATH"
npm install -g pm2
pm2 delete enterra-site 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

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
systemctl reload nginx

sleep 3
curl -sf http://127.0.0.1:3001/api/health
echo
curl -sf http://127.0.0.1/api/health
echo
/usr/local/bin/pm2 status || pm2 status
echo FINISH_OK
"""


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print("Finishing deploy...")
    _, stdout, stderr = client.exec_command(REMOTE_SCRIPT, timeout=900, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()

    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err:
        print(err.encode("ascii", errors="replace").decode("ascii"))
    print("exit code:", code)

    client.close()
    return 0 if code == 0 and "FINISH_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
