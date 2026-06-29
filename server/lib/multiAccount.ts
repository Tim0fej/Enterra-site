import { db } from '../db.js';
import { normalizeIp } from './clientIp.js';

export const BAN_BYPASS_BLOCK_MESSAGE =
  'С этого IP играл забаненный аккаунт. Создание нового аккаунта для обхода бана запрещено.';

/** @deprecated use BAN_BYPASS_BLOCK_MESSAGE */
export const MULTI_ACCOUNT_BLOCK_MESSAGE = BAN_BYPASS_BLOCK_MESSAGE;

function isEnabled(): boolean {
  const flag = process.env.MULTI_ACCOUNT_PROTECTION ?? process.env.BAN_BYPASS_IP_PROTECTION;
  if (flag === '0' || flag === 'false') return false;
  return true;
}

function isBypassedIp(ip: string): boolean {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) return ip === '127.0.0.1' || ip === '::1';
  return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
}

/** Активно забаненные аккаунты, связанные с IP (для защиты от обхода бана). */
export function findBannedUsersOnIp(
  ip: string | null | undefined,
  excludeUserId?: number,
): Array<{ id: number; username: string }> {
  const normalized = normalizeIp(ip);
  if (!normalized || !isEnabled() || isBypassedIp(normalized)) {
    return [];
  }

  return db
    .prepare(
      `
      SELECT DISTINCT u.id, u.username
      FROM users u
      INNER JOIN mc_punishments p
        ON p.target_username = u.username COLLATE NOCASE
       AND p.type = 'ban'
       AND p.active = 1
      WHERE u.role = 'user'
        AND (? IS NULL OR u.id != ?)
        AND (
          u.registration_ip = ?
          OR u.last_web_ip = ?
          OR u.last_mc_ip = ?
        )
      ORDER BY u.created_at ASC
    `,
    )
    .all(excludeUserId ?? null, excludeUserId ?? null, normalized, normalized, normalized) as Array<{
      id: number;
      username: string;
    }>;
}

export function assertNoBanBypass(
  ip: string | null | undefined,
  excludeUserId?: number,
): { ok: true } | { ok: false; message: string } {
  const bannedOnIp = findBannedUsersOnIp(ip, excludeUserId);
  if (bannedOnIp.length === 0) {
    return { ok: true };
  }
  return { ok: false, message: BAN_BYPASS_BLOCK_MESSAGE };
}

/** @deprecated use assertNoBanBypass */
export function assertNoMultiAccount(
  ip: string | null | undefined,
  excludeUserId?: number,
): { ok: true } | { ok: false; message: string } {
  return assertNoBanBypass(ip, excludeUserId);
}

export function recordRegistrationIp(userId: number, ip: string | null | undefined): void {
  const normalized = normalizeIp(ip);
  if (!normalized) return;
  db.prepare('UPDATE users SET registration_ip = ? WHERE id = ?').run(normalized, userId);
}

export function recordWebIp(userId: number, ip: string | null | undefined): void {
  const normalized = normalizeIp(ip);
  if (!normalized) return;
  db.prepare(`
    UPDATE users
    SET last_web_ip = ?, last_web_at = datetime('now')
    WHERE id = ?
  `).run(normalized, userId);
}

export function recordMcIp(userId: number, ip: string | null | undefined): void {
  const normalized = normalizeIp(ip);
  if (!normalized) return;
  db.prepare(`
    UPDATE users
    SET
      last_mc_ip = ?,
      last_mc_at = datetime('now'),
      registration_ip = COALESCE(registration_ip, ?)
    WHERE id = ?
  `).run(normalized, normalized, userId);
}

export function markMcOnline(
  userId: number,
  username: string,
  ip: string | null | undefined,
): { ok: true } {
  const normalized = normalizeIp(ip);
  if (!normalized) {
    return { ok: true };
  }

  db.prepare(`
    INSERT INTO mc_online_sessions (user_id, username, ip, since)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      username = excluded.username,
      ip = excluded.ip,
      since = datetime('now')
  `).run(userId, username, normalized);

  return { ok: true };
}

export function markMcOffline(userId: number): void {
  db.prepare('DELETE FROM mc_online_sessions WHERE user_id = ?').run(userId);
}
