#!/usr/bin/env python3
"""Check moderation queue and MC API key on production."""
import os
import sys

import paramiko

HOST = "193.222.62.4"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    script = r"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
grep '^MINECRAFT_API_KEY=' /opt/enterra-site/.env
echo '=== moderation_queue last 10 ==='
cd /opt/enterra-site
node -e "
const Database=require('better-sqlite3');
const db=new Database('/var/lib/enterra/data/enterra.db',{readonly:true});
const rows=db.prepare('SELECT id, action, target_username, status, error_message, created_at, processed_at FROM moderation_queue ORDER BY id DESC LIMIT 10').all();
console.log(JSON.stringify(rows,null,2));
console.log('pending', db.prepare(\"SELECT COUNT(*) AS c FROM moderation_queue WHERE status='pending'\").get().c);
"
echo '=== user tw1xty ==='
node -e "
const Database=require('better-sqlite3');
const db=new Database('/var/lib/enterra/data/enterra.db',{readonly:true});
const u=db.prepare('SELECT id, username, role FROM users WHERE username = ? COLLATE NOCASE').get('tw1xty');
console.log(u);
"
"""
    _, o, e = c.exec_command(script, timeout=60)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    if err.strip():
        print(err.encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
