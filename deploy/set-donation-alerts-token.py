#!/usr/bin/env python3
"""Set DonationAlerts client secret on prod and restart PM2."""
import os
import sys
import paramiko

SECRET = os.environ.get("DONATION_ALERTS_CLIENT_SECRET", "").strip()
ENV_PATH = "/opt/enterra-site/.env"
SECRET_KEY = "DONATION_ALERTS_CLIENT_SECRET"
LEGACY_KEY = "DONATION_ALERTS_ACCESS_TOKEN"


def main() -> int:
    if not SECRET:
        print("Set DONATION_ALERTS_CLIENT_SECRET env var", file=sys.stderr)
        return 1

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect("193.222.62.4", username="root", password=os.environ["DEPLOY_PASSWORD"], timeout=60)

    sftp = c.open_sftp()
    with sftp.open(ENV_PATH, "r") as f:
        lines = f.read().decode("utf-8").splitlines()

    out: list[str] = []
    has_secret = False
    for line in lines:
        if line.startswith(f"{SECRET_KEY}="):
            out.append(f"{SECRET_KEY}={SECRET}")
            has_secret = True
        elif line.startswith(f"{LEGACY_KEY}="):
            continue
        else:
            out.append(line)

    if not has_secret:
        if out and out[-1].strip():
            out.append("")
        out.append(f"{SECRET_KEY}={SECRET}")

    with sftp.open(ENV_PATH, "w") as f:
        f.write("\n".join(out) + "\n")
    sftp.close()

    _, o, _ = c.exec_command(
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 restart enterra-site --update-env; sleep 3; "
        "grep DONATION_ALERTS /opt/enterra-site/.env | sed 's/=.*/=***/'; "
        "curl -sf http://127.0.0.1:3001/api/health; echo",
        timeout=90,
    )
    print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
