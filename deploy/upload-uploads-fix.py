#!/usr/bin/env python3
"""Deploy upload fixes (server + dist + nginx)."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
HOST = "193.222.62.4"

SERVER_FILES = [
    "shared/attachments.ts",
    "server/routes/uploads.ts",
    "server/lib/fileSniff.ts",
    "server/lib/attachments.ts",
    "server/middleware/security.ts",
    "server/index.ts",
    "server/db.ts",
]


def upload_file(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    print(f"  {local.relative_to(ROOT)}")
    sftp.put(str(local), remote)


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
    c.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()

    print("Uploading server files...")
    for rel in SERVER_FILES:
        local = ROOT / rel
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        upload_file(sftp, local, remote)

    print("Uploading dist...")
    upload_dir(sftp, ROOT / "dist", "/opt/enterra-site/dist")

    print("Uploading nginx config...")
    upload_file(sftp, ROOT / "deploy" / "enterra.tech.nginx", "/etc/nginx/sites-available/enterra.tech")

    sftp.close()

    cmd = (
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "nginx -t && systemctl reload nginx; "
        "pm2 restart enterra-site --update-env; sleep 4; "
        "curl -sf https://enterra.tech/api/health; echo; "
        "echo UPLOADS_FIX_OK"
    )
    _, o, e = c.exec_command(cmd, timeout=120)
    out = o.read().decode("utf-8", "replace")
    err = e.read().decode("utf-8", "replace")
    print(out.encode("ascii", "replace").decode())
    if err.strip():
        print(err.encode("ascii", "replace").decode())
    c.close()
    return 0 if "UPLOADS_FIX_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
