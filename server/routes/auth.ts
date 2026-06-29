import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, generateUniqueAccessCode } from '../db.js';
import { authMiddleware, optionalAuth, signToken, type AuthRequest } from '../auth.js';
import {
  normalizeEmail,
  normalizeUsername,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../../shared/accountValidation.js';
import { consumeEmailCode, sendEmailCode, type EmailCodePurpose } from '../lib/emailVerification.js';
import {
  clearLoginFailures,
  isAccountLoginBlocked,
  isLoginBlocked,
  accountLoginBlockedMessage,
  loginBlockedMessage,
  recordLoginFailure,
  applyLoginFailureDelay,
} from '../lib/loginGuard.js';
import { bumpTokenVersion } from '../lib/accountSecurity.js';
import {
  createLoginChallenge,
  getUserEmailForLogin,
  isTrustedLoginIp,
  maskEmail,
  parseLoginChallenge,
} from '../lib/loginVerification.js';
import { getClientIp } from '../lib/clientIp.js';
import { honeypotMiddleware } from '../middleware/security.js';
import { authBotGuard } from '../middleware/botGuard.js';
import { setAuthCookie, clearAuthCookie } from '../lib/authCookie.js';
import { getTurnstileSiteKey, isTurnstileEnabled } from '../lib/turnstile.js';
import {
  createWebSession,
  listWebSessions,
  revokeOtherWebSessions,
  revokeWebSession,
} from '../lib/webSessions.js';
import { assertNoBanBypass, recordRegistrationIp, recordWebIp } from '../lib/multiAccount.js';
import { isMailConfigured } from '../lib/mailer.js';
import { getUserProfile, verifyCurrentPassword } from '../lib/userProfile.js';
import { updateUserNameColor } from '../lib/nameColor.js';
import {
  accessCodeExpirySql,
  isAccessCodeActive,
  issueNewAccessCode,
} from '../lib/accessCode.js';

const router = Router();

router.get('/config', (_req, res) => {
  res.json({
    turnstileEnabled: isTurnstileEnabled(),
    turnstileSiteKey: getTurnstileSiteKey(),
  });
});

function sendAuthSession(
  req: AuthRequest,
  res: Response,
  userId: number,
  statusCode = 200,
  extra?: Record<string, unknown>,
) {
  const profile = getUserProfile(userId);
  if (!profile) {
    res.status(500).json({ error: 'Ошибка авторизации' });
    return false;
  }
  const sessionId = createWebSession(userId, req);
  const token = signToken(
    { id: profile.id, username: profile.username, role: profile.role },
    sessionId,
  );
  setAuthCookie(res, token);
  res.status(statusCode).json({ user: profile, ...extra });
  return true;
}

function requirePassword(userId: number, currentPassword: string | undefined, res: import('express').Response): boolean {
  if (!currentPassword) {
    res.status(400).json({ error: 'Введите текущий пароль для подтверждения' });
    return false;
  }
  if (!verifyCurrentPassword(userId, currentPassword)) {
    res.status(403).json({ error: 'Неверный текущий пароль' });
    return false;
  }
  return true;
}

router.post('/send-email-code', honeypotMiddleware(), ...authBotGuard, optionalAuth, (req: AuthRequest, res: Response) => {
  const { email, purpose, currentPassword, challengeToken } = req.body as {
    email?: string;
    purpose?: EmailCodePurpose;
    currentPassword?: string;
    challengeToken?: string;
  };

  if (
    purpose !== 'register' &&
    purpose !== 'change_email' &&
    purpose !== 'verify_email' &&
    purpose !== 'login_verify' &&
    purpose !== 'reset_password'
  ) {
    res.status(400).json({ error: 'Некорректный тип подтверждения' });
    return;
  }

  if (purpose === 'login_verify') {
    const userId = challengeToken ? parseLoginChallenge(challengeToken) : null;
    if (!userId) {
      res.status(400).json({ error: 'Сессия входа истекла. Введите логин и пароль снова.' });
      return;
    }

    const accountEmail = getUserEmailForLogin(userId);
    if (!accountEmail) {
      res.status(400).json({ error: 'Сессия входа истекла. Введите логин и пароль снова.' });
      return;
    }

    if (email?.trim()) {
      const emailError = validateEmail(email);
      if (emailError) {
        res.status(400).json({ error: emailError });
        return;
      }
      if (normalizeEmail(email) !== normalizeEmail(accountEmail)) {
        res.status(400).json({ error: 'Укажите email вашего аккаунта' });
        return;
      }
    }

    if (!isMailConfigured() && process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Отправка писем не настроена. Обратитесь к администрации.' });
      return;
    }

    void sendEmailCode(accountEmail, 'login_verify', userId).then((result) => {
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ ok: true, message: 'Код для входа отправлен на почту' });
    });
    return;
  }

  const emailError = validateEmail(email ?? '');
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  const normalizedEmail = normalizeEmail(email!);

  if (purpose === 'reset_password') {
    const user = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE')
      .get(normalizedEmail) as { id: number } | undefined;

    if (!isMailConfigured() && process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Отправка писем не настроена. Обратитесь к администрации.' });
      return;
    }

    const resetMessage = 'Если аккаунт с таким email есть, код отправлен на почту';

    if (!user) {
      res.json({ ok: true, message: resetMessage });
      return;
    }

    void sendEmailCode(normalizedEmail, 'reset_password', user.id).then((result) => {
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ ok: true, message: resetMessage });
    });
    return;
  }

  if (purpose === 'register') {
    const taken = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE')
      .get(normalizedEmail);

    if (!isMailConfigured() && process.env.NODE_ENV === 'production') {
      res.status(503).json({ error: 'Отправка писем не настроена. Обратитесь к администрации.' });
      return;
    }

    if (taken) {
      res.json({ ok: true, message: 'Если email свободен, код отправлен на почту' });
      return;
    }

    const ipCheck = assertNoBanBypass(getClientIp(req));
    if (!ipCheck.ok) {
      res.status(403).json({ error: ipCheck.message });
      return;
    }

    void sendEmailCode(normalizedEmail, purpose).then((result) => {
      if (!result.ok) {
        res.status(result.status).json({ error: result.error });
        return;
      }
      res.json({ ok: true, message: 'Код отправлен на почту' });
    });
    return;
  }

  if (purpose === 'change_email') {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }
    if (!requirePassword(req.user.id, currentPassword, res)) return;

    const current = getUserProfile(req.user.id);
    if (current?.email.toLowerCase() === normalizedEmail) {
      res.status(400).json({ error: 'Этот email уже указан в профиле' });
      return;
    }

    const taken = db
      .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
      .get(normalizedEmail, req.user.id);
    if (taken) {
      res.status(409).json({ error: 'Email уже используется другим аккаунтом' });
      return;
    }
  }

  if (purpose === 'verify_email') {
    if (!req.user) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const current = getUserProfile(req.user.id);
    if (!current) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (current.emailVerified) {
      res.status(400).json({ error: 'Почта уже подтверждена' });
      return;
    }

    if (current.email.toLowerCase() !== normalizedEmail) {
      res.status(400).json({ error: 'Укажите email вашего аккаунта' });
      return;
    }
  }

  if (!isMailConfigured() && process.env.NODE_ENV === 'production') {
    res.status(503).json({ error: 'Отправка писем не настроена. Обратитесь к администрации.' });
    return;
  }

  const userId =
    purpose === 'change_email' || purpose === 'verify_email' ? req.user!.id : undefined;

  void sendEmailCode(normalizedEmail, purpose, userId).then((result) => {
    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }
    res.json({ ok: true, message: 'Код отправлен на почту' });
  });
});

router.post('/register', honeypotMiddleware(), ...authBotGuard, (req, res) => {
  const { username, email, password, emailCode, acceptTerms } = req.body as {
    username?: string;
    email?: string;
    password?: string;
    emailCode?: string;
    acceptTerms?: boolean;
  };

  if (!username?.trim() || !email?.trim() || !password || !emailCode?.trim()) {
    res.status(400).json({ error: 'Заполните все поля, включая код из письма' });
    return;
  }

  if (acceptTerms !== true) {
    res.status(400).json({ error: 'Необходимо принять пользовательское соглашение и правила сервера' });
    return;
  }

  const usernameError = validateUsername(username);
  if (usernameError) {
    res.status(400).json({ error: usernameError });
    return;
  }

  const emailError = validateEmail(email);
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE')
    .get(normalizedUsername, normalizedEmail);

  if (existing) {
    res.status(409).json({ error: 'Пользователь с таким ником или email уже существует' });
    return;
  }

  if (!consumeEmailCode(normalizedEmail, 'register', emailCode.trim())) {
    res.status(400).json({ error: 'Неверный или просроченный код из письма' });
    return;
  }

  const clientIp = getClientIp(req);
  const ipCheck = assertNoBanBypass(clientIp);
  if (!ipCheck.ok) {
    res.status(403).json({ error: ipCheck.message });
    return;
  }

  const accessCode = generateUniqueAccessCode();
  const passwordHash = bcrypt.hashSync(password, 10);

  const result = db
    .prepare(`
      INSERT INTO users (username, email, password_hash, access_code, email_verified_at, code_expires_at)
      VALUES (?, ?, ?, ?, datetime('now'), ${accessCodeExpirySql()})
    `)
    .run(normalizedUsername, normalizedEmail, passwordHash, accessCode);

  const userId = Number(result.lastInsertRowid);
  recordRegistrationIp(userId, clientIp);
  recordWebIp(userId, clientIp);
  if (!sendAuthSession(req, res, userId, 201)) return;
});

router.post('/login', honeypotMiddleware(), ...authBotGuard, async (req, res) => {
  if (isLoginBlocked(req)) {
    res.status(429).json({ error: loginBlockedMessage() });
    return;
  }

  const { login, password } = req.body as { login?: string; password?: string };
  const loginValue = login?.trim() ?? '';

  if (loginValue && isAccountLoginBlocked(loginValue)) {
    res.status(429).json({ error: accountLoginBlockedMessage() });
    return;
  }

  if (!loginValue || !password) {
    res.status(400).json({ error: 'Введите логин и пароль' });
    return;
  }

  if (password.length > 128) {
    res.status(400).json({ error: 'Неверный логин или пароль' });
    return;
  }

  const user = db
    .prepare(`
      SELECT id, password_hash, email, email_verified_at
      FROM users
      WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE
    `)
    .get(loginValue, loginValue.toLowerCase()) as
    | { id: number; password_hash: string; email: string; email_verified_at: string | null }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    recordLoginFailure(req, loginValue);
    await applyLoginFailureDelay(req);
    res.status(401).json({ error: 'Неверный логин или пароль' });
    return;
  }

  if (!user.email_verified_at) {
    res.status(403).json({
      error: 'Подтвердите email перед входом — зайдите через регистрацию или запросите код в поддержке.',
      code: 'EMAIL_NOT_VERIFIED',
      maskedEmail: maskEmail(user.email),
    });
    return;
  }

  const clientIp = getClientIp(req);

  if (!isTrustedLoginIp(user.id, clientIp)) {
    const sent = await sendEmailCode(user.email, 'login_verify', user.id);
    if (!sent.ok) {
      res.status(sent.status).json({ error: sent.error });
      return;
    }

    res.json({
      requiresVerification: true,
      challengeToken: createLoginChallenge(user.id),
      maskedEmail: maskEmail(user.email),
      message: 'Вход с нового устройства или IP. Код подтверждения отправлен на почту.',
    });
    return;
  }

  clearLoginFailures(req, loginValue);
  recordWebIp(user.id, clientIp);

  if (!sendAuthSession(req, res, user.id)) return;
});

router.post('/login/verify', honeypotMiddleware(), ...authBotGuard, async (req, res) => {
  if (isLoginBlocked(req)) {
    res.status(429).json({ error: loginBlockedMessage() });
    return;
  }

  const { challengeToken, emailCode, login } = req.body as {
    challengeToken?: string;
    emailCode?: string;
    login?: string;
  };

  const loginValue = login?.trim() ?? '';
  const userId = challengeToken ? parseLoginChallenge(challengeToken) : null;

  if (!userId || !emailCode?.trim()) {
    res.status(400).json({ error: 'Введите код из письма' });
    return;
  }

  const email = getUserEmailForLogin(userId);
  if (!email || !consumeEmailCode(email, 'login_verify', emailCode.trim(), userId)) {
    if (loginValue) recordLoginFailure(req, loginValue);
    await applyLoginFailureDelay(req);
    res.status(401).json({ error: 'Неверный или просроченный код' });
    return;
  }

  clearLoginFailures(req, loginValue);
  recordWebIp(userId, getClientIp(req));

  if (!sendAuthSession(req, res, userId)) return;
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const profile = getUserProfile(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }
  res.json(profile);
});

router.patch('/name-color', authMiddleware, (req: AuthRequest, res) => {
  const { nameColor } = req.body as { nameColor?: string | null };
  try {
    const normalized = updateUserNameColor(req.user!.id, nameColor ?? null);
    const profile = getUserProfile(req.user!.id);
    if (!profile) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json({
      ...profile,
      message: normalized ? 'Цвет ника сохранён — на сервере зайди в игру или введи /privsync' : 'Цвет ника сброшен — на сервере введи /privsync',
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Не удалось сохранить цвет',
    });
  }
});

router.post('/regenerate-code', authMiddleware, (req: AuthRequest, res) => {
  const user = db
    .prepare('SELECT code_verified_at, code_expires_at FROM users WHERE id = ?')
    .get(req.user!.id) as
    | { code_verified_at: string | null; code_expires_at: string | null }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  if (isAccessCodeActive(user)) {
    res.status(400).json({ error: 'Код уже активирован на сервере. Дождитесь смены кода или обратитесь к администрации.' });
    return;
  }

  const accessCode = issueNewAccessCode(req.user!.id);
  const profile = getUserProfile(req.user!.id);

  res.json({
    accessCode,
    codeExpiresAt: profile?.codeExpiresAt,
  });
});

router.post('/reset-password', honeypotMiddleware(), ...authBotGuard, (req, res) => {
  const { email, emailCode, newPassword } = req.body as {
    email?: string;
    emailCode?: string;
    newPassword?: string;
  };

  const emailError = validateEmail(email ?? '');
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  if (!emailCode?.trim()) {
    res.status(400).json({ error: 'Введите код из письма' });
    return;
  }

  const passwordError = validatePassword(newPassword ?? '');
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  const normalizedEmail = normalizeEmail(email!);
  const user = db
    .prepare('SELECT id, password_hash FROM users WHERE email = ? COLLATE NOCASE')
    .get(normalizedEmail) as { id: number; password_hash: string } | undefined;

  if (!user || !consumeEmailCode(normalizedEmail, 'reset_password', emailCode.trim(), user.id)) {
    res.status(400).json({ error: 'Неверный или просроченный код из письма' });
    return;
  }

  if (bcrypt.compareSync(newPassword!, user.password_hash)) {
    res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword!, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, user.id);
  bumpTokenVersion(user.id);

  res.json({ ok: true, message: 'Пароль обновлён. Теперь можно войти.' });
});

router.patch('/password', authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!requirePassword(req.user!.id, currentPassword, res)) return;

  const passwordError = validatePassword(newPassword ?? '');
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: 'Новый пароль должен отличаться от текущего' });
    return;
  }

  const passwordHash = bcrypt.hashSync(newPassword!, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, req.user!.id);
  bumpTokenVersion(req.user!.id);

  if (!sendAuthSession(req, res, req.user!.id)) return;
});

router.patch('/email', authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, email, emailCode } = req.body as {
    currentPassword?: string;
    email?: string;
    emailCode?: string;
  };

  if (!requirePassword(req.user!.id, currentPassword, res)) return;

  if (!emailCode?.trim()) {
    res.status(400).json({ error: 'Введите код из письма' });
    return;
  }

  const emailError = validateEmail(email ?? '');
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  const normalizedEmail = normalizeEmail(email!);
  const current = getUserProfile(req.user!.id);
  if (current?.email.toLowerCase() === normalizedEmail) {
    res.status(400).json({ error: 'Этот email уже указан в профиле' });
    return;
  }

  const taken = db
    .prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE AND id != ?')
    .get(normalizedEmail, req.user!.id);
  if (taken) {
    res.status(409).json({ error: 'Email уже используется другим аккаунтом' });
    return;
  }

  if (!consumeEmailCode(normalizedEmail, 'change_email', emailCode.trim(), req.user!.id)) {
    res.status(400).json({ error: 'Неверный или просроченный код из письма' });
    return;
  }

  db.prepare(`
    UPDATE users SET email = ?, email_verified_at = datetime('now') WHERE id = ?
  `).run(normalizedEmail, req.user!.id);
  bumpTokenVersion(req.user!.id);

  if (!sendAuthSession(req, res, req.user!.id)) return;
});

router.patch('/username', authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, username } = req.body as { currentPassword?: string; username?: string };

  if (!requirePassword(req.user!.id, currentPassword, res)) return;

  const usernameError = validateUsername(username ?? '');
  if (usernameError) {
    res.status(400).json({ error: usernameError });
    return;
  }

  const normalizedUsername = normalizeUsername(username!);
  const current = getUserProfile(req.user!.id);
  if (current?.username.toLowerCase() === normalizedUsername.toLowerCase()) {
    res.status(400).json({ error: 'Этот ник уже указан в профиле' });
    return;
  }

  const taken = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?')
    .get(normalizedUsername, req.user!.id);
  if (taken) {
    res.status(409).json({ error: 'Ник уже занят другим аккаунтом' });
    return;
  }

  db.prepare(`
    UPDATE users
    SET username = ?, code_verified_at = NULL, code_expires_at = ${accessCodeExpirySql()}
    WHERE id = ?
  `).run(normalizedUsername, req.user!.id);
  bumpTokenVersion(req.user!.id);

  if (!sendAuthSession(req, res, req.user!.id, 200, { verificationReset: Boolean(current?.codeVerified) })) return;
});

router.patch('/verify-email', authMiddleware, (req: AuthRequest, res) => {
  const { emailCode } = req.body as { emailCode?: string };

  if (!emailCode?.trim()) {
    res.status(400).json({ error: 'Введите код из письма' });
    return;
  }

  const profile = getUserProfile(req.user!.id);
  if (!profile) {
    res.status(404).json({ error: 'Пользователь не найден' });
    return;
  }

  if (profile.emailVerified) {
    res.status(400).json({ error: 'Почта уже подтверждена' });
    return;
  }

  if (!consumeEmailCode(profile.email, 'verify_email', emailCode.trim(), req.user!.id)) {
    res.status(400).json({ error: 'Неверный или просроченный код из письма' });
    return;
  }

  db.prepare("UPDATE users SET email_verified_at = datetime('now') WHERE id = ?").run(req.user!.id);

  if (!sendAuthSession(req, res, req.user!.id)) return;
});

router.get('/sessions', authMiddleware, (req: AuthRequest, res) => {
  res.json({
    sessions: listWebSessions(req.user!.id, req.sessionId ?? null),
  });
});

router.post('/sessions/revoke-others', authMiddleware, (req: AuthRequest, res) => {
  const removed = revokeOtherWebSessions(req.user!.id, req.sessionId ?? null);
  res.json({ ok: true, removed });
});

router.delete('/sessions/:id', authMiddleware, (req: AuthRequest, res) => {
  const rawId = req.params.id;
  const sessionId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim();
  if (!sessionId) {
    res.status(400).json({ error: 'Некорректный идентификатор сессии' });
    return;
  }

  const revoked = revokeWebSession(sessionId, req.user!.id);
  if (!revoked) {
    res.status(404).json({ error: 'Сессия не найдена' });
    return;
  }

  if (sessionId === req.sessionId) {
    clearAuthCookie(res);
  }

  res.json({ ok: true, current: sessionId === req.sessionId });
});

router.post('/logout', authMiddleware, (req: AuthRequest, res) => {
  if (req.sessionId) {
    revokeWebSession(req.sessionId, req.user!.id);
  }
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
