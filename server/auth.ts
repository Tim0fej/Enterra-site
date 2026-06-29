import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { getTokenVersion } from './lib/accountSecurity.js';
import { readAuthToken } from './lib/authCookie.js';
import { isWebSessionActive, touchWebSession } from './lib/webSessions.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'enterra-dev-secret-change-in-production';

export type UserRole = 'user' | 'moderator' | 'admin';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'admin' || role === 'moderator';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  sessionId?: string | null;
}

interface TokenPayload extends jwt.JwtPayload {
  id: number;
  username: string;
  role: UserRole;
  tv?: number;
  sid?: string;
}

function loadUserFromToken(payload: TokenPayload): AuthUser | null {
  const id = typeof payload.id === 'number' ? payload.id : Number(payload.id);
  if (!id) return null;

  const row = db
    .prepare('SELECT id, username, role, token_version FROM users WHERE id = ?')
    .get(id) as { id: number; username: string; role: UserRole; token_version: number } | undefined;

  if (!row) return null;

  const tokenVersion = typeof payload.tv === 'number' ? payload.tv : 0;
  if (tokenVersion !== (row.token_version ?? 0)) {
    return null;
  }

  const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
  if (sessionId && !isWebSessionActive(sessionId, id)) {
    return null;
  }

  return { id: row.id, username: row.username, role: row.role };
}

export function signToken(user: AuthUser, sessionId?: string): string {
  const tv = getTokenVersion(user.id);
  const payload: Record<string, unknown> = {
    id: user.id,
    username: user.username,
    role: user.role,
    tv,
  };
  if (sessionId) payload.sid = sessionId;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

interface VerifyResult {
  user: AuthUser;
  sessionId: string | null;
}

function verifyBearerToken(token: string): VerifyResult | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = loadUserFromToken(payload);
    if (!user) return null;
    const sessionId = typeof payload.sid === 'string' ? payload.sid : null;
    return { user, sessionId };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = readAuthToken(req);

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  const verified = verifyBearerToken(token);
  if (!verified) {
    res.status(401).json({
      error: 'Сессия завершена. Войдите снова.',
      code: 'SESSION_REVOKED',
    });
    return;
  }

  if (verified.sessionId) {
    touchWebSession(verified.sessionId);
  }

  req.user = verified.user;
  req.sessionId = verified.sessionId;
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = readAuthToken(req);

  if (token) {
    const verified = verifyBearerToken(token);
    if (verified) {
      req.user = verified.user;
      req.sessionId = verified.sessionId;
    }
  }

  next();
}

export function staffMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || !isStaffRole(req.user.role)) {
    res.status(403).json({ error: 'Доступ только для персонала' });
    return;
  }
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Доступ только для администраторов' });
    return;
  }
  next();
}

/** Проверенный id из Bearer — только для rate limit (подпись JWT обязательна). */
export function peekTokenUserId(req: Request): number | null {
  const token = readAuthToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id?: number };
    if (!payload?.id) return null;
    return Number(payload.id);
  } catch {
    return null;
  }
}
