import type { Request, Response } from 'express';
import { loadEnv } from '../env.js';

export const AUTH_COOKIE = 'enterra_session';

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string) {
  const { isProd } = loadEnv();
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE_MS,
  });
}

export function clearAuthCookie(res: Response) {
  const { isProd } = loadEnv();
  res.cookie(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function readAuthToken(req: Request): string | null {
  const cookieToken = req.cookies?.[AUTH_COOKIE];
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }

  return null;
}
