import type { NextFunction, Request, Response } from 'express';
import {
  FORM_LOADED_AT_FIELD,
  FORM_MAX_AGE_MS,
  FORM_MIN_SUBMIT_MS,
  TURNSTILE_FIELD,
} from '../../shared/botProtection.js';
import { loadEnv } from '../env.js';
import { sendHttpError } from '../lib/httpError.js';
import { recordAbuse } from '../lib/ipBan.js';
import { clientKey } from '../lib/rateLimitCore.js';
import { isTurnstileEnabled, verifyTurnstileFromRequest } from '../lib/turnstile.js';

const HEADLESS_UA =
  /HeadlessChrome|PhantomJS|selenium|puppeteer|playwright|Bytespider|GPTBot|ClaudeBot|AhrefsBot|SemrushBot/i;

const SKIP_ORIGIN_PREFIXES = ['/api/minecraft', '/api/support/yookassa/webhook', '/api/support/easydonate/webhook'];

function isMutation(req: Request) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
}

function shouldSkipBotChecks(req: Request) {
  if (!req.path.startsWith('/api')) return true;
  return SKIP_ORIGIN_PREFIXES.some((prefix) => req.path.startsWith(prefix));
}

/** Блокирует headless-сканеры и пустой User-Agent на изменяющих запросах. */
export function botUserAgentMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isMutation(req) || shouldSkipBotChecks(req)) {
    next();
    return;
  }

  const ua = req.headers['user-agent']?.trim() ?? '';
  const ip = clientKey(req);

  if (ua.length < 12) {
    recordAbuse(ip, 2);
    sendHttpError(req, res, 400, 'Не удалось обработать запрос', { code: 400 });
    return;
  }

  if (HEADLESS_UA.test(ua)) {
    recordAbuse(ip, 4);
    sendHttpError(req, res, 403, 'Доступ запрещён', { code: 403 });
    return;
  }

  next();
}

/** В prod — POST только с нашего сайта (Origin / Referer). */
export function originGuardMiddleware(req: Request, res: Response, next: NextFunction) {
  const { isProd, siteUrl } = loadEnv();
  if (!isProd || !isMutation(req) || shouldSkipBotChecks(req)) {
    next();
    return;
  }

  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const referer = typeof req.headers.referer === 'string' ? req.headers.referer : '';

  if (origin) {
    if (origin === siteUrl) {
      next();
      return;
    }
    recordAbuse(clientKey(req), 3);
    sendHttpError(req, res, 403, 'Доступ запрещён', { code: 403 });
    return;
  }

  if (referer && !referer.startsWith(`${siteUrl}/`) && referer !== siteUrl) {
    recordAbuse(clientKey(req), 2);
    sendHttpError(req, res, 403, 'Доступ запрещён', { code: 403 });
    return;
  }

  next();
}

/** Слишком быстрая или протухшая форма — типичный бот. */
export function formTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isMutation(req) || shouldSkipBotChecks(req)) {
    next();
    return;
  }

  const body = req.body as Record<string, unknown> | undefined;
  const loadedRaw = body?.[FORM_LOADED_AT_FIELD];
  const loaded = typeof loadedRaw === 'number' ? loadedRaw : Number(loadedRaw);

  if (!Number.isFinite(loaded) || loaded <= 0) {
    recordAbuse(clientKey(req), 2);
    sendHttpError(req, res, 400, 'Не удалось обработать запрос', { code: 400 });
    return;
  }

  const elapsed = Date.now() - loaded;
  if (elapsed < FORM_MIN_SUBMIT_MS) {
    recordAbuse(clientKey(req), 3);
    sendHttpError(req, res, 400, 'Не удалось обработать запрос', { code: 400 });
    return;
  }

  if (elapsed > FORM_MAX_AGE_MS) {
    sendHttpError(req, res, 400, 'Форма устарела. Обновите страницу и попробуйте снова.', { code: 400 });
    return;
  }

  next();
}

/** Cloudflare Turnstile (если ключи заданы в .env). */
export function turnstileMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isTurnstileEnabled()) {
    next();
    return;
  }

  const body = req.body as Record<string, unknown> | undefined;
  const token = body?.[TURNSTILE_FIELD];

  void verifyTurnstileFromRequest(token, req).then((ok) => {
    if (!ok) {
      recordAbuse(clientKey(req), 3);
      sendHttpError(req, res, 400, 'Подтвердите, что вы не робот', { code: 400 });
      return;
    }
    next();
  });
}

/** Auth + регистрация: honeypot, тайминг, turnstile. */
export const authBotGuard = [formTimingMiddleware, turnstileMiddleware];

/** Публичные формы (форум, тикеты): тайминг без captcha. */
export const publicFormBotGuard = [formTimingMiddleware];
