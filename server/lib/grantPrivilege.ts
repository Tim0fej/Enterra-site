import { db } from '../db.js';
import { isMediaPrivilegeSlug, normalizeMediaPlatform, type MediaPlatform } from '../../shared/displayGroup.js';

export interface GrantedPrivilege {
  slug: string;
  name: string;
  color: string;
  mediaPlatform: MediaPlatform | null;
}

export function grantUserPrivilege(
  userId: number,
  tierSlug: string,
  grantedById: number,
  note?: string,
  mediaPlatform?: string | null,
): GrantedPrivilege {
  const tier = db
    .prepare('SELECT id, slug, name, color FROM privilege_tiers WHERE slug = ?')
    .get(tierSlug) as { id: number; slug: string; name: string; color: string } | undefined;

  if (!tier) {
    throw new Error('Привилегия не найдена');
  }

  const platform = isMediaPrivilegeSlug(tier.slug)
    ? tier.slug
    : normalizeMediaPlatform(mediaPlatform);

  db.prepare(`
    INSERT INTO user_privileges (user_id, tier_id, granted_by, note, media_platform)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      tier_id = excluded.tier_id,
      granted_by = excluded.granted_by,
      granted_at = datetime('now'),
      note = excluded.note,
      media_platform = excluded.media_platform
  `).run(userId, tier.id, grantedById, note?.trim() || null, platform);

  return { slug: tier.slug, name: tier.name, color: tier.color, mediaPlatform: platform };
}

export function getUserPrivilege(userId: number): GrantedPrivilege | null {
  const row = db
    .prepare(`
      SELECT pt.slug, pt.name, pt.color, up.media_platform
      FROM user_privileges up
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE up.user_id = ?
    `)
    .get(userId) as
    | { slug: string; name: string; color: string; media_platform: string | null }
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
  };
}
