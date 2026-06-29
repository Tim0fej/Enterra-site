#!/usr/bin/env python3
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
script = r"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
echo '=== nginx ==='
systemctl is-active nginx || true
curl -sf -o /dev/null -w 'nginx->app %{http_code}\n' http://127.0.0.1/api/health || echo nginx FAIL
curl -sf -o /dev/null -w 'direct 3001 %{http_code}\n' http://127.0.0.1:3001/api/health || echo 3001 FAIL
echo '=== pm2 ==='
pm2 describe enterra-site | sed -n '1,25p'
echo '=== error log tail ==='
tail -20 /root/.pm2/logs/enterra-site-error-0.log 2>/dev/null || true
echo '=== .env keys ==='
grep -E '^(SITE_URL|DATA_DIR|JWT_SECRET|MINECRAFT_API_KEY)=' /opt/enterra-site/.env | sed 's/JWT_SECRET=.*/JWT_SECRET=***/; s/MINECRAFT_API_KEY=.*/MINECRAFT_API_KEY=***/'
echo '=== db ==='
ls -la /var/lib/enterra/data/enterra.db 2>/dev/null || ls -la /opt/enterra-site/data/enterra.db 2>/dev/null
echo '=== nginx error ==='
tail -5 /var/log/nginx/error.log 2>/dev/null || true
"""
_, o, e = c.exec_command(script, timeout=90)
out = o.read().decode("utf-8", "replace")
print(out.encode("ascii", "replace").decode())
err = e.read().decode("utf-8", "replace")
if err:
    print(err)
c.close()
