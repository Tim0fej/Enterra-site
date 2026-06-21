import Database from 'better-sqlite3';
import { DB_PATH } from './paths.js';

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      access_code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin', 'moderator')),
      code_verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'closed')),
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_staff INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS privilege_tiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#00c8ff',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_privileges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      tier_id INTEGER NOT NULL REFERENCES privilege_tiers(id) ON DELETE CASCADE,
      granted_by INTEGER NOT NULL REFERENCES users(id),
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      note TEXT
    );
  `);

  migrateUserRoles();
  migrateTicketSchema();
  migrateMediaPlatform();
  migrateAttachments();
  migrateVipSlug();
  syncPrivilegeTiers();
  migrateMediaSlugs();

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM forum_categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const insert = db.prepare('INSERT INTO forum_categories (name, description, slug) VALUES (?, ?, ?)');
    insert.run('Новости', 'Объявления и обновления сервера', 'news');
    insert.run('Общение', 'Обсуждения, вопросы и знакомства', 'general');
    insert.run('Постройки', 'Скриншоты и проекты игроков', 'builds');
    insert.run('Баги и идеи', 'Сообщения об ошибках и предложения', 'bugs');
  }
}

export function generateAccessCode(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateUniqueAccessCode(): string {
  let code = generateAccessCode();
  while (db.prepare('SELECT id FROM users WHERE access_code = ?').get(code)) {
    code = generateAccessCode();
  }
  return code;
}

export function userHasSupporterPrivilege(userId: number): boolean {
  const row = db.prepare('SELECT 1 AS ok FROM user_privileges WHERE user_id = ?').get(userId) as
    | { ok: number }
    | undefined;
  return Boolean(row);
}

function migrateMediaPlatform() {
  const privCols = db.prepare('PRAGMA table_info(user_privileges)').all() as { name: string }[];
  if (!privCols.some((column) => column.name === 'media_platform')) {
    db.exec('ALTER TABLE user_privileges ADD COLUMN media_platform TEXT');
  }
}

function migrateAttachments() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stored_name TEXT NOT NULL UNIQUE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_message_id INTEGER REFERENCES ticket_messages(id) ON DELETE CASCADE,
      forum_post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function migrateVipSlug() {
  const legendTier = db.prepare("SELECT id FROM privilege_tiers WHERE slug = 'legend'").get() as
    | { id: number }
    | undefined;
  const vipTier = db.prepare("SELECT id FROM privilege_tiers WHERE slug = 'vip'").get() as
    | { id: number }
    | undefined;

  if (legendTier && vipTier) {
    db.prepare('UPDATE user_privileges SET tier_id = ? WHERE tier_id = ?').run(vipTier.id, legendTier.id);
    db.prepare('DELETE FROM privilege_tiers WHERE id = ?').run(legendTier.id);
  } else if (legendTier && !vipTier) {
    db.prepare("UPDATE privilege_tiers SET slug = 'vip', name = 'Vip' WHERE id = ?").run(legendTier.id);
  }
}

function migrateMediaSlugs() {
  const mediaTier = db.prepare("SELECT id FROM privilege_tiers WHERE slug = 'media'").get() as
    | { id: number }
    | undefined;

  if (!mediaTier) {
    return;
  }

  const platformTierIds = new Map<string, number>();
  for (const slug of ['youtube', 'twitch', 'tiktok'] as const) {
    const tier = db.prepare('SELECT id FROM privilege_tiers WHERE slug = ?').get(slug) as
      | { id: number }
      | undefined;
    if (tier) {
      platformTierIds.set(slug, tier.id);
    }
  }

  const legacyRows = db
    .prepare(`
      SELECT up.id, up.media_platform
      FROM user_privileges up
      WHERE up.tier_id = ?
    `)
    .all(mediaTier.id) as { id: number; media_platform: string | null }[];

  for (const row of legacyRows) {
    const platform = row.media_platform?.toLowerCase();
    const targetSlug =
      platform === 'twitch' ? 'twitch' : platform === 'tiktok' ? 'tiktok' : 'youtube';
    const targetTierId = platformTierIds.get(targetSlug);
    if (!targetTierId) {
      continue;
    }

    db.prepare(`
      UPDATE user_privileges
      SET tier_id = ?, media_platform = ?
      WHERE id = ?
    `).run(targetTierId, targetSlug, row.id);
  }

  db.prepare('DELETE FROM privilege_tiers WHERE id = ?').run(mediaTier.id);
}

function syncPrivilegeTiers() {
  const vipTier = db.prepare("SELECT id FROM privilege_tiers WHERE slug = 'vip'").get() as
    | { id: number }
    | undefined;

  const legacyTiers = db
    .prepare("SELECT id FROM privilege_tiers WHERE slug IN ('premium', 'sponsor', 'legend')")
    .all() as { id: number }[];

  if (vipTier && legacyTiers.length > 0) {
    for (const legacy of legacyTiers) {
      db.prepare('UPDATE user_privileges SET tier_id = ? WHERE tier_id = ?').run(vipTier.id, legacy.id);
      db.prepare('DELETE FROM privilege_tiers WHERE id = ?').run(legacy.id);
    }
  }

  const upsert = db.prepare(`
    INSERT INTO privilege_tiers (slug, name, description, color, sort_order)
    VALUES (@slug, @name, @description, @color, @sort_order)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      color = excluded.color,
      sort_order = excluded.sort_order
  `);

  upsert.run({
    slug: 'vip',
    name: 'Vip',
    description: 'Поддержка сервера — префикс Vip и полный набор игровых возможностей',
    color: '#00c8ff',
    sort_order: 1,
  });
  upsert.run({
    slug: 'youtube',
    name: 'YouTube',
    description: 'Для ютуберов — от 5 000 подписчиков и 1 000–2 000 просмотров на видео. По заявке.',
    color: '#ff0000',
    sort_order: 2,
  });
  upsert.run({
    slug: 'twitch',
    name: 'Twitch',
    description: 'Для стримеров — от 5 000 подписчиков и 1 000–2 000 просмотров на видео. По заявке.',
    color: '#9146ff',
    sort_order: 3,
  });
  upsert.run({
    slug: 'tiktok',
    name: 'TikTok',
    description: 'Для авторов TikTok — от 5 000 подписчиков и 1 000–2 000 просмотров. По заявке.',
    color: '#00f2ea',
    sort_order: 4,
  });

  db.prepare(`
    UPDATE privilege_tiers SET
      price_rub = 99,
      billing_period = 'month',
      purchasable = 1
    WHERE slug = 'vip'
  `).run();
  db.prepare(`
    UPDATE privilege_tiers SET
      price_rub = NULL,
      billing_period = NULL,
      purchasable = 0
    WHERE slug IN ('youtube', 'twitch', 'tiktok')
  `).run();
}

function migrateTicketSchema() {
  const ticketCols = db.prepare('PRAGMA table_info(tickets)').all() as { name: string }[];
  if (!ticketCols.some((column) => column.name === 'type')) {
    db.exec("ALTER TABLE tickets ADD COLUMN type TEXT NOT NULL DEFAULT 'general'");
  }

  const tierCols = db.prepare('PRAGMA table_info(privilege_tiers)').all() as { name: string }[];
  if (!tierCols.some((column) => column.name === 'price_rub')) {
    db.exec('ALTER TABLE privilege_tiers ADD COLUMN price_rub INTEGER');
  }
  if (!tierCols.some((column) => column.name === 'billing_period')) {
    db.exec('ALTER TABLE privilege_tiers ADD COLUMN billing_period TEXT');
  }
  if (!tierCols.some((column) => column.name === 'purchasable')) {
    db.exec('ALTER TABLE privilege_tiers ADD COLUMN purchasable INTEGER NOT NULL DEFAULT 0');
  }
}

function migrateUserRoles() {
  const table = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get() as
    | { sql: string }
    | undefined;

  if (!table?.sql || table.sql.includes("'moderator'")) {
    return;
  }

  db.exec(`
    PRAGMA foreign_keys=OFF;
    CREATE TABLE users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      access_code TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin', 'moderator')),
      code_verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users_new SELECT * FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    PRAGMA foreign_keys=ON;
  `);
}
