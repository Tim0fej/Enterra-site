import { Router } from 'express';
import { db } from '../db.js';
import { fetchMcOnline } from '../lib/mcstatus.js';
import { normalizeMediaPlatform, resolveDisplayGroup } from '../../shared/displayGroup.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const mc = await fetchMcOnline();
    const onlineSet = new Set(mc.playerNames);

    const rows = db
      .prepare(`
      SELECT
        u.id,
        u.username,
        u.role,
        u.code_verified_at,
        u.created_at,
        pt.slug as privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      ORDER BY
        CASE WHEN u.code_verified_at IS NOT NULL THEN 0 ELSE 1 END,
        u.username COLLATE NOCASE
    `)
      .all() as Array<{
        id: number;
        username: string;
        role: string;
        code_verified_at: string | null;
        created_at: string;
        privilege_slug: string | null;
        media_platform: string | null;
      }>;

    const players = rows.map((u) => ({
      id: u.id,
      username: u.username,
      registeredAt: u.created_at,
      verified: Boolean(u.code_verified_at),
      online: onlineSet.has(u.username.toLowerCase()),
      isStaff: u.role === 'admin' || u.role === 'moderator',
      staffRole: u.role === 'admin' || u.role === 'moderator' ? u.role : null,
      role: u.role,
      privilegeSlug: u.privilege_slug,
      mediaPlatform: normalizeMediaPlatform(u.media_platform),
      displayGroup: resolveDisplayGroup(u.role, u.privilege_slug, u.media_platform),
    }));

    res.json({
      server: {
        online: mc.online,
        playersOnline: mc.playersOnline,
        playersMax: mc.playersMax,
      },
      total: players.length,
      verifiedCount: players.filter((p) => p.verified).length,
      onlineCount: players.filter((p) => p.online).length,
      players,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
