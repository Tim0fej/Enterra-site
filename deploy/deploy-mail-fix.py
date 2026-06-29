#!/usr/bin/env python3
import os
import re
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
HOST = "193.222.62.4"
ENV_PATH = "/opt/enterra-site/.env"
FILES = ["server/lib/mailer.ts", "server/lib/emailVerification.ts"]

updates = {
    "SMTP_FROM": "enterraverif@gmail.com",
    "SMTP_USER": "enterraverif@gmail.com",
    "SMTP_PASS": os.environ.get("SMTP_PASS", "b2A~pah994i79je0"),
    "GMAIL_WEBAPP_SECRET": "enterra-mail-secret-2026",
}


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=30)
    sftp = client.open_sftp()

    for rel in FILES:
        sftp.put(str(ROOT / rel), f"/opt/enterra-site/{rel}")

    try:
        content = sftp.open(ENV_PATH).read().decode("utf-8")
    except OSError:
        content = ""

    for key, value in updates.items():
        line = f"{key}={value}"
        if re.search(rf"^{re.escape(key)}=", content, re.MULTILINE):
            content = re.sub(rf"^{re.escape(key)}=.*$", line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip() + "\n" + line + "\n"

    with sftp.open(ENV_PATH, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    _, stdout, _ = client.exec_command(
        'export PATH="/usr/local/bin:/usr/bin:$PATH"; pm2 restart enterra-site --update-env; echo DEPLOY_OK',
        timeout=30,
    )
    print(stdout.read().decode("utf-8", errors="replace"))
    client.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
