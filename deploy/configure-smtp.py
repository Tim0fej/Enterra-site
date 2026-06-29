#!/usr/bin/env python3
import os
import re
import sys

import paramiko

HOST = "193.222.62.4"
PASSWORD = os.environ.get("DEPLOY_PASSWORD")
SMTP_PASS = os.environ.get("SMTP_PASS")
ENV_PATH = "/opt/enterra-site/.env"

SMTP_VARS = {
    "SMTP_FROM": "enterraverif@gmail.com",
    "SMTP_USER": "enterraverif@gmail.com",
    "SMTP_PASS": SMTP_PASS or "",
}


def main() -> int:
    if not PASSWORD:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1
    if not SMTP_PASS:
        print("Set SMTP_PASS", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username="root", password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    try:
        content = sftp.open(ENV_PATH).read().decode("utf-8")
    except OSError:
        content = ""

    for key, value in SMTP_VARS.items():
        line = f"{key}={value}"
        if re.search(rf"^{re.escape(key)}=", content, re.MULTILINE):
            content = re.sub(rf"^{re.escape(key)}=.*$", line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip() + "\n" + line + "\n"

    with sftp.open(ENV_PATH, "w") as f:
        f.write(content.encode("utf-8"))
    sftp.close()

    _, stdout, _ = client.exec_command(
        """
export PATH="/usr/local/bin:/usr/bin:$PATH"
pm2 restart enterra-site --update-env
sleep 3
curl -sf http://127.0.0.1:3001/api/health
echo
echo SMTP_OK
""",
        timeout=60,
    )
    out = stdout.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode("ascii"))
    client.close()
    return 0 if "SMTP_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
