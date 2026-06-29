#!/usr/bin/env python3
import os
import paramiko

HOST = "193.222.62.4"
PASSWORD = os.environ["DEPLOY_PASSWORD"]

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD, timeout=30)

_, stdout, _ = client.exec_command(
    """
set -e
sed -i 's|^SITE_URL=.*|SITE_URL=https://enterra.tech|' /opt/enterra-site/.env
grep SITE_URL /opt/enterra-site/.env
export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env
sleep 2
curl -sf https://enterra.tech/api/health
echo
""",
    timeout=60,
)
print(stdout.read().decode("utf-8", errors="replace"))
client.close()
