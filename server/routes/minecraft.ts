import { Router } from 'express';
import { db } from '../db.js';
import { fetchMcOnline } from '../lib/mcstatus.js';
import {
  buildPublicServerStatus,
  canBypassMaintenanceLockdown,
  getMaintenanceLockdownMessage,
  getServerDisplaySettings,
  isMaintenanceLockdown,
} from '../lib/serverDisplayStatus.js';
import {
  ensureAccessCodeFresh,
  isAccessCodeActive,
  markAccessCodeVerified,
} from '../lib/accessCode.js';
import { ACTIVE_PRIVILEGE_SQL } from '../lib/grantPrivilege.js';
import { resolveDisplayGroup, resolveLuckPermsGroup, normalizeMediaPlatform } from '../../shared/displayGroup.js';
import { normalizeIp } from '../lib/clientIp.js';
import {
  assertNoBanBypass,
  markMcOffline,
  markMcOnline,
  recordMcIp,
} from '../lib/multiAccount.js';
import {
  completeModerationAction,
  listPendingModerationActions,
  syncPunishmentsFromServer,
  type PunishmentSyncItem,
} from '../lib/moderation.js';
import { getUserNameColor, userCanCustomizeNameColor } from '../lib/nameColor.js';
import { requireMinecraftApiKey } from '../lib/minecraftAuth.js';

const router = Router();

router.get('/status', async (_req, res) => {
  try {
    const mc = await fetchMcOnline();
    const settings = getServerDisplaySettings();
    const status = buildPublicServerStatus(mc, settings);
    res.json(status);
  } catch {
    res.status(503).json({ error: 'Статус сервера недоступен' });
  }
});

router.use(requireMinecraftApiKey);

router.post('/verify', (req, res) => {
  const { username, code } = req.body as { username?: string; code?: string };

  if (!username?.trim() || !code?.trim()) {
    res.status(400).json({ valid: false, error: 'username and code required' });
    return;
  }

  const user = db
    .prepare(
      'SELECT id, access_code, code_verified_at, code_expires_at FROM users WHERE username = ? COLLATE NOCASE',
    )
    .get(username.trim()) as
    | {
        id: number;
        access_code: string;
        code_verified_at: string | null;
        code_expires_at: string | null;
      }
    | undefined;

  if (!user) {
    res.status(401).json({ valid: false, error: 'Invalid code' });
    return;
  }

  ensureAccessCodeFresh(user.id);

  const fresh = db
    .prepare(
      'SELECT id, access_code, code_verified_at, code_expires_at FROM users WHERE id = ?',
    )
    .get(user.id) as {
      id: number;
      access_code: string;
      code_verified_at: string | null;
      code_expires_at: string | null;
    };

  if (fresh.access_code !== code.trim()) {
    res.status(401).json({ valid: false, error: 'Invalid code' });
    return;
  }

  if (!isAccessCodeActive(fresh)) {
    markAccessCodeVerified(fresh.id);
  }

  res.json({ valid: true, username: username.trim() });
});

router.get('/check/:username', (req, res) => {
  const ip = normalizeIp(typeof req.query.ip === 'string' ? req.query.ip : undefined);

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(req.params.username) as { id: number } | undefined;

  if (existing) {
    ensureAccessCodeFresh(existing.id);
  }

  const user = db
    .prepare(`
      SELECT
        u.id,
        u.role,
        u.code_verified_at,
        u.code_expires_at,
        pt.slug AS privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id AND ${ACTIVE_PRIVILEGE_SQL}
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE u.username = ? COLLATE NOCASE
    `)
    .get(req.params.username) as
    | {
        id: number;
        role: string;
        code_verified_at: string | null;
        code_expires_at: string | null;
        privilege_slug: string | null;
        media_platform: string | null;
      }
    | undefined;

  const settings = getServerDisplaySettings();
  const maintenanceBlocked =
    settings.mode === 'maintenance' && !canBypassMaintenanceLockdown(user?.role);

  let multiAccountBlocked = false;

  if (user && user.role === 'user' && ip && !maintenanceBlocked) {
    const ipCheck = assertNoBanBypass(ip, user.id);
    if (!ipCheck.ok) {
      multiAccountBlocked = true;
    }
  }

  res.json({
    registered: Boolean(user),
    verified: user ? isAccessCodeActive(user) : false,
    maintenanceBlocked,
    maintenanceMessage: maintenanceBlocked ? getMaintenanceLockdownMessage(settings) : null,
    multiAccountBlocked,
    multiAccountOnline: false,
    role: user?.role ?? null,
    privilegeSlug: user?.privilege_slug ?? null,
    mediaPlatform: user ? normalizeMediaPlatform(user.media_platform) : null,
    displayGroup: user
      ? resolveDisplayGroup(user.role, user.privilege_slug, user.media_platform)
      : null,
    luckPermsGroup: user
      ? resolveLuckPermsGroup(user.role, user.privilege_slug, user.media_platform)
      : null,
    nameColor: user && userCanCustomizeNameColor(user.id) ? getUserNameColor(user.id) : null,
    nameColorAllowed: user ? userCanCustomizeNameColor(user.id) : false,
  });
});

router.post('/presence', (req, res) => {
  const { username, ip, online } = req.body as {
    username?: string;
    ip?: string;
    online?: boolean;
  };

  if (!username?.trim()) {
    res.status(400).json({ error: 'username required' });
    return;
  }

  const user = db
    .prepare('SELECT id, role FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as { id: number; role: string } | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (online && isMaintenanceLockdown() && !canBypassMaintenanceLockdown(user.role)) {
    res.status(403).json({
      error: 'maintenance',
      message: getMaintenanceLockdownMessage(),
    });
    return;
  }

  if (online) {
    const normalizedIp = normalizeIp(ip);
    recordMcIp(user.id, normalizedIp);

    if (user.role === 'user') {
      const ipCheck = assertNoBanBypass(normalizedIp, user.id);
      if (!ipCheck.ok) {
        res.status(403).json({ error: 'ban_bypass', message: ipCheck.message });
        return;
      }

      markMcOnline(user.id, username.trim(), normalizedIp);
    } else {
      markMcOnline(user.id, username.trim(), normalizeIp(ip));
    }
  } else {
    markMcOffline(user.id);
  }

  res.json({ ok: true });
});

router.get('/privilege/:username', (req, res) => {
  const row = db
    .prepare(`
      SELECT pt.slug, pt.name
      FROM users u
      JOIN user_privileges up ON up.user_id = u.id AND ${ACTIVE_PRIVILEGE_SQL}
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE u.username = ? COLLATE NOCASE
    `)
    .get(req.params.username) as { slug: string; name: string } | undefined;

  res.json({
    hasPrivilege: Boolean(row),
    slug: row?.slug ?? null,
    name: row?.name ?? null,
  });
});

router.get('/mod-queue', (_req, res) => {
  const actions = listPendingModerationActions(20).map((row) => ({
    id: row.id,
    action: row.action,
    targetUsername: row.target_username,
    command: row.command,
  }));

  res.json({ actions });
});

router.post('/mod-queue/:id/ack', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  const { ok, error } = req.body as { ok?: boolean; error?: string };
  const success = completeModerationAction(id, ok !== false, error ?? null);
  if (!success) {
    res.status(404).json({ error: 'Action not found or already processed' });
    return;
  }

  res.json({ ok: true });
});

router.post('/punishments/sync', (req, res) => {
  const { punishments } = req.body as { punishments?: PunishmentSyncItem[] };
  if (!Array.isArray(punishments)) {
    res.status(400).json({ error: 'punishments array required' });
    return;
  }

  const normalized: PunishmentSyncItem[] = [];
  for (const item of punishments) {
    const litebansId = Number(item.litebansId);
    if (!Number.isFinite(litebansId) || litebansId <= 0) continue;
    if (!item.type || !['ban', 'mute', 'warn'].includes(item.type)) continue;
    if (!item.targetUsername?.trim()) continue;

    normalized.push({
      litebansId,
      type: item.type,
      targetUsername: item.targetUsername.trim(),
      targetUuid: item.targetUuid ?? null,
      reason: item.reason ?? null,
      staffName: item.staffName ?? null,
      expiresAt: item.expiresAt ?? null,
    });
  }

  syncPunishmentsFromServer(normalized);
  res.json({ ok: true, count: normalized.length });
});

export default router;
