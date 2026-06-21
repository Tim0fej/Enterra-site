import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateUniqueAccessCode } from '../db.js';
import { authMiddleware, signToken, type AuthRequest } from '../auth.js';
import { normalizeMediaPlatform, resolveDisplayGroup, resolveLuckPermsGroup } from '../../shared/displayGroup.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: 'Заполните все поля' });
    return;
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username.trim())) {
    res.status(400).json({ error: 'Ник: 3–16 символов, только буквы, цифры и _' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Пароль минимум 6 символов' });
    return;
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE')
    .get(username.trim(), email.trim().toLowerCase());

  if (existing) {
    res.status(409).json({ error: 'Пользователь с таким ником или email уже существует' });
    return;
  }

  const accessCode = generateUniqueAccessCode();
  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare('INSERT INTO users (username, email, password_hash, access_code) VALUES (?, ?, ?, ?)')
    .run(username.trim(), email.trim().toLowerCase(), passwordHash, accessCode);

  const user = {
    id: Number(result.lastInsertRowid),
    username: username.trim(),
    role: 'user' as const,
  };

  res.status(201).json({
    token: signToken(user),
    user: {
      id: user.id,
      username: user.username,
      email: email.trim().toLowerCase(),
      role: user.role,
      accessCode,
      codeVerified: false,
    },
  });
});

router.post('/login', (req, res) => {
  const { login, password } = req.body as { login?: string; password?: string };

  if (!login?.trim() || !password) {
    res.status(400).json({ error: 'Введите логин и пароль' });
    return;
  }

  const user = db
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE')
    .get(login.trim(), login.trim().toLowerCase()) as
    | {
        id: number;
        username: string;
        email: string;
        password_hash: string;
        access_code: string;
        role: 'user' | 'admin' | 'moderator';
        code_verified_at: string | null;
      }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Неверный логин или пароль' });
    return;
  }

  const priv = db
    .prepare(`
      SELECT pt.slug, pt.name, pt.color, up.media_platform
      FROM user_privileges up
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE up.user_id = ?
    `)
    .get(user.id) as
    | { slug: string; name: string; color: string; media_platform: string | null }
    | undefined;

  const authUser = { id: user.id, username: user.username, role: user.role };

  res.json({
    token: signToken(authUser),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessCode: user.access_code,
      codeVerified: Boolean(user.code_verified_at),
      privilege: priv
        ? {
            slug: priv.slug,
            name: priv.name,
            color: priv.color,
            mediaPlatform: normalizeMediaPlatform(priv.media_platform),
          }
        : null,
      displayGroup: resolveDisplayGroup(user.role, priv?.slug, priv?.media_platform),
      luckPermsGroup: resolveLuckPermsGroup(user.role, priv?.slug, priv?.media_platform),
      mediaPlatform: normalizeMediaPlatform(priv?.media_platform),
    },
  });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as
    | {
        id: number;
        username: string;
        email: string;
        access_code: string;
        role: 'user' | 'admin' | 'moderator';
        code_verified_at: string | null;
        created_at: string;
      }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  const priv = db
    .prepare(`
      SELECT pt.slug, pt.name, pt.color, up.media_platform
      FROM user_privileges up
      JOIN privilege_tiers pt ON pt.id = up.tier_id
      WHERE up.user_id = ?
    `)
    .get(user.id) as
    | { slug: string; name: string; color: string; media_platform: string | null }
    | undefined;

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    accessCode: user.access_code,
    codeVerified: Boolean(user.code_verified_at),
    createdAt: user.created_at,
    privilege: priv
      ? {
          slug: priv.slug,
          name: priv.name,
          color: priv.color,
          mediaPlatform: normalizeMediaPlatform(priv.media_platform),
        }
      : null,
    displayGroup: resolveDisplayGroup(user.role, priv?.slug, priv?.media_platform),
    luckPermsGroup: resolveLuckPermsGroup(user.role, priv?.slug, priv?.media_platform),
    mediaPlatform: normalizeMediaPlatform(priv?.media_platform),
  });
});

router.post('/regenerate-code', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT code_verified_at FROM users WHERE id = ?').get(req.user!.id) as
    | { code_verified_at: string | null }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  if (user.code_verified_at) {
    res.status(400).json({ error: 'Код уже активирован на сервере. Обратитесь к администрации.' });
    return;
  }

  const accessCode = generateUniqueAccessCode();
  db.prepare('UPDATE users SET access_code = ? WHERE id = ?').run(accessCode, req.user!.id);

  res.json({ accessCode });
});

export default router;
