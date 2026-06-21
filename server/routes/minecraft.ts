import { Router } from 'express';
import { db } from '../db.js';
import { fetchMcOnline } from '../lib/mcstatus.js';
import { resolveDisplayGroup, resolveLuckPermsGroup, normalizeMediaPlatform } from '../../shared/displayGroup.js';

const router = Router();

const MINECRAFT_API_KEY = process.env.MINECRAFT_API_KEY ?? 'enterra-plugin-key';

router.get('/status', async (_req, res) => {
  try {
    const mc = await fetchMcOnline();
    res.json({
      online: mc.online,
      playersOnline: mc.playersOnline,
      playersMax: mc.playersMax,
    });
  } catch {
    res.status(503).json({ error: 'Статус сервера недоступен' });
  }
});

router.post('/verify', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MINECRAFT_API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const { username, code } = req.body as { username?: string; code?: string };

  if (!username?.trim() || !code?.trim()) {
    res.status(400).json({ valid: false, error: 'username and code required' });
    return;
  }

  const user = db
    .prepare('SELECT id, access_code, code_verified_at FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as
    | { id: number; access_code: string; code_verified_at: string | null }
    | undefined;

  if (!user || user.access_code !== code.trim()) {
    res.status(401).json({ valid: false, error: 'Invalid code' });
    return;
  }

  if (!user.code_verified_at) {
    db.prepare("UPDATE users SET code_verified_at = datetime('now') WHERE id = ?").run(user.id);
  }

  res.json({ valid: true, username: username.trim() });
});

router.get('/check/:username', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MINECRAFT_API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const user = db
    .prepare(`
      SELECT
        u.role,
        u.code_verified_at,
        pt.slug AS privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE u.username = ? COLLATE NOCASE
    `)
    .get(req.params.username) as
    | {
        role: string;
        code_verified_at: string | null;
        privilege_slug: string | null;
        media_platform: string | null;
      }
    | undefined;

  res.json({
    registered: Boolean(user),
    verified: Boolean(user?.code_verified_at),
    role: user?.role ?? null,
    privilegeSlug: user?.privilege_slug ?? null,
    mediaPlatform: user ? normalizeMediaPlatform(user.media_platform) : null,
    displayGroup: user
      ? resolveDisplayGroup(user.role, user.privilege_slug, user.media_platform)
      : null,
    luckPermsGroup: user
      ? resolveLuckPermsGroup(user.role, user.privilege_slug, user.media_platform)
      : null,
  });
});

router.get('/privilege/:username', (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== MINECRAFT_API_KEY) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  const row = db
    .prepare(`
      SELECT pt.slug, pt.name
      FROM users u
      JOIN user_privileges up ON up.user_id = u.id
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

export default router;
