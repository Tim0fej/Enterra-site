#!/usr/bin/env python3
import os
import sys

import paramiko

HOST = "193.222.62.4"
USER = "root"
USERNAME = os.environ.get("ADMIN_USERNAME", "tw1xty")


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD")
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=30)

    cmd = (
        "cd /opt/enterra-site && node -e \""
        "const Database=require('better-sqlite3');"
        f"const db=new Database('/var/lib/enterra/data/enterra.db');"
        f"db.prepare(\\\"UPDATE users SET role='admin' WHERE username='{USERNAME}' COLLATE NOCASE\\\").run();"
        f"console.log(JSON.stringify(db.prepare(\\\"SELECT id,username,role FROM users WHERE username='{USERNAME}' COLLATE NOCASE\\\").get()));"
        "\""
    )
    _, stdout, stderr = client.exec_command(cmd, timeout=30)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out or err)
    client.close()
    return 0 if "admin" in out else 1


if __name__ == "__main__":
    sys.exit(main())
