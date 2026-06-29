#!/usr/bin/env python3
"""Upload prebuilt dist and start app on low-RAM VDS."""
import os
import secrets
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parent.parent
HOST = "193.222.62.4"
USER = "root"
PASSWORD = os.environ["DEPLOY_PASSWORD"]
JWT_SECRET = secrets.token_hex(32)
MC_API_KEY = secrets.token_hex(24)
GMAIL_WEBAPP_URL = os.environ.get(
    "GMAIL_WEBAPP_URL",
    "https://script.google.com/macros/s/AKfycbz3AB-ALua8yH0apd19PBTtuVUDsb8B4g3U-pvO-WFBh-La_pfDo2zy_II6nhLnQnSl6g/exec",
)

UPLOAD_PATHS = [
    "dist",
    "server",
    "shared",
    "package.json",
    "package-lock.json",
    "ecosystem.config.cjs",
    "tsconfig.json",
    "tsconfig.server.json",
    "vite.config.ts",
    "src/config.ts",
]


def upload_dir(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
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
            print(f"  upload {lp.relative_to(ROOT)}")
            sftp.put(str(lp), rp)


def upload_file(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    print(f"  upload {local.relative_to(ROOT)}")
    sftp.put(str(local), remote)


def main() -> int:
    if not (ROOT / "dist").is_dir():
        print("Run npm run build locally first", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    remote_root = "/opt/enterra-site"
    sftp = client.open_sftp()

    print("Uploading built files...")
    for rel in UPLOAD_PATHS:
        local = ROOT / rel
        remote = f"{remote_root}/{rel}"
        if local.is_dir():
            upload_dir(sftp, local, remote)
        elif local.is_file():
            upload_file(sftp, local, remote)

    local_db = ROOT / "data" / "enterra.db"
    if local_db.is_file() and os.environ.get("DEPLOY_UPLOAD_DB") == "1":
        print("  upload data/enterra.db")
        sftp.put(str(local_db), "/var/lib/enterra/data/enterra.db")

    sftp.close()

    env_content = f"""NODE_ENV=production
PORT=3001
SITE_URL=https://enterra.tech
TRUST_PROXY=true
JWT_SECRET={JWT_SECRET}
MINECRAFT_API_KEY={MC_API_KEY}
DATA_DIR=/var/lib/enterra/data
MC_HOST=Enterra.minerent.io
MC_PORT=25565
SERVER_MONTHLY_COST=1500
LEGAL_SELLER_NAME="Зайцев Роман Иванович"
LEGAL_SELLER_STATUS=Самозанятый
LEGAL_INN=180302091456
LEGAL_EMAIL=enterrasupport@gmail.com
GMAIL_WEBAPP_URL={GMAIL_WEBAPP_URL}
GMAIL_WEBAPP_SECRET=enterra-mail-secret-2026
SMTP_FROM=enterraverif@gmail.com
"""

    start_script = f"""set -e
cd {remote_root}
mkdir -p /var/lib/enterra/data

# Preserve JWT_SECRET and SITE_URL if already configured
if [ -f .env ]; then
  OLD_JWT=$(grep '^JWT_SECRET=' .env | cut -d= -f2- || true)
  OLD_SITE=$(grep '^SITE_URL=' .env | cut -d= -f2- || true)
  OLD_YOOKASSA_SHOP=$(grep '^YOOKASSA_SHOP_ID=' .env | cut -d= -f2- || true)
  OLD_YOOKASSA_SECRET=$(grep '^YOOKASSA_SECRET_KEY=' .env | cut -d= -f2- || true)
  OLD_GMAIL_URL=$(grep '^GMAIL_WEBAPP_URL=' .env | cut -d= -f2- || true)
  OLD_GMAIL_SECRET=$(grep '^GMAIL_WEBAPP_SECRET=' .env | cut -d= -f2- || true)
  OLD_SMTP_PASS=$(grep '^SMTP_PASS=' .env | cut -d= -f2- || true)
  OLD_BREVO=$(grep '^BREVO_API_KEY=' .env | cut -d= -f2- || true)
  OLD_MC_KEY=$(grep '^MINECRAFT_API_KEY=' .env | cut -d= -f2- || true)
fi

cat > .env << 'ENVEOF'
{env_content}ENVEOF

if [ -n "$OLD_JWT" ]; then
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$OLD_JWT|" .env
fi
if [ -n "$OLD_SITE" ]; then
  sed -i "s|^SITE_URL=.*|SITE_URL=$OLD_SITE|" .env
fi
if [ -n "$OLD_YOOKASSA_SHOP" ]; then
  sed -i "s|^YOOKASSA_SHOP_ID=.*|YOOKASSA_SHOP_ID=$OLD_YOOKASSA_SHOP|" .env
fi
if [ -n "$OLD_YOOKASSA_SECRET" ]; then
  sed -i "s|^YOOKASSA_SECRET_KEY=.*|YOOKASSA_SECRET_KEY=$OLD_YOOKASSA_SECRET|" .env
fi
if [ -n "$OLD_GMAIL_URL" ]; then
  sed -i "s|^GMAIL_WEBAPP_URL=.*|GMAIL_WEBAPP_URL=$OLD_GMAIL_URL|" .env
fi
if [ -n "$OLD_GMAIL_SECRET" ]; then
  sed -i "s|^GMAIL_WEBAPP_SECRET=.*|GMAIL_WEBAPP_SECRET=$OLD_GMAIL_SECRET|" .env
fi
if [ -n "$OLD_SMTP_PASS" ]; then
  sed -i "s|^SMTP_PASS=.*|SMTP_PASS=$OLD_SMTP_PASS|" .env
fi
if [ -n "$OLD_BREVO" ]; then
  sed -i "s|^BREVO_API_KEY=.*|BREVO_API_KEY=$OLD_BREVO|" .env
fi
if [ -n "$OLD_MC_KEY" ]; then
  sed -i "s|^MINECRAFT_API_KEY=.*|MINECRAFT_API_KEY=$OLD_MC_KEY|" .env
fi

# swap for npm if needed
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q swapfile /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

npm ci --omit=dev

export PATH="/usr/local/bin:/usr/bin:$PATH"
npm install -g pm2
pm2 delete enterra-site 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save

# Do not overwrite nginx/domain config — use deploy/repair-site.py if needed

sleep 4
curl -sf http://127.0.0.1:3001/api/health
echo
curl -sf http://127.0.0.1:3001/api/legal | head -c 200
echo
curl -skf https://enterra.tech/api/health
echo
pm2 status
echo UPLOAD_DEPLOY_OK
"""

    print("Starting app on server...")
    _, stdout, stderr = client.exec_command(start_script, timeout=600, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    print(out.encode("ascii", errors="replace").decode("ascii"))
    if err:
        print(err.encode("ascii", errors="replace").decode("ascii"))

    client.close()
    return 0 if code == 0 and "UPLOAD_DEPLOY_OK" in out else 1


if __name__ == "__main__":
    sys.exit(main())
