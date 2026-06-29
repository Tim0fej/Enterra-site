#!/usr/bin/env python3
"""Set DonationAlerts client_id on prod (env + DB) and restart."""
import os
import sys
import paramiko

CLIENT_ID = os.environ.get("DONATION_ALERTS_CLIENT_ID", "").strip()
ENV_PATH = "/opt/enterra-site/.env"
DB_PATH = "/var/lib/enterra/data/enterra.db"
KEY = "DONATION_ALERTS_CLIENT_ID"


def main() -> int:
    if not CLIENT_ID:
        print("Set DONATION_ALERTS_CLIENT_ID", file=sys.stderr)
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
            out.append(f"{KEY}={CLIENT_ID}")
            updated = True
        else:
            out.append(line)
    if not updated:
        if out and out[-1].strip():
            out.append("")
        out.append(f"{KEY}={CLIENT_ID}")

    with sftp.open(ENV_PATH, "w") as f:
        f.write("\n".join(out) + "\n")
    sftp.close()

    sql = (
        "INSERT INTO donation_alerts_settings (id, client_id, updated_at) "
        f"VALUES (1, '{CLIENT_ID}', datetime('now')) "
        "ON CONFLICT(id) DO UPDATE SET client_id=excluded.client_id, updated_at=datetime('now');"
    )
    cmd = (
        f"sqlite3 {DB_PATH} \"{sql}\" 2>/dev/null || true; "
        "export PATH=/usr/local/bin:/usr/bin:$PATH; "
        "pm2 restart enterra-site --update-env; sleep 4; "
        f"curl -sS -o /dev/null -w 'authorize:%{{http_code}}\\n' -L "
        f"'https://www.donationalerts.com/oauth/authorize?"
        f"client_id={CLIENT_ID}&response_type=code&scope=oauth-donation-index+oauth-user-show&"
        f"redirect_uri=https%3A%2F%2Fenterra.tech%2Fapi%2Fdonationalerts%2Fcallback'; "
        "curl -sf http://127.0.0.1:3001/api/health; echo"
    )
    _, o, e = c.exec_command(cmd, timeout=90)
    print(o.read().decode("utf-8", "replace").encode("ascii", "replace").decode())
    err = e.read().decode("utf-8", "replace")
    if err.strip():
        print(err.encode("ascii", "replace").decode(), file=sys.stderr)
    c.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
