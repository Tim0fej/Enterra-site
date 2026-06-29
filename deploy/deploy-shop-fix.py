#!/usr/bin/env python3
"""Deploy shop fix and seed EasyDonate product cache on production."""
import os
import sys
import time
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
HOST = "193.222.62.4"


def upload_dir(sftp, local: Path, remote: str) -> None:
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
            sftp.put(str(lp), rp)


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD", "").strip()
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    files = [
        "server/index.ts",
        "server/routes/shop.ts",
        "server/lib/easydonate.ts",
        "server/lib/shopInfo.ts",
        "src/pages/ShopPage.tsx",
        "src/components/ShopPurchaseTicker.tsx",
        "src/api/client.ts",
    ]

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username="root", password=password, timeout=60)
    sftp = c.open_sftp()

    for rel in files:
        local = ROOT / rel
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        print("upload", rel)
        sftp.put(str(local), remote)

    print("upload dist/")
    upload_dir(sftp, ROOT / "dist", "/opt/enterra-site/dist")
    sftp.close()

    script = (
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site && pm2 restart enterra-site --update-env && "
        "sleep 8 && "
        "curl -sf http://127.0.0.1:3001/api/shop | python3 -c \"import sys,json; d=json.load(sys.stdin); print('products', len(d.get('products',[])))\" && "
        "test -f /var/lib/enterra/data/easydonate-products.json && echo CACHE_OK || echo CACHE_MISSING && "
        "curl -sf http://127.0.0.1:3001/api/health && echo && "
        "grep -oE 'assets/index-[^\\\"]+\\.js' dist/index.html && "
        "echo DEPLOY_SHOP_OK"
    )
    _, o, e = c.exec_command(script, timeout=120)
    out = (o.read() + e.read()).decode("utf-8", errors="replace")
    print(out.encode("ascii", "replace").decode())
    c.close()
    return 0 if "DEPLOY_SHOP_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
