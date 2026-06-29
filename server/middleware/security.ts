import type { NextFunction, Request, Response } from 'express';
import { peekTokenUserId } from '../auth.js';
import { loadEnv } from '../env.js';
import { isTurnstileEnabled } from '../lib/turnstile.js';
import { sendHttpError } from '../lib/httpError.js';
import { isTempBanned, recordAbuse } from '../lib/ipBan.js';
import { clientKey, createRateLimit, envInt } from '../lib/rateLimitCore.js';

const env = loadEnv();

const blockedIps = new Set(
  (process.env.BLOCKED_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim().toLowerCase())
    .filter(Boolean),
);

export function ipBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = clientKey(req);
  if (blockedIps.has(ip) || isTempBanned(ip)) {
    sendHttpError(req, res, 403, 'Доступ временно ограничен', { code: 403 });
    return;
  }
  next();
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  if (env.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    const turnstile = isTurnstileEnabled() ? ' https://challenges.cloudflare.com' : '';
    res.setHeader(
      'Content-Security-Policy',
      `default-src 'self'; script-src 'self'${turnstile}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'${turnstile}; frame-src 'self'${turnstile}; frame-ancestors 'self'; base-uri 'self'; form-action 'self'`,
    );
  }
  next();
}

const PROBE_PATTERN =
  /^\/(\.env|\.git|wp-admin|wp-login|xmlrpc\.php|phpmyadmin|administrator|vendor|cgi-bin|shell|eval-stdin|actuator|\.aws|server-status)/i;

export function probeBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  if (PROBE_PATTERN.test(req.path)) {
    recordAbuse(clientKey(req), 4);
    sendHttpError(req, res, 404, undefined, { code: 404 });
    return;
  }
  next();
}

export function pathGuardMiddleware(req: Request, res: Response, next: NextFunction) {
  const raw = req.url;
  if (raw.length > 4096 || raw.includes('..') || /%2e%2e/i.test(raw)) {
    recordAbuse(clientKey(req), 3);
    sendHttpError(req, res, 400, undefined, { code: 400 });
    return;
  }
  next();
}

const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

export function methodGuardMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!ALLOWED_METHODS.has(req.method)) {
    recordAbuse(clientKey(req), 2);
    sendHttpError(req, res, 405, undefined, { code: 405 });
    return;
  }
  next();
}

const SCANNER_UA =
  /(?:sqlmap|nikto|masscan|zgrab|nmap|acunetix|nessus|dirbuster|gobuster|havij|libwww-perl|python-requests\/|scrapy\/|Go-http-client\/|java\/[\d.]+.*http|curl\/|wget\/)/i;

export function scannerBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'HEAD') {
    next();
    return;
  }

  const ua = req.headers['user-agent'] ?? '';
  if (SCANNER_UA.test(ua) && req.path.startsWith('/api')) {
    recordAbuse(clientKey(req), 5);
    sendHttpError(req, res, 403, 'Доступ запрещён', { code: 403 });
    return;
  }
  next();
}

export function jsonBodyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  const path = req.path;
  if (
    path.startsWith('/api/uploads') ||
    path.includes('/webhook') ||
    path.startsWith('/api/minecraft')
  ) {
    next();
    return;
  }

  if (!path.startsWith('/api')) {
    next();
    return;
  }

  const contentType = req.headers['content-type'] ?? '';
  const contentLength = Number(req.headers['content-length'] ?? 0);

  if (contentLength === 0) {
    next();
    return;
  }

  if (!contentType.includes('application/json')) {
    sendHttpError(req, res, 415, 'Ожидается JSON', { code: 415 });
    return;
  }

  next();
}

export function suspiciousBotMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    next();
    return;
  }

  if (!req.path.startsWith('/api/auth')) {
    next();
    return;
  }

  const ua = req.headers['user-agent'];
  if (!ua || ua.trim().length < 8) {
    recordAbuse(clientKey(req), 2);
    sendHttpError(req, res, 400, 'Не удалось обработать запрос', { code: 400 });
    return;
  }

  next();
}

function userOrIpKey(req: Request): string {
  const userId = peekTokenUserId(req);
  if (userId) return `user:${userId}`;
  return `ip:${clientKey(req)}`;
}

/** Запросы плагина MC — отдельный лимит, не считаем в общий API/burst. */
function isMinecraftPluginApi(req: Request): boolean {
  return req.path.startsWith('/api/minecraft');
}

export function requestTimeoutMiddleware(timeoutMs = 30_000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const isUploadPost = req.method === 'POST' && req.path.startsWith('/api/uploads');
    const ms = isUploadPost ? 120_000 : timeoutMs;
    req.setTimeout(ms);
    res.setTimeout(ms);
    next();
  };
}

export function honeypotMiddleware(field = 'website') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = (req.body as Record<string, unknown> | undefined)?.[field];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      recordAbuse(clientKey(req), 3);
      sendHttpError(req, res, 400, 'Не удалось обработать запрос', { code: 400 });
      return;
    }
    next();
  };
}

/** Пропускает GET/HEAD — лимит только на изменяющие запросы. */
export function mutationsOnly(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      next();
      return;
    }
    middleware(req, res, next);
  };
}

export const rateLimiters = {
  global: createRateLimit({
    name: 'global',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_GLOBAL', 300),
    message: 'Слишком много запросов с вашего IP. Подождите минуту.',
    abuseWeight: 2,
    skip: isMinecraftPluginApi,
  }),
  burst: createRateLimit({
    name: 'burst',
    windowMs: 10_000,
    max: envInt('RATE_LIMIT_BURST', 50),
    message: 'Слишком много запросов. Подождите несколько секунд.',
    abuseWeight: 3,
    skip: isMinecraftPluginApi,
  }),
  api: createRateLimit({
    name: 'api',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_API', 100),
    message: 'Слишком много обращений к API. Подождите минуту.',
    abuseWeight: 2,
    skip: isMinecraftPluginApi,
  }),
  health: createRateLimit({
    name: 'health',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_HEALTH', 20),
    message: 'Too many requests',
    abuseWeight: 2,
  }),
  publicRead: createRateLimit({
    name: 'public-read',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_PUBLIC', 45),
    message: 'Слишком много запросов. Подождите минуту.',
  }),
  login: createRateLimit({
    name: 'login',
    windowMs: 15 * 60_000,
    max: envInt('RATE_LIMIT_LOGIN', 10),
    message: 'Слишком много попыток входа. Попробуйте через 15 минут.',
    abuseWeight: 3,
  }),
  register: createRateLimit({
    name: 'register',
    windowMs: 60 * 60_000,
    max: envInt('RATE_LIMIT_REGISTER', 5),
    message: 'Слишком много попыток регистрации. Попробуйте позже.',
    abuseWeight: 3,
  }),
  emailCode: createRateLimit({
    name: 'email-code',
    windowMs: 60 * 60_000,
    max: envInt('RATE_LIMIT_EMAIL_CODE', 8),
    message: 'Слишком много запросов кода на почту. Попробуйте через час.',
    abuseWeight: 2,
  }),
  write: createRateLimit({
    name: 'write',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_WRITE', 40),
    message: 'Слишком много сообщений. Подождите минуту.',
  }),
  upload: createRateLimit({
    name: 'upload',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_UPLOAD', 10),
    message: 'Слишком много загрузок. Подождите минуту.',
  }),
  webhook: createRateLimit({
    name: 'webhook',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_WEBHOOK', 80),
  }),
  minecraft: createRateLimit({
    name: 'minecraft',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_MINECRAFT', 600),
    keyGenerator: (req) => {
      const apiKey = req.headers['x-api-key'];
      if (typeof apiKey === 'string' && apiKey.trim()) {
        return `mc:${apiKey.trim().slice(0, 32)}`;
      }
      return `mc-ip:${clientKey(req)}`;
    },
  }),
  admin: createRateLimit({
    name: 'admin',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_ADMIN', 60),
    message: 'Слишком много запросов к админ-панели.',
    keyGenerator: userOrIpKey,
  }),
  sensitive: createRateLimit({
    name: 'sensitive',
    windowMs: 15 * 60_000,
    max: envInt('RATE_LIMIT_SENSITIVE', 10),
    message: 'Слишком много попыток изменить данные аккаунта. Подождите 15 минут.',
    keyGenerator: userOrIpKey,
  }),
  authenticated: createRateLimit({
    name: 'authenticated',
    windowMs: 60_000,
    max: envInt('RATE_LIMIT_AUTHENTICATED', 120),
    message: 'Слишком много действий. Подождите минуту.',
    keyGenerator: userOrIpKey,
    skip: (req) => !peekTokenUserId(req),
  }),
};
