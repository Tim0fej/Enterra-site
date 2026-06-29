#!/usr/bin/env python3
"""Install site health watchdog cron on production VPS."""
import os
import sys
from pathlib import Path

import paramiko

from hosts import DEPLOY_HOST, REMOTE_APP_DIR

ROOT = Path(__file__).resolve().parent.parent
HOST = DEPLOY_HOST
REMOTE_DIR = REMOTE_APP_DIR
WATCHDOG = ROOT / "deploy" / "site-watchdog.sh"
ECOSYSTEM = ROOT / "ecosystem.config.cjs"
CRON_LINE = "*/1 * * * * /opt/enterra-site/deploy/site-watchdog.sh >/dev/null 2>&1"


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)
    sftp = c.open_sftp()

    sftp.put(str(WATCHDOG), f"{REMOTE_DIR}/deploy/site-watchdog.sh")
    sftp.put(str(ECOSYSTEM), f"{REMOTE_DIR}/ecosystem.config.cjs")
    sftp.close()

    script = rf"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
sed -i 's/\r$//' {REMOTE_DIR}/deploy/site-watchdog.sh
chmod +x {REMOTE_DIR}/deploy/site-watchdog.sh
mkdir -p /var/log
touch /var/log/enterra-site-watchdog.log
cd {REMOTE_DIR}
pm2 start ecosystem.config.cjs --update-env 2>/dev/null || pm2 reload enterra-site --update-env
pm2 save
( crontab -l 2>/dev/null | grep -v 'site-watchdog.sh' ; echo '{CRON_LINE}' ) | crontab -
{REMOTE_DIR}/deploy/site-watchdog.sh || true
curl -sf http://127.0.0.1:3001/api/health
echo
echo WATCHDOG_OK
"""
    _, o, e = c.exec_command(script, timeout=120)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    if err:
        print(err.encode("ascii", "replace").decode())
    c.close()
    return 0 if "WATCHDOG_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
