#!/usr/bin/env python3
import os
import sys

import paramiko

HOST = "193.222.62.4"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")
if not PASSWORD:
    print("DEPLOY_PASSWORD not set", file=sys.stderr)
    sys.exit(1)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username="root", password=PASSWORD, timeout=30)

checks = [
    ("pm2", "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 status 2>&1 | head -8"),
    ("nginx", "systemctl is-active nginx; nginx -t 2>&1"),
    ("ports", "ss -tlnp | grep -E ':80|:443|:3001' || netstat -tlnp 2>/dev/null | grep -E ':80|:443|:3001'"),
    ("health_local", "curl -sf --max-time 5 http://127.0.0.1:3001/api/health || echo FAIL_3001"),
    ("health_nginx", "curl -sf --max-time 5 -H 'Host: enterra.tech' http://127.0.0.1/api/health || echo FAIL_80"),
    ("health_https", "curl -sf --max-time 5 https://enterra.tech/api/health || echo FAIL_HTTPS"),
    ("pm2_logs", "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 logs enterra-site --lines 15 --nostream 2>&1 | tail -20"),
    ("env", "grep -E 'SITE_URL|PORT|NODE_ENV' /opt/enterra-site/.env 2>/dev/null || echo no env"),
    ("nginx_conf", "head -40 /etc/nginx/sites-enabled/enterra 2>/dev/null || echo no nginx site"),
]

for name, cmd in checks:
    print(f"\n=== {name} ===")
    _, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    text = (out + err).encode("ascii", errors="replace").decode("ascii")
    print(text[:2000])

client.close()
