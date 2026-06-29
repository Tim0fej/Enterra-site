#!/usr/bin/env python3
"""Write EasyDonate product IDs and shop URL to production .env."""
import os
import sys

import paramiko

REMOTE_ENV = "/opt/enterra-site/.env"
FILES = [
    "shared/easydonateConfig.ts",
    "shared/supportConfig.ts",
    "server/lib/easydonate.ts",
    "server/routes/support.ts",
]


def upsert(content: str, key: str, value: str) -> str:
    line = f"{key}={value}"
    out, found = [], False
    for row in content.splitlines():
        if row.startswith(f"{key}="):
            out.append(line)
            found = True
        else:
            out.append(row)
    if not found:
        out.append(line)
    return "\n".join(out).rstrip() + "\n"


def main() -> int:
    if not os.environ.get("DEPLOY_PASSWORD"):
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

    root = os.path.join(os.path.dirname(__file__), "..")
    sftp = c.open_sftp()
    for rel in FILES:
        local = os.path.join(root, rel)
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        print("upload", rel)
        sftp.put(local, remote)

    with sftp.open(REMOTE_ENV, "r") as f:
        content = f.read().decode("utf-8", errors="replace")

    content = upsert(content, "EASYDONATE_SHOP_URL", "https://enterra.easydonate.ru")
    content = upsert(content, "EASYDONATE_VIP_PRODUCT_1", "1098490")
    content = upsert(content, "EASYDONATE_VIP_PRODUCT_3", "1098491")
    content = upsert(content, "EASYDONATE_VIP_PRODUCT_6", "1098492")
    content = upsert(content, "EASYDONATE_SERVICE_UNBAN", "1098559")
    content = upsert(content, "EASYDONATE_SERVICE_CLEAR_WARNS", "1098560")
    content = upsert(content, "EASYDONATE_PRODUCT_1098559_KIND", "unban")
    content = upsert(content, "EASYDONATE_PRODUCT_1098560_KIND", "clear_warns")
    content = upsert(content, "EASYDONATE_PRODUCT_1098559_CATEGORY", "services")
    content = upsert(content, "EASYDONATE_PRODUCT_1098560_CATEGORY", "services")

    with sftp.open(REMOTE_ENV, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site && pm2 restart enterra-site --update-env",
        timeout=90,
    )
    o.read()
    c.close()
    print("PRODUCT_IDS_OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
