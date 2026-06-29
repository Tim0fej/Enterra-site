#!/usr/bin/env python3
"""Upload server/shared changes and reload PM2."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "server/index.ts",
    "server/db.ts",
    "server/routes/support.ts",
    "server/routes/shop.ts",
    "server/lib/easydonate.ts",
    "server/lib/easydonatePayments.ts",
    "shared/easydonateConfig.ts",
    "shared/supportConfig.ts",
    "shared/legalContent.ts",
    "shared/faqContent.ts",
    "shared/termsContent.ts",
]


def main() -> int:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = f"/opt/enterra-site/{rel.replace(chr(92), '/')}"
        print("upload", rel)
        sftp.put(str(local), remote)
    sftp.close()
    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site && pm2 restart enterra-site --update-env && sleep 3 && "
        "curl -sf https://enterra.tech/api/health && echo && echo SERVER_OK",
        timeout=90,
    )
    print(o.read().decode("utf-8", errors="replace"))
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
