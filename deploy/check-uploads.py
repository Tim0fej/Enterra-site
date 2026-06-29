#!/usr/bin/env python3
import os
import paramiko

PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
HOST = "193.222.62.4"

cmds = [
    "test -f /opt/enterra-site/server/routes/uploads.ts && echo uploads_ts=ok || echo uploads_ts=missing",
    "test -f /opt/enterra-site/server/lib/fileSniff.ts && echo sniff=ok || echo sniff=missing",
    "ls -la /var/lib/enterra/data/uploads 2>&1 | head -5",
    'sqlite3 /var/lib/enterra/data/enterra.db ".schema attachments" 2>&1',
    "grep multer /opt/enterra-site/package.json || true",
    "export PATH=/usr/local/bin:/usr/bin:$PATH; pm2 logs enterra-site --lines 40 --nostream 2>&1 | tail -25",
]

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username="root", password=PASSWORD, timeout=60)
for cmd in cmds:
    print(">>>", cmd)
    _, o, e = c.exec_command(cmd, timeout=60)
    print(o.read().decode("utf-8", "replace"))
    err = e.read().decode("utf-8", "replace")
    if err.strip():
        print("ERR:", err)
c.close()
