import Database from 'better-sqlite3';
import crypto from 'crypto';
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
  migrateSystemAccount();
  migrateMediaPlatform();
  migrateAttachments();
  migrateVipSlug();
  syncPrivilegeTiers();
  migrateMediaSlugs();
  migrateEmailVerification();
  migrateEmailCodePurposes();
  migrateCodeExpiry();
  migrateMultiAccount();
  migrateVipPayments();
  migrateEasyDonatePayments();
  migrateVipExpiry();
  migrateUserSecurity();
  migrateSiteSettings();
  migrateModeration();
  migrateShopFeed();
  migrateDonationAlertsSettings();
  migrateNameColor();
  migrateEasyDonateProductMeta();
  migrateWebSessions();

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
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i]! % chars.length];
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
    db.prepare("UPDATE privilege_tiers SET slug = 'vip', name = 'VIP' WHERE id = ?").run(legendTier.id);
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
    name: 'VIP',
    description: 'Поддержка сервера — префикс VIP и полный набор игровых возможностей',
    color: '#00c8ff',
    sort_order: 1,
  });
  upsert.run({
    slug: 'youtube',
    name: 'YouTube',
    description: 'Для ютуберов — три уровня: от 1 000 подписчиков и 400 просмотров. По заявке.',
    color: '#ff0000',
    sort_order: 2,
  });
  upsert.run({
    slug: 'twitch',
    name: 'Twitch',
    description: 'Для стримеров Twitch — три уровня: от 500 фолловеров и 20 avg viewers. По заявке.',
    color: '#9146ff',
    sort_order: 3,
  });
  upsert.run({
    slug: 'tiktok',
    name: 'TikTok',
    description: 'Для авторов TikTok — три уровня: от 1 000 подписчиков и 2 000 просмотров. По заявке.',
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
  if (!ticketCols.some((column) => column.name === 'assigned_to')) {
    db.exec('ALTER TABLE tickets ADD COLUMN assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL');
  }
  if (!ticketCols.some((column) => column.name === 'is_guest')) {
    db.exec('ALTER TABLE tickets ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 0');
  }
  if (!ticketCols.some((column) => column.name === 'guest_token')) {
    db.exec('ALTER TABLE tickets ADD COLUMN guest_token TEXT');
  }
  if (!ticketCols.some((column) => column.name === 'guest_email')) {
    db.exec('ALTER TABLE tickets ADD COLUMN guest_email TEXT');
  }
  if (!ticketCols.some((column) => column.name === 'guest_name')) {
    db.exec('ALTER TABLE tickets ADD COLUMN guest_name TEXT');
  }
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_guest_token ON tickets(guest_token) WHERE guest_token IS NOT NULL');

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

function migrateSystemAccount() {
  db.prepare(`
    UPDATE tickets SET assigned_to = NULL
    WHERE assigned_to IN (
      SELECT id FROM users
      WHERE LOWER(email) = 'admin@enterra.local' OR LOWER(username) = 'admin'
    )
  `).run();
}

function migrateEmailVerification() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      purpose TEXT NOT NULL CHECK(purpose IN ('register', 'change_email')),
      code_hash TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes(email, purpose);
  `);

  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((column) => column.name === 'email_verified_at')) {
    db.exec('ALTER TABLE users ADD COLUMN email_verified_at TEXT');
  }
}

function migrateCodeExpiry() {
  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((column) => column.name === 'code_expires_at')) {
    db.exec('ALTER TABLE users ADD COLUMN code_expires_at TEXT');
    db.exec(`
      UPDATE users
      SET code_expires_at = datetime(COALESCE(code_verified_at, created_at), '+7 days')
      WHERE code_expires_at IS NULL
    `);
  }
}

function migrateMultiAccount() {
  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((column) => column.name === 'registration_ip')) {
    db.exec('ALTER TABLE users ADD COLUMN registration_ip TEXT');
  }
  if (!userCols.some((column) => column.name === 'last_web_ip')) {
    db.exec('ALTER TABLE users ADD COLUMN last_web_ip TEXT');
  }
  if (!userCols.some((column) => column.name === 'last_web_at')) {
    db.exec('ALTER TABLE users ADD COLUMN last_web_at TEXT');
  }
  if (!userCols.some((column) => column.name === 'last_mc_ip')) {
    db.exec('ALTER TABLE users ADD COLUMN last_mc_ip TEXT');
  }
  if (!userCols.some((column) => column.name === 'last_mc_at')) {
    db.exec('ALTER TABLE users ADD COLUMN last_mc_at TEXT');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS mc_online_sessions (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      username TEXT NOT NULL,
      ip TEXT NOT NULL,
      since TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mc_online_sessions_ip ON mc_online_sessions(ip);
    CREATE INDEX IF NOT EXISTS idx_users_registration_ip ON users(registration_ip);
    CREATE INDEX IF NOT EXISTS idx_users_last_mc_ip ON users(last_mc_ip);
  `);
}

function migrateEmailCodePurposes() {
  const table = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='email_verification_codes'")
    .get() as { sql: string } | undefined;

  if (!table?.sql || table.sql.includes('verify_email') || !table.sql.includes('CHECK')) {
    return;
  }

  db.exec(`
    CREATE TABLE email_verification_codes_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL COLLATE NOCASE,
      purpose TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO email_verification_codes_new SELECT * FROM email_verification_codes;
    DROP TABLE email_verification_codes;
    ALTER TABLE email_verification_codes_new RENAME TO email_verification_codes;
    CREATE INDEX IF NOT EXISTS idx_email_codes_lookup ON email_verification_codes(email, purpose);
  `);
}

function migrateUserSecurity() {
  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((column) => column.name === 'token_version')) {
    db.exec('ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0');
  }
}

function migrateWebSessions() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ip TEXT,
      user_agent TEXT NOT NULL DEFAULT '',
      device_label TEXT NOT NULL DEFAULT 'Неизвестное устройство',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_web_sessions_user ON web_sessions(user_id);
  `);
}

function migrateSiteSettings() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

function migrateVipExpiry() {
  const privCols = db.prepare('PRAGMA table_info(user_privileges)').all() as { name: string }[];
  if (!privCols.some((column) => column.name === 'expires_at')) {
    db.exec('ALTER TABLE user_privileges ADD COLUMN expires_at TEXT');
  }

  const payCols = db.prepare('PRAGMA table_info(vip_payments)').all() as { name: string }[];
  if (!payCols.some((column) => column.name === 'months')) {
    db.exec('ALTER TABLE vip_payments ADD COLUMN months INTEGER NOT NULL DEFAULT 1');
  }
}

function migrateEasyDonatePayments() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS easydonate_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      easydonate_payment_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer TEXT NOT NULL,
      amount_rub REAL NOT NULL DEFAULT 0,
      months INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_easydonate_payments_user ON easydonate_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_easydonate_payments_status ON easydonate_payments(status);
  `);
}

function migrateVipPayments() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vip_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier_slug TEXT NOT NULL,
      amount_rub INTEGER NOT NULL,
      yookassa_payment_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'waiting_for_capture', 'succeeded', 'canceled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vip_payments_user ON vip_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_vip_payments_status ON vip_payments(status);
  `);
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

function migrateModeration() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS moderation_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL CHECK(action IN ('ban', 'unban', 'mute', 'unmute', 'warn', 'unwarn', 'kick')),
      target_username TEXT NOT NULL COLLATE NOCASE,
      duration TEXT,
      reason TEXT NOT NULL DEFAULT '',
      staff_user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'done', 'failed')),
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      processed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status, id);

    CREATE TABLE IF NOT EXISTS mc_punishments (
      litebans_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('ban', 'mute', 'warn')),
      target_username TEXT NOT NULL COLLATE NOCASE,
      target_uuid TEXT,
      reason TEXT,
      staff_name TEXT,
      expires_at TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      synced_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (type, litebans_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mc_punishments_active ON mc_punishments(active, type, target_username);
  `);
}

function migrateDonationAlertsSettings() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS donation_alerts_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      client_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      expires_at TEXT,
      updated_at TEXT
    );
  `);
}

function migrateShopFeed() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_feed_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('purchase', 'donation')),
      username TEXT NOT NULL COLLATE NOCASE,
      label TEXT NOT NULL,
      amount_rub REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source, external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_shop_feed_created ON shop_feed_events(created_at DESC);
  `);
}

function migrateNameColor() {
  const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
  if (!userCols.some((column) => column.name === 'name_color')) {
    db.exec('ALTER TABLE users ADD COLUMN name_color TEXT');
  }
}

function migrateEasyDonateProductMeta() {
  const cols = db.prepare('PRAGMA table_info(easydonate_payments)').all() as { name: string }[];
  if (!cols.some((column) => column.name === 'product_id')) {
    db.exec('ALTER TABLE easydonate_payments ADD COLUMN product_id INTEGER');
  }
  if (!cols.some((column) => column.name === 'product_kind')) {
    db.exec('ALTER TABLE easydonate_payments ADD COLUMN product_kind TEXT');
  }
}
