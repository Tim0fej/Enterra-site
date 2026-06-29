#!/bin/bash
# Настройка авто-восстановления Enterra-site (PM2 + cron watchdog)
# Использование на VPS: bash deploy/site-watchdog.sh после deploy/configure-site-watchdog.py

set -euo pipefail

if [ "$(id -u)" != "0" ]; then
  echo "Запусти от root" >&2
  exit 1
fi

export PATH=/usr/local/bin:/usr/bin:$PATH
APP_DIR="/opt/enterra-site"

cd "$APP_DIR" || exit 1

npm install -g pm2 2>/dev/null || true

pm2 start ecosystem.config.cjs --update-env 2>/dev/null || pm2 reload enterra-site --update-env
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash || true

chmod +x "$APP_DIR/deploy/site-watchdog.sh"
CRON_LINE="*/1 * * * * /opt/enterra-site/deploy/site-watchdog.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'site-watchdog.sh' ; echo "$CRON_LINE" ) | crontab -

echo "PM2 + watchdog cron установлены. Проверка:"
curl -sf http://127.0.0.1:3001/api/health && echo
pm2 status
