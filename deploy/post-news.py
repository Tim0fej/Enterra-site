#!/usr/bin/env python3
"""Publish a news topic to forum category «news» on production."""
import json
import os
import sys
import textwrap

import paramiko

HOST = "193.222.62.4"
USER = "root"
AUTHOR = os.environ.get("NEWS_AUTHOR", "tw1xty")

DEFAULT_TITLE = "Лето на Enterra — сайт обновлён, добро пожаловать на сервер!"

DEFAULT_CONTENT = textwrap.dedent("""
    Привет!

    Мы обновили сайт enterra.tech и продолжаем развивать сервер. Кратко о главном:

    **Сервер**
    • IP: Enterra.minerent.io (Java 1.21.4, Fabric)
    • Ванильный геймплей с модами для комфорта — сборка Enterra Comfort на странице «Моды»
    • Регистрация на сайте обязательна: ник должен совпадать с ником в игре

    **Сайт**
    • Магазин VIP и услуг через EasyDonate
    • Политика возврата: enterra.tech/refund
    • Поддержка: тикеты на сайте или enterrasupport@gmail.com
    • Новости и анонсы — здесь и в Telegram @enterra_official

    **Как зайти**
    1. Зарегистрируйся на сайте с тем же ником, что в Minecraft
    2. Подтверди email и скопируй код из профиля
    3. Подключись к серверу и введи в чат: /code ТВОЙ_КОД

    Увидимся в игре! Если что-то не работает — пишите в тикеты, поможем.

    — команда Enterra
""").strip()

NODE_SCRIPT = """
const fs = require('fs');
const Database = require('better-sqlite3');

const input = JSON.parse(fs.readFileSync('/opt/enterra-site/post-news.json', 'utf8'));
const db = new Database('/var/lib/enterra/data/enterra.db');

const author = db.prepare(
  "SELECT id, username, role FROM users WHERE username = ? COLLATE NOCASE"
).get(input.author);

if (!author) {
  console.error('AUTHOR_NOT_FOUND');
  process.exit(1);
}

const category = db.prepare("SELECT id FROM forum_categories WHERE slug = 'news'").get();
if (!category) {
  console.error('NEWS_CATEGORY_NOT_FOUND');
  process.exit(1);
}

const topicId = db.transaction(() => {
  const topic = db.prepare(`
    INSERT INTO forum_topics (category_id, user_id, title, pinned, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(category.id, author.id, input.title, input.pinned ? 1 : 0);

  const id = Number(topic.lastInsertRowid);
  db.prepare('INSERT INTO forum_posts (topic_id, user_id, content) VALUES (?, ?, ?)').run(
    id,
    author.id,
    input.content,
  );
  return id;
})();

console.log(JSON.stringify({
  ok: true,
  topicId,
  title: input.title,
  author: author.username,
  url: `https://enterra.tech/forum/topic/${topicId}`,
}));
"""


def main() -> int:
    password = os.environ.get("DEPLOY_PASSWORD")
    if not password:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        return 1

    payload = {
        "author": AUTHOR,
        "title": os.environ.get("NEWS_TITLE", DEFAULT_TITLE),
        "content": os.environ.get("NEWS_CONTENT", DEFAULT_CONTENT),
        "pinned": os.environ.get("NEWS_PINNED", "1") not in ("0", "false", "False"),
    }

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=60)

    sftp = client.open_sftp()
    with sftp.file("/opt/enterra-site/post-news.json", "w") as f:
        f.write(json.dumps(payload, ensure_ascii=False))
    with sftp.file("/opt/enterra-site/post-news-run.cjs", "w") as f:
        f.write(NODE_SCRIPT)
    sftp.close()

    _, stdout, stderr = client.exec_command(
        "cd /opt/enterra-site && node post-news-run.cjs",
        timeout=60,
    )
    out = stdout.read().decode("utf-8", "replace").strip()
    err = stderr.read().decode("utf-8", "replace").strip()
    client.close()

    print(out)
    if err:
        print(err, file=sys.stderr)

    return 0 if '"ok": true' in out or '"ok":true' in out else 1


if __name__ == "__main__":
    sys.exit(main())
