import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Требуется авторизация' });
    return;
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      // ignore invalid token
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
