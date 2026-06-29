import { Router } from 'express';
import { db } from '../db.js';
import { fetchMcOnline } from '../lib/mcstatus.js';
import { ensureAllExpiredAccessCodesRotated, isAccessCodeActive } from '../lib/accessCode.js';
import { ACTIVE_PRIVILEGE_SQL } from '../lib/grantPrivilege.js';
import { normalizeMediaPlatform, resolveDisplayGroup } from '../../shared/displayGroup.js';
import { sqlExcludeSystemAccount } from '../../shared/systemAccount.js';
import { optionalAuth, type AuthRequest } from '../auth.js';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    ensureAllExpiredAccessCodesRotated();

    const mc = await fetchMcOnline();
    const onlineSet = new Set(mc.playerNames);

    const rows = db
      .prepare(`
      SELECT
        u.username,
        u.role,
        u.code_verified_at,
        u.code_expires_at,
        u.created_at,
        pt.slug as privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id AND ${ACTIVE_PRIVILEGE_SQL}
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE ${sqlExcludeSystemAccount('u')}
      ORDER BY
        CASE WHEN u.code_verified_at IS NOT NULL AND datetime(u.code_expires_at) > datetime('now') THEN 0 ELSE 1 END,
        u.username COLLATE NOCASE
    `)
      .all() as Array<{
        username: string;
        role: string;
        code_verified_at: string | null;
        code_expires_at: string | null;
        created_at: string;
        privilege_slug: string | null;
        media_platform: string | null;
      }>;

    const visibleRows = req.user
      ? rows
      : rows.filter(
          (user) =>
            onlineSet.has(user.username.toLowerCase()) || isAccessCodeActive(user),
        );

    const players = visibleRows.map((user) => ({
      username: user.username,
      registeredAt: user.created_at,
      verified: isAccessCodeActive(user),
      online: onlineSet.has(user.username.toLowerCase()),
      isStaff: user.role === 'admin' || user.role === 'moderator',
      staffRole: user.role === 'admin' || user.role === 'moderator' ? user.role : null,
      role: user.role,
      privilegeSlug: user.privilege_slug,
      mediaPlatform: normalizeMediaPlatform(user.media_platform),
      displayGroup: resolveDisplayGroup(user.role, user.privilege_slug, user.media_platform),
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
