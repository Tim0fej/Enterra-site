#!/usr/bin/env python3
"""Restart production app with stable PM2 config."""
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

# Upload fixed ecosystem config only
sftp = c.open_sftp()
sftp.put(
    os.path.join(os.path.dirname(__file__), "..", "ecosystem.config.cjs"),
    "/opt/enterra-site/ecosystem.config.cjs",
)
sftp.close()

script = r"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
cd /opt/enterra-site
pm2 delete enterra-site 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save
sleep 4
curl -sf http://127.0.0.1:3001/api/health
echo
curl -skf https://enterra.tech/api/health
echo
pm2 status
echo RESTART_OK
"""
_, o, e = c.exec_command(script, timeout=120)
out = o.read().decode("utf-8", "replace")
print(out.encode("ascii", "replace").decode())
err = e.read().decode("utf-8", "replace")
if err:
    print(err.encode("ascii", "replace").decode())
c.close()
