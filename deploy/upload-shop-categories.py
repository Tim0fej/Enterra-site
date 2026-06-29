#!/usr/bin/env python3
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "shared/shopCatalog.ts",
    "shared/shopCategories.ts",
    "server/routes/shop.ts",
]


def main() -> int:
    if not (ROOT / "dist").is_dir():
        print("Run npm run build first", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        print("upload", rel)
        sftp.put(str(local), remote)

    def upload_dir(local: Path, remote: str) -> None:
        try:
            sftp.mkdir(remote)
        except OSError:
            pass
        for item in local.iterdir():
            lp = local / item.name
            rp = f"{remote}/{item.name}"
            if lp.is_dir():
                upload_dir(lp, rp)
            else:
                sftp.put(str(lp), rp)

    print("upload dist/")
    upload_dir(ROOT / "dist", "/opt/enterra-site/dist")
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 restart enterra-site --update-env; sleep 3; "
        "curl -sf https://enterra.tech/api/health; echo; echo SHOP_CATEGORIES_OK",
        timeout=90,
    )
    print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
