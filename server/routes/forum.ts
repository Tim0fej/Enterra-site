import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, isStaffRole, optionalAuth, staffMiddleware, type AuthRequest } from '../auth.js';
import {
  getAttachmentsForForumPosts,
  linkAttachmentsToForumPost,
  parseAttachmentIds,
} from '../lib/attachments.js';

const router = Router();

function enrichForumPosts(posts: Array<{ id: number } & Record<string, unknown>>) {
  const attachmentMap = getAttachmentsForForumPosts(posts.map((p) => p.id));
  return posts.map((post) => ({
    ...post,
    attachments: attachmentMap.get(post.id) ?? [],
  }));
}

router.get('/categories', (_req, res) => {
  const categories = db
    .prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM forum_topics t WHERE t.category_id = c.id) as topic_count
      FROM forum_categories c
      ORDER BY c.id
    `)
    .all();

  res.json(categories);
});

router.get('/categories/:slug/topics', (req, res) => {
  const category = db
    .prepare('SELECT * FROM forum_categories WHERE slug = ?')
    .get(req.params.slug) as { id: number } | undefined;

  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  const topics = db
    .prepare(`
      SELECT t.*, u.username as author,
        (SELECT COUNT(*) FROM forum_posts p WHERE p.topic_id = t.id) as post_count,
        (SELECT MAX(created_at) FROM forum_posts p WHERE p.topic_id = t.id) as last_post_at
      FROM forum_topics t
      JOIN users u ON u.id = t.user_id
      WHERE t.category_id = ?
      ORDER BY t.pinned DESC, t.updated_at DESC
    `)
    .all(category.id);

  res.json({ category, topics });
});

router.post('/topics', authMiddleware, (req: AuthRequest, res) => {
  const { categorySlug, title, content, attachmentIds: rawAttachmentIds } = req.body as {
    categorySlug?: string;
    title?: string;
    content?: string;
    attachmentIds?: unknown;
  };

  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  if (!categorySlug || !title?.trim() || (!text && attachmentIds.length === 0)) {
    res.status(400).json({ error: 'Заполните заголовок и текст или прикрепите файлы' });
    return;
  }

  const category = db
    .prepare('SELECT id FROM forum_categories WHERE slug = ?')
    .get(categorySlug) as { id: number } | undefined;

  if (!category) {
    res.status(404).json({ error: 'Категория не найдена' });
    return;
  }

  try {
    const topicId = db.transaction(() => {
      const topic = db
        .prepare('INSERT INTO forum_topics (category_id, user_id, title) VALUES (?, ?, ?)')
        .run(category.id, req.user!.id, title.trim());

      const topicId = Number(topic.lastInsertRowid);

      const post = db
        .prepare('INSERT INTO forum_posts (topic_id, user_id, content) VALUES (?, ?, ?)')
        .run(topicId, req.user!.id, text);

      linkAttachmentsToForumPost(req.user!.id, Number(post.lastInsertRowid), attachmentIds);

      return topicId;
    })();

    res.status(201).json({ topicId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось создать тему' });
  }
});

router.get('/topics/:id', optionalAuth, (req: AuthRequest, res) => {
  const topic = db
    .prepare(`
      SELECT t.*, u.username as author, c.name as category_name, c.slug as category_slug
      FROM forum_topics t
      JOIN users u ON u.id = t.user_id
      JOIN forum_categories c ON c.id = t.category_id
      WHERE t.id = ?
    `)
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!topic) {
    res.status(404).json({ error: 'Тема не найдена' });
    return;
  }

  const posts = db
    .prepare(`
      SELECT p.*, u.username as author, u.role
      FROM forum_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.topic_id = ?
      ORDER BY p.created_at ASC
    `)
    .all(req.params.id) as Array<{ id: number } & Record<string, unknown>>;

  res.json({ topic, posts: enrichForumPosts(posts) });
});

router.post('/topics/:id/reply', authMiddleware, (req: AuthRequest, res) => {
  const { content, attachmentIds: rawAttachmentIds } = req.body as {
    content?: string;
    attachmentIds?: unknown;
  };

  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  if (!text && attachmentIds.length === 0) {
    res.status(400).json({ error: 'Введите текст или прикрепите файлы' });
    return;
  }

  const topic = db
    .prepare('SELECT id, locked FROM forum_topics WHERE id = ?')
    .get(req.params.id) as { id: number; locked: number } | undefined;

  if (!topic) {
    res.status(404).json({ error: 'Тема не найдена' });
    return;
  }

  if (topic.locked && !isStaffRole(req.user!.role)) {
    res.status(403).json({ error: 'Тема закрыта для ответов' });
    return;
  }

  try {
    const result = db
      .prepare('INSERT INTO forum_posts (topic_id, user_id, content) VALUES (?, ?, ?)')
      .run(topic.id, req.user!.id, text);

    linkAttachmentsToForumPost(req.user!.id, Number(result.lastInsertRowid), attachmentIds);

    db.prepare("UPDATE forum_topics SET updated_at = datetime('now') WHERE id = ?").run(topic.id);

    res.status(201).json({ postId: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось отправить' });
  }
});

router.patch('/topics/:id/pin', authMiddleware, staffMiddleware, (req, res) => {
  const { pinned } = req.body as { pinned?: boolean };

  if (typeof pinned !== 'boolean') {
    res.status(400).json({ error: 'Укажите pinned: true/false' });
    return;
  }

  const result = db
    .prepare('UPDATE forum_topics SET pinned = ? WHERE id = ?')
    .run(pinned ? 1 : 0, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Тема не найдена' });
    return;
  }

  res.json({ ok: true });
});

router.patch('/topics/:id/lock', authMiddleware, staffMiddleware, (req, res) => {
  const { locked } = req.body as { locked?: boolean };

  if (typeof locked !== 'boolean') {
    res.status(400).json({ error: 'Укажите locked: true/false' });
    return;
  }

  const result = db
    .prepare('UPDATE forum_topics SET locked = ? WHERE id = ?')
    .run(locked ? 1 : 0, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Тема не найдена' });
    return;
  }

  res.json({ ok: true });
});

router.delete('/topics/:id', authMiddleware, staffMiddleware, (req, res) => {
  const result = db.prepare('DELETE FROM forum_topics WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Тема не найдена' });
    return;
  }

  res.json({ ok: true });
});

router.delete('/posts/:id', authMiddleware, staffMiddleware, (req, res) => {
  const post = db
    .prepare('SELECT id, topic_id FROM forum_posts WHERE id = ?')
    .get(req.params.id) as { id: number; topic_id: number } | undefined;

  if (!post) {
    res.status(404).json({ error: 'Сообщение не найдено' });
    return;
  }

  const postCount = db
    .prepare('SELECT COUNT(*) as count FROM forum_posts WHERE topic_id = ?')
    .get(post.topic_id) as { count: number };

  if (postCount.count <= 1) {
    res.status(400).json({ error: 'Нельзя удалить единственное сообщение в теме. Удалите тему целиком.' });
    return;
  }

  db.prepare('DELETE FROM forum_posts WHERE id = ?').run(post.id);
  res.json({ ok: true });
});

export default router;
