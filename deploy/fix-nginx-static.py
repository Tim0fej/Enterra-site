#!/usr/bin/env python3
"""Serve /assets/ from nginx disk + clean stale bundles + restart app."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

    sftp = c.open_sftp()
    sftp.put(str(ROOT / "deploy" / "enterra.tech.nginx"), "/etc/nginx/sites-available/enterra.tech")
    sftp.put(str(ROOT / "deploy" / "clean-prod-assets.py"), "/opt/enterra-site/deploy/clean-prod-assets.py")
    sftp.close()

    script = r"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
nginx -t
systemctl reload nginx
cd /opt/enterra-site
python3 deploy/clean-prod-assets.py || true
pm2 restart enterra-site --update-env
sleep 4
curl -sf https://enterra.tech/api/health
echo
curl -sf -o /dev/null -w 'js %{http_code} %{size_download}\n' https://enterra.tech/assets/index-m6DASxit.js
pm2 describe enterra-site | grep -E 'status|restarts|uptime'
echo FIX_NGINX_STATIC_OK
"""
    _, o, e = c.exec_command(script, timeout=120)
    out = o.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    err = e.read().decode("utf-8", "replace")
    if err:
        print(err.encode("ascii", "replace").decode(), file=sys.stderr)
    c.close()
    return 0 if "FIX_NGINX_STATIC_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
