#!/usr/bin/env python3
"""Migrate enterra-site from old VPS to new Sprintbox + HTTPS + PM2."""
import os
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

from hosts import (
    CERTBOT_EMAIL,
    DEPLOY_USER,
    DOMAIN,
    OLD_DEPLOY_HOST,
    REMOTE_APP_DIR,
    REMOTE_DATA_DIR,
)

ROOT = Path(__file__).resolve().parent.parent
NEW_HOST = os.environ.get("DEPLOY_HOST", "193.222.62.4")


def connect(host: str, password: str) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=DEPLOY_USER, password=password, timeout=90)
    return client


def run(client: paramiko.SSHClient, script: str, timeout: int = 900) -> str:
    _, stdout, stderr = client.exec_command(script, timeout=timeout)
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    code = stdout.channel.recv_exit_status()
    if code != 0:
        print(err, file=sys.stderr)
        raise RuntimeError(f"Remote command failed ({code}): {err[:500]}")
    return out


def backup_old(old_password: str, work: Path) -> tuple[Path, Path | None]:
    print(f"=== Backup from {OLD_DEPLOY_HOST} ===")
    client = connect(OLD_DEPLOY_HOST, old_password)
    env_path = work / "prod.env"
    with client.open_sftp() as sftp:
        try:
            with sftp.open(f"{REMOTE_APP_DIR}/.env", "r") as f:
                env_path.write_bytes(f.read())
            print(f"  .env ({env_path.stat().st_size} bytes)")
        except OSError:
            env_path = None
            print("  .env missing on old server")

        data_tar = work / "data-backup.tar.gz"
        run(
            client,
            f"tar -czf /tmp/enterra-data-backup.tar.gz -C {REMOTE_DATA_DIR} . 2>/dev/null || "
            f"(mkdir -p {REMOTE_DATA_DIR} && tar -czf /tmp/enterra-data-backup.tar.gz -C {REMOTE_DATA_DIR} .)",
            timeout=300,
        )
        sftp.get("/tmp/enterra-data-backup.tar.gz", str(data_tar))
        print(f"  data ({data_tar.stat().st_size} bytes)")

    client.close()
    return env_path, data_tar


def upload_project(client: paramiko.SSHClient, project_tar: Path) -> None:
    with client.open_sftp() as sftp:
        sftp.put(str(project_tar), "/tmp/enterra-site-src.tar.gz")
    run(
        client,
        f"rm -rf {REMOTE_APP_DIR} && mkdir -p {REMOTE_APP_DIR} && "
        f"tar -xzf /tmp/enterra-site-src.tar.gz -C {REMOTE_APP_DIR} && rm -f /tmp/enterra-site-src.tar.gz",
        timeout=600,
    )
    print("  uploaded project sources")


def bootstrap_new(new_password: str, env_path: Path | None, data_tar: Path | None, project_tar: Path) -> None:
    print(f"=== Bootstrap {NEW_HOST} ===")
    client = connect(NEW_HOST, new_password)

    bootstrap = rf"""
set -e
export DEBIAN_FRONTEND=noninteractive
export PATH=/usr/local/bin:/usr/bin:$PATH

apt-get update -qq
apt-get install -y -qq curl git nginx build-essential certbot python3-certbot-nginx rsync >/dev/null

if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs >/dev/null
fi

npm install -g pm2

mkdir -p {REMOTE_DATA_DIR}
mkdir -p {REMOTE_APP_DIR}

echo BOOTSTRAP_OK
"""
    out = run(client, bootstrap, timeout=1200)
    if "BOOTSTRAP_OK" not in out:
        raise RuntimeError("Bootstrap failed")

    upload_project(client, project_tar)

    with client.open_sftp() as sftp:
        if env_path and env_path.is_file():
            sftp.put(str(env_path), f"{REMOTE_APP_DIR}/.env")
            print("  uploaded .env")
        if data_tar and data_tar.is_file():
            sftp.put(str(data_tar), "/tmp/enterra-data-backup.tar.gz")
            run(
                client,
                f"tar -xzf /tmp/enterra-data-backup.tar.gz -C {REMOTE_DATA_DIR} && rm -f /tmp/enterra-data-backup.tar.gz",
                timeout=300,
            )
            print("  restored data/")

    finish = rf"""
set -e
export PATH=/usr/local/bin:/usr/bin:$PATH
cd {REMOTE_APP_DIR}

if grep -q '^SITE_URL=' .env 2>/dev/null; then
  sed -i 's|^SITE_URL=.*|SITE_URL=https://{DOMAIN}|' .env
else
  echo 'SITE_URL=https://{DOMAIN}' >> .env
fi
grep -q '^TRUST_PROXY=' .env || echo 'TRUST_PROXY=true' >> .env
grep -q '^DATA_DIR=' .env || echo 'DATA_DIR={REMOTE_DATA_DIR}' >> .env
grep -q '^NODE_ENV=' .env || echo 'NODE_ENV=production' >> .env
grep -q '^PORT=' .env || echo 'PORT=3001' >> .env

npm ci
npm run build

pm2 delete enterra-site 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true

cat > /etc/nginx/sites-available/enterra << 'NGINXEOF'
server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN} www.{DOMAIN};

    client_max_body_size 55M;

    location / {{
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
NGINXEOF

ln -sf /etc/nginx/sites-available/enterra /etc/nginx/sites-enabled/enterra
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx

chmod +x {REMOTE_APP_DIR}/deploy/site-watchdog.sh 2>/dev/null || true
sed -i 's/\\r$//' {REMOTE_APP_DIR}/deploy/site-watchdog.sh 2>/dev/null || true
( crontab -l 2>/dev/null | grep -v 'site-watchdog.sh' ; echo '*/1 * * * * {REMOTE_APP_DIR}/deploy/site-watchdog.sh >/dev/null 2>&1' ) | crontab -

echo "=== DNS ==="
getent hosts {DOMAIN} || true

certbot --nginx -d {DOMAIN} -d www.{DOMAIN} --non-interactive --agree-tos -m {CERTBOT_EMAIL} --redirect || echo "CERTBOT_SKIPPED"

pm2 reload enterra-site --update-env
sleep 3
curl -sf http://127.0.0.1:3001/api/health
echo
curl -sf https://{DOMAIN}/api/health || curl -sf http://127.0.0.1/api/health
echo
echo MIGRATE_OK
"""
    out = run(client, finish, timeout=1800)
    print(out.encode("ascii", "replace").decode())
    client.close()
    if "MIGRATE_OK" not in out:
        raise RuntimeError("Finish step failed")


def pack_project(work: Path) -> Path:
    import subprocess

    tar_path = work / "enterra-site-src.tar.gz"
    excludes = [
        "--exclude=node_modules",
        "--exclude=.env",
        "--exclude=data",
        "--exclude=plugin/target",
        "--exclude=.git",
    ]
    cmd = ["tar", "-czf", str(tar_path), *excludes, "-C", str(ROOT), "."]
    subprocess.run(cmd, check=True)
    print(f"  project tar ({tar_path.stat().st_size} bytes)")
    return tar_path


def main() -> int:
    old_pw = os.environ.get("OLD_DEPLOY_PASSWORD", "").strip()
    new_pw = os.environ.get("NEW_DEPLOY_PASSWORD", os.environ.get("DEPLOY_PASSWORD", "")).strip()
    if not old_pw or not new_pw:
        print("Set OLD_DEPLOY_PASSWORD and NEW_DEPLOY_PASSWORD (or DEPLOY_PASSWORD)", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        env_path, data_tar = backup_old(old_pw, work)
        project_tar = pack_project(work)
        bootstrap_new(new_pw, env_path, data_tar, project_tar)

    print(f"\nDone. Site target: https://{DOMAIN}")
    print(f"New VPS IP: {NEW_HOST}")
    print("Ensure DNS A records for enterra.tech and www point to this IP.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
