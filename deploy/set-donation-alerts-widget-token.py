#!/usr/bin/env python3
import os
import sys
import paramiko

TOKEN = os.environ.get("DONATION_ALERTS_WIDGET_TOKEN", "").strip()
ENV_PATH = "/opt/enterra-site/.env"
KEY = "DONATION_ALERTS_WIDGET_TOKEN"


def main() -> int:
    if not TOKEN:
        print("Set DONATION_ALERTS_WIDGET_TOKEN", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

    sftp = c.open_sftp()
    with sftp.open(ENV_PATH, "r") as f:
        lines = f.read().decode("utf-8").splitlines()

    out: list[str] = []
    updated = False
    for line in lines:
        if line.startswith(f"{KEY}="):
            out.append(f"{KEY}={TOKEN}")
            updated = True
        else:
            out.append(line)
    if not updated:
        if out and out[-1].strip():
            out.append("")
        out.append(f"{KEY}={TOKEN}")

    with sftp.open(ENV_PATH, "w") as f:
        f.write("\n".join(out) + "\n")
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 restart enterra-site --update-env; sleep 3; "
        "curl -sf http://127.0.0.1:3001/api/health; echo",
        timeout=90,
    )
    print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
