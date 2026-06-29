#!/usr/bin/env python3
"""Upload ban-bypass IP protection changes and reload PM2."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "server/lib/multiAccount.ts",
    "server/routes/auth.ts",
    "server/routes/minecraft.ts",
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
    _, o, e = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "cd /opt/enterra-site && pm2 restart enterra-site --update-env && sleep 3 && "
        "curl -sf http://127.0.0.1:3001/api/health && echo && echo SERVER_OK",
        timeout=90,
    )
    out = o.read().decode("utf-8", errors="replace")
    err = e.read().decode("utf-8", errors="replace")
    print(out)
    if err:
        print(err, file=sys.stderr)
    c.close()
    return 0 if "SERVER_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
