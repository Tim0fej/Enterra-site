#!/usr/bin/env python3
"""Upload dist/, server/, shared/ and reload PM2 (no npm ci)."""
import os
import sys
from pathlib import Path

import paramiko

from hosts import DEPLOY_HOST, REMOTE_APP_DIR

ROOT = Path(__file__).resolve().parent.parent
HOST = DEPLOY_HOST
REMOTE = REMOTE_APP_DIR
UPLOAD_DIRS = ("dist", "server", "shared")


def upload_dir(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    try:
        sftp.mkdir(remote)
    except OSError:
        pass
    for item in local.iterdir():
        lp = local / item.name
        rp = f"{remote}/{item.name}"
        if lp.is_dir():
            upload_dir(sftp, lp, rp)
        else:
            print(f"  {lp.relative_to(ROOT)}")
            data = lp.read_bytes()
            with sftp.open(rp, "wb") as remote_file:
                remote_file.write(data)


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD")
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    for name in UPLOAD_DIRS:
        if not (ROOT / name).is_dir():
            print(f"Missing {name}/ — run npm run build first", file=sys.stderr)
            return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)
    sftp = c.open_sftp()

    for name in UPLOAD_DIRS:
        print(f"Uploading {name}...")
        upload_dir(sftp, ROOT / name, f"{REMOTE}/{name}")

    sftp.close()

    _, o, e = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site; "
        "if grep -q '^LEGAL_EMAIL=' .env 2>/dev/null; then "
        "sed -i 's|^LEGAL_EMAIL=.*|LEGAL_EMAIL=enterrasupport@gmail.com|' .env; "
        "else echo 'LEGAL_EMAIL=enterrasupport@gmail.com' >> .env; fi; "
        "pm2 reload enterra-site --update-env; sleep 4; "
        "curl -sf https://enterra.tech/api/health; echo; "
        "curl -sf https://enterra.tech/api/legal | head -c 300; echo; "
        "echo UPLOAD_APP_OK",
        timeout=120,
    )
    out = o.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    err = e.read().decode("utf-8", "replace")
    if err:
        print(err.encode("ascii", "replace").decode())
    c.close()
    return 0 if "UPLOAD_APP_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
