#!/usr/bin/env python3
"""Test shop checkout on production (creates payment URL, does not pay)."""
import json
import os
import sys

import paramiko

HOST = "193.222.62.4"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    node_script = """
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  const out = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\\r?\\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

const env = loadEnv('/opt/enterra-site/.env');
const dataDir = env.DATA_DIR || '/var/lib/enterra/data';
const db = new Database(path.join(dataDir, 'enterra.db'), { readonly: true });
const user = db.prepare("SELECT id, username, email, role, token_version FROM users WHERE email IS NOT NULL AND length(email) > 0 ORDER BY id DESC LIMIT 1").get();
if (!user) {
  console.log(JSON.stringify({ error: 'no user with email' }));
  process.exit(0);
}
const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user', tv: user.token_version ?? 0 }, env.JWT_SECRET, { expiresIn: '5m' });
console.log(JSON.stringify({ userId: user.id, username: user.username, hasEmail: !!user.email }));
console.log('TOKEN=' + token);
"""

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)

    sftp = c.open_sftp()
    remote = "/opt/enterra-site/tmp-test-shop-token.cjs"
    with sftp.open(remote, "w") as f:
        f.write(node_script.encode("utf-8"))
    sftp.close()

    _, o, e = c.exec_command("cd /opt/enterra-site && node tmp-test-shop-token.cjs", timeout=60)
    out = (o.read() + e.read()).decode("utf-8", errors="replace")
    print("=== user/token ===")
    print(out.encode("ascii", "replace").decode())

    token = None
    for line in out.splitlines():
        if line.startswith("TOKEN="):
            token = line.split("=", 1)[1].strip()

    if not token:
        c.close()
        return 1

    checkout_cmd = (
        f"curl -sS -w '\\nHTTP:%{{http_code}}' -X POST http://127.0.0.1:3001/api/shop/checkout "
        f"-H 'Content-Type: application/json' "
        f"-H 'Origin: https://enterra.tech' "
        f"-H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' "
        f"-H 'Authorization: Bearer {token}' "
        f"-d '{{\"productId\":1098490}}'"
    )
    _, o, e = c.exec_command(checkout_cmd, timeout=60)
    result = (o.read() + e.read()).decode("utf-8", errors="replace")
    print("\n=== checkout test ===")
    print(result.encode("ascii", "replace").decode())

    env_cmd = "grep -E '^(SITE_URL|EASYDONATE_SUCCESS_URL)=' /opt/enterra-site/.env"
    _, o, _ = c.exec_command(env_cmd, timeout=30)
    print("\n=== site url ===")
    print(o.read().decode("utf-8", errors="replace"))

    ed_cmd = (
        "source /opt/enterra-site/.env 2>/dev/null; "
        "KEY=$(grep '^EASYDONATE_SHOP_KEY=' /opt/enterra-site/.env | cut -d= -f2-); "
        "SID=$(grep '^EASYDONATE_SERVER_ID=' /opt/enterra-site/.env | cut -d= -f2-); "
        "curl -sS -w '\\nHTTP:%{http_code}' -H \"Shop-Key: $KEY\" "
        "\"https://easydonate.ru/api/v3/shop/payment/create?customer=testuser&email=test@test.com&server_id=$SID&products=%7B%221098490%22%3A1%7D&success_url=https%3A%2F%2Fenterra.tech%2Fshop%3Fpayment%3Dsuccess\" | head -c 800"
    )
    _, o, e = c.exec_command(ed_cmd, timeout=60)
    print("\n=== easydonate payment/create ===")
    print((o.read() + e.read()).decode("utf-8", errors="replace").encode("ascii", "replace").decode())

    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
