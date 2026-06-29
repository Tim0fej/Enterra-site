#!/usr/bin/env python3
"""Remove donation feed entries for a user from production DB."""
import os
import sys

import paramiko

USERNAME = sys.argv[1] if len(sys.argv) > 1 else "tw1xty"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

cmd = (
    "cd /opt/enterra-site && node --input-type=module -e \""
    "import Database from 'better-sqlite3';"
    f"const user={USERNAME!r};"
    "const db=new Database('/var/lib/enterra/data/enterra.db');"
    "const before=db.prepare('SELECT COUNT(*) AS c FROM shop_feed_events WHERE kind=? AND username=? COLLATE NOCASE').get('donation', user);"
    "const del=db.prepare('DELETE FROM shop_feed_events WHERE kind=? AND username=? COLLATE NOCASE').run('donation', user);"
    "console.log(JSON.stringify({user, deleted: del.changes, before: before.c}));"
    "\" 2>&1"
)
_, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode("utf-8", "replace"))
err = e.read().decode("utf-8", "replace")
if err.strip():
    print(err, file=sys.stderr)
c.close()
