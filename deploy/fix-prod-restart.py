#!/usr/bin/env python3
"""Fix production crash (default MC key) and restart PM2."""
import os
import re
import secrets
import sys

import paramiko

HOST = "193.222.62.4"
USER = "root"
PASSWORD = os.environ["DEPLOY_PASSWORD"]
MC_HOST = "enterra.minerent.io"
MC_PORT = 2050
MC_USER = "tw1xty.a005b814"
MC_PASSWORD = os.environ.get("MINERENT_SFTP_PASSWORD", "SCCPm@W39sMjd.h")


def main() -> int:
    mc_key = secrets.token_hex(24)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=60, banner_timeout=60)

    script = f"""set -e
sed -i 's|^MINECRAFT_API_KEY=.*|MINECRAFT_API_KEY={mc_key}|' /opt/enterra-site/.env
export PATH=/usr/local/bin:/usr/bin:$PATH
cd /opt/enterra-site
pm2 restart enterra-site
sleep 5
curl -sf http://127.0.0.1:3001/api/health
echo
curl -sf http://127.0.0.1:3001/api/support | head -c 150
echo
pm2 status
echo FIX_OK
"""
    _, stdout, stderr = client.exec_command(script, timeout=120)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out.encode("ascii", errors="replace").decode())
    if err:
        print(err.encode("ascii", errors="replace").decode())
    client.close()

    if "FIX_OK" not in out:
        return 1

    transport = paramiko.Transport((MC_HOST, MC_PORT))
    transport.connect(username=MC_USER, password=MC_PASSWORD)
    sftp = paramiko.SFTPClient.from_transport(transport)
    path = "plugins/EnterraAuth/config.yml"
    data = sftp.open(path).read().decode("utf-8")
    data = re.sub(r'api-key:\s*"[^"]*"', f'api-key: "{mc_key}"', data)
    with sftp.open(path, "w") as f:
        f.write(data.encode("utf-8"))
    sftp.close()
    transport.close()

    print("EnterraAuth config.yml api-key synced. Restart MC server in Minerent panel.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
