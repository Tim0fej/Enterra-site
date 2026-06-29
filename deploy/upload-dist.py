#!/usr/bin/env python3
"""Upload dist/ only and reload PM2 (no npm ci, no .env changes)."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent


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
            sftp.put(str(lp), rp)


def main() -> int:
    if not (ROOT / "dist").is_dir():
        print("Run npm run build first", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()
    print("Uploading dist...")
    upload_dir(sftp, ROOT / "dist", "/opt/enterra-site/dist")
    sftp.close()

    _, o, e = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 reload enterra-site --update-env; sleep 3; "
        "curl -sf https://enterra.tech/api/health; echo; "
        "echo UPLOAD_DIST_OK",
        timeout=90,
    )
    out = o.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    err = e.read().decode("utf-8", "replace")
    if err:
        print(err.encode("ascii", "replace").decode())
    c.close()
    return 0 if "UPLOAD_DIST_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
