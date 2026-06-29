#!/bin/bash
# Health-check watchdog for enterra-site (PM2). Install via deploy/configure-site-watchdog.py
set -euo pipefail

export PATH=/usr/local/bin:/usr/bin:$PATH
APP_DIR="/opt/enterra-site"
LOG="/var/log/enterra-site-watchdog.log"

cd "$APP_DIR" || exit 1

if curl -sf --max-time 8 http://127.0.0.1:3001/api/health >/dev/null; then
  exit 0
fi

echo "$(date -Is) health check failed — restarting enterra-site" >> "$LOG"

if pm2 describe enterra-site >/dev/null 2>&1; then
  pm2 reload enterra-site --update-env >> "$LOG" 2>&1 || pm2 restart enterra-site --update-env >> "$LOG" 2>&1
else
  pm2 start ecosystem.config.cjs --update-env >> "$LOG" 2>&1
fi

pm2 save >> "$LOG" 2>&1 || true

sleep 4
if curl -sf --max-time 8 http://127.0.0.1:3001/api/health >/dev/null; then
  echo "$(date -Is) recovery ok" >> "$LOG"
else
  echo "$(date -Is) recovery failed" >> "$LOG"
fi
