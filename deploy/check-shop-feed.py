#!/usr/bin/env python3
import os
import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
cmd = (
    "cd /opt/enterra-site && node --input-type=module -e \""
    "import Database from 'better-sqlite3';"
    "const db=new Database('/var/lib/enterra/data/enterra.db');"
    "const u=db.prepare('SELECT id,username FROM users WHERE username=? COLLATE NOCASE').get('tw1xty');"
    "console.log('user', u);"
    "if(u){console.log('priv', db.prepare('SELECT pt.slug,pt.name,up.expires_at,up.granted_at FROM user_privileges up JOIN privilege_tiers pt ON pt.id=up.tier_id WHERE up.user_id=?').all(u.id));}"
    "\" 2>&1"
)
_, o, _ = c.exec_command(cmd, timeout=60)
print(o.read().decode("utf-8", "replace"))
c.close()
