# Деплой Enterra-site на хост

Сайт — один Node.js процесс: Express API + статика React из `dist/`. База SQLite и файлы в `data/`.

## Быстрый чеклист

1. Скопируй `.env.example` → `.env` и заполни значения
2. `npm ci && npm run build`
3. `NODE_ENV=production npm start` (или PM2 / Docker)
4. Настрой nginx + HTTPS (см. `deploy/nginx.conf.example`)
5. В `plugins/EnterraAuth/config.yml` на MC-сервере укажи `api-url: "https://твой-домен"` и тот же `api-key`

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `NODE_ENV` | `production` на хосте |
| `PORT` | Порт приложения (по умолчанию 3001) |
| `SITE_URL` | Публичный URL, например `https://enterra.ru` |
| `TRUST_PROXY` | `true` за nginx/Cloudflare |
| `JWT_SECRET` | Секрет для токенов (обязательно сменить!) |
| `MINECRAFT_API_KEY` | Ключ для плагина EnterraAuth |
| `DATA_DIR` | Папка БД и uploads (volume на хосте) |
| `MC_HOST` / `MC_PORT` | IP MC-сервера для страницы «Игроки» |

## VPS (Ubuntu) + PM2

```bash
git clone <repo> /opt/enterra-site
cd /opt/enterra-site
cp .env.example .env
nano .env

npm ci
npm run build

npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Данные сохраняй в `/var/lib/enterra/data`:

```env
DATA_DIR=/var/lib/enterra/data
```

## Docker

```bash
docker build -t enterra-site .
docker run -d \
  --name enterra \
  -p 3001:3001 \
  -v enterra-data:/app/data \
  --env-file .env \
  enterra-site
```

## Подключение Minecraft-плагина

В `plugins/EnterraAuth/config.yml`:

```yaml
api-url: "https://enterra.example"
api-key: "<MINECRAFT_API_KEY из .env>"
website-url: "https://enterra.example"
```

MC-сервер должен достучаться до `https://enterra.example/api/minecraft/check/...`

## Проверка

```bash
curl https://enterra.example/api/health
curl -H "x-api-key: YOUR_KEY" https://enterra.example/api/minecraft/check/nick
```

## Бэкап

Регулярно копируй папку `data/` (файл `enterra.db` + `uploads/`).
