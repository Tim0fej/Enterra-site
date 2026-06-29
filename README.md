# Enterra Site

Сайт Minecraft-сервера [Enterra](https://enterra.tech): React + Express, SQLite, интеграция с EnterraAuth на MC.

## Разработка

```bash
npm ci
npm run dev
```

## Production

См. [DEPLOY.md](./DEPLOY.md). VPS: `193.222.62.4`, домен `enterra.tech`.

```bash
npm run build
DEPLOY_PASSWORD=... python deploy/upload-app.py
```

## Репозиторий

https://github.com/Tim0fej/Enterra-site
