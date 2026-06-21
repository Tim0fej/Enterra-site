import { Router } from 'express';
import { db, generateUniqueAccessCode } from '../db.js';
import { adminMiddleware, authMiddleware, staffMiddleware, type AuthRequest, type UserRole } from '../auth.js';
import { normalizeMediaPlatform, resolveDisplayGroup, resolveLuckPermsGroup } from '../../shared/displayGroup.js';
import { grantUserPrivilege } from '../lib/grantPrivilege.js';

const router = Router();

router.get('/stats', authMiddleware, adminMiddleware, (_req, res) => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const verified = db
    .prepare('SELECT COUNT(*) as count FROM users WHERE code_verified_at IS NOT NULL')
    .get() as { count: number };
  const topics = db.prepare('SELECT COUNT(*) as count FROM forum_topics').get() as { count: number };
  const posts = db.prepare('SELECT COUNT(*) as count FROM forum_posts').get() as { count: number };
  const openTickets = db
    .prepare("SELECT COUNT(*) as count FROM tickets WHERE status != 'closed'")
    .get() as { count: number };

  res.json({
    users: users.count,
    verifiedUsers: verified.count,
    forumTopics: topics.count,
    forumPosts: posts.count,
    openTickets: openTickets.count,
    minecraftApiKey: process.env.MINECRAFT_API_KEY ?? 'enterra-plugin-key',
    pluginConfigured: true,
  });
});

router.get('/users', authMiddleware, adminMiddleware, (_req, res) => {
  const rows = db
    .prepare(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.code_verified_at,
        u.created_at,
        pt.slug as privilege_slug,
        up.media_platform
      FROM users u
      LEFT JOIN user_privileges up ON up.user_id = u.id
      LEFT JOIN privilege_tiers pt ON pt.id = up.tier_id
      ORDER BY u.created_at DESC
    `)
    .all() as Array<{
      id: number;
      username: string;
      email: string;
      role: UserRole;
      code_verified_at: string | null;
      created_at: string;
      privilege_slug: string | null;
      media_platform: string | null;
    }>;

  res.json(
    rows.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      code_verified_at: user.code_verified_at,
      created_at: user.created_at,
      privilege_slug: user.privilege_slug,
      media_platform: normalizeMediaPlatform(user.media_platform),
      displayGroup: resolveDisplayGroup(user.role, user.privilege_slug, user.media_platform),
      luckPermsGroup: resolveLuckPermsGroup(user.role, user.privilege_slug, user.media_platform),
    })),
  );
});

router.patch('/users/:id/role', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { role } = req.body as { role?: UserRole };

  if (!role || !['user', 'moderator', 'admin'].includes(role)) {
    res.status(400).json({ error: 'Некорректная роль' });
    return;
  }

  const targetId = Number(req.params.id);
  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Нельзя изменить свою роль' });
    return;
  }

  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  res.json({ ok: true });
});

router.patch('/users/:id/reset-verification', authMiddleware, adminMiddleware, (req, res) => {
  const result = db
    .prepare('UPDATE users SET code_verified_at = NULL WHERE id = ?')
    .run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  res.json({ ok: true });
});

router.patch('/users/:id/regenerate-code', authMiddleware, adminMiddleware, (req, res) => {
  const user = db
    .prepare('SELECT id FROM users WHERE id = ?')
    .get(req.params.id) as { id: number } | undefined;

  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  const accessCode = generateUniqueAccessCode();
  db.prepare('UPDATE users SET access_code = ?, code_verified_at = NULL WHERE id = ?').run(
    accessCode,
    user.id,
  );

  res.json({ accessCode });
});

router.delete('/users/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const targetId = Number(req.params.id);

  if (!targetId) {
    res.status(400).json({ error: 'Некорректный ID' });
    return;
  }

  if (targetId === req.user!.id) {
    res.status(400).json({ error: 'Нельзя удалить свой аккаунт' });
    return;
  }

  const target = db
    .prepare('SELECT id, role FROM users WHERE id = ?')
    .get(targetId) as { id: number; role: UserRole } | undefined;

  if (!target) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  if (target.role === 'admin') {
    const adminCount = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")
      .get() as { count: number };

    if (adminCount.count <= 1) {
      res.status(400).json({ error: 'Нельзя удалить последнего администратора' });
      return;
    }
  }

  const removeUser = db.transaction(() => {
    db.prepare('UPDATE user_privileges SET granted_by = ? WHERE granted_by = ?').run(
      req.user!.id,
      targetId,
    );
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
    if (result.changes === 0) {
      throw new Error('not deleted');
    }
  });

  try {
    removeUser();
  } catch {
    res.status(500).json({ error: 'Не удалось удалить пользователя' });
    return;
  }

  res.json({ ok: true });
});

router.get('/moder/overview', authMiddleware, staffMiddleware, (_req, res) => {
  const openTickets = db
    .prepare(`
      SELECT t.*, u.username as author
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      WHERE t.status != 'closed'
      ORDER BY t.updated_at DESC
      LIMIT 20
    `)
    .all();

  const recentTopics = db
    .prepare(`
      SELECT t.*, u.username as author, c.name as category_name, c.slug as category_slug,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id) as post_count
      FROM forum_topics t
      JOIN users u ON u.id = t.user_id
      JOIN forum_categories c ON c.id = t.category_id
      ORDER BY t.updated_at DESC
      LIMIT 15
    `)
    .all();

  res.json({ openTickets, recentTopics });
});

router.get('/privilege-tiers', authMiddleware, adminMiddleware, (_req, res) => {
  const tiers = db
    .prepare('SELECT id, slug, name, description, color FROM privilege_tiers ORDER BY sort_order')
    .all();
  res.json(tiers);
});

router.get('/privileges', authMiddleware, adminMiddleware, (_req, res) => {
  const rows = db
    .prepare(`
      SELECT up.id, up.user_id, up.granted_at, up.note, up.media_platform,
        u.username,
        pt.slug as tier_slug, pt.name as tier_name, pt.color as tier_color,
        g.username as granted_by_name
      FROM user_privileges up
      JOIN users u ON u.id = up.user_id
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      JOIN users g ON g.id = up.granted_by
      ORDER BY up.granted_at DESC
    `)
    .all() as Array<{
      id: number;
      user_id: number;
      granted_at: string;
      note: string | null;
      media_platform: string | null;
      username: string;
      tier_slug: string;
      tier_name: string;
      tier_color: string;
      granted_by_name: string;
    }>;

  res.json(
    rows.map((row) => ({
      ...row,
      media_platform: normalizeMediaPlatform(row.media_platform),
    })),
  );
});

router.post('/privileges', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  const { userId, tierId, note, mediaPlatform } = req.body as {
    userId?: number;
    tierId?: number;
    note?: string;
    mediaPlatform?: string;
  };

  if (!userId || !tierId) {
    res.status(400).json({ error: 'Укажите userId и tierId' });
    return;
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  const tier = db
    .prepare('SELECT id, slug FROM privilege_tiers WHERE id = ?')
    .get(tierId) as { id: number; slug: string } | undefined;

  if (!user || !tier) {
    res.status(404).json({ error: 'Пользователь или привилегия не найдены' });
    return;
  }

  try {
    grantUserPrivilege(userId, tier.slug, req.user!.id, note, mediaPlatform);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось выдать привилегию' });
    return;
  }

  res.status(201).json({ ok: true });
});

router.delete('/privileges/:userId', authMiddleware, adminMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM user_privileges WHERE user_id = ?').run(req.params.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Привилегия не найдена' });
    return;
  }

  res.json({ ok: true });
});

export default router;
