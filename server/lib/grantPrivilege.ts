import { db } from '../db.js';
import { isMediaPrivilegeSlug, normalizeMediaPlatform, type MediaPlatform } from '../../shared/displayGroup.js';
import { isVipPlanMonths, VIP_SLUG } from '../../shared/vipPlans.js';

export interface GrantedPrivilege {
  slug: string;
  name: string;
  color: string;
  mediaPlatform: MediaPlatform | null;
  expiresAt: string | null;
}

export const ACTIVE_PRIVILEGE_SQL = `
  (up.expires_at IS NULL OR datetime(up.expires_at) > datetime('now'))
`;

export function purgeExpiredPrivilege(userId: number): void {
  db.prepare(`
    DELETE FROM user_privileges
    WHERE user_id = ?
      AND expires_at IS NOT NULL
      AND datetime(expires_at) <= datetime('now')
  `).run(userId);
}

function computeVipExpiresAt(userId: number, months: number): string {
  const row = db
    .prepare(`
      SELECT up.expires_at, pt.slug
      FROM user_privileges up
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE up.user_id = ?
    `)
    .get(userId) as { expires_at: string | null; slug: string } | undefined;

  let baseExpr = "datetime('now')";
  if (row?.slug === VIP_SLUG && row.expires_at) {
    const stillValid = db
      .prepare(`SELECT 1 AS ok WHERE datetime(?) > datetime('now')`)
      .get(row.expires_at) as { ok: number } | undefined;
    if (stillValid) {
      baseExpr = `'${row.expires_at.replace(/'/g, "''")}'`;
    }
  }

  const result = db
    .prepare(`SELECT datetime(${baseExpr}, '+${months} months') AS expires_at`)
    .get() as { expires_at: string };

  return result.expires_at;
}

export function grantUserPrivilege(
  userId: number,
  tierSlug: string,
  grantedById: number,
  note?: string,
  mediaPlatform?: string | null,
  options?: { months?: number | null },
): GrantedPrivilege {
  purgeExpiredPrivilege(userId);

  const tier = db
    .prepare('SELECT id, slug, name, color FROM privilege_tiers WHERE slug = ?')
    .get(tierSlug) as { id: number; slug: string; name: string; color: string } | undefined;

  if (!tier) {
    throw new Error('Привилегия не найдена');
  }

  const platform = isMediaPrivilegeSlug(tier.slug)
    ? tier.slug
    : normalizeMediaPlatform(mediaPlatform);

  const months = options?.months ?? null;
  let expiresAt: string | null = null;

  if (tier.slug === VIP_SLUG) {
    if (!isVipPlanMonths(months)) {
      throw new Error('Для VIP укажите срок: 1, 3 или 6 месяцев');
    }
    expiresAt = computeVipExpiresAt(userId, months);
  }

  db.prepare(`
    INSERT INTO user_privileges (user_id, tier_id, granted_by, note, media_platform, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tier_id = excluded.tier_id,
      granted_by = excluded.granted_by,
      granted_at = datetime('now'),
      note = excluded.note,
      media_platform = excluded.media_platform,
      expires_at = excluded.expires_at
  `).run(userId, tier.id, grantedById, note?.trim() || null, platform, expiresAt);

  return { slug: tier.slug, name: tier.name, color: tier.color, mediaPlatform: platform, expiresAt };
}

export function getUserPrivilege(userId: number): GrantedPrivilege | null {
  purgeExpiredPrivilege(userId);

  const row = db
    .prepare(`
      SELECT pt.slug, pt.name, pt.color, up.media_platform, up.expires_at
      FROM user_privileges up
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE up.user_id = ?
        AND ${ACTIVE_PRIVILEGE_SQL}
    `)
    .get(userId) as
    | { slug: string; name: string; color: string; media_platform: string | null; expires_at: string | null }
    | undefined;

  if (!row) return null;

  const platform = isMediaPrivilegeSlug(row.slug)
    ? row.slug
    : normalizeMediaPlatform(row.media_platform);

  return {
    slug: row.slug,
    name: row.name,
    color: row.color,
    mediaPlatform: platform,
    expiresAt: row.expires_at,
  };
}
