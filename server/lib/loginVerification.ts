import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { normalizeIp } from './clientIp.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'enterra-dev-secret-change-in-production';
const CHALLENGE_TTL = '10m';

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***@***';
  const visible = local.length <= 2 ? local[0] ?? '*' : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

export function isTrustedLoginIp(userId: number, ip: string | null): boolean {
  if (!ip) return false;

  const row = db.prepare('SELECT last_web_ip FROM users WHERE id = ?').get(userId) as
    | { last_web_ip: string | null }
    | undefined;

  if (!row?.last_web_ip) return false;

  return normalizeIp(row.last_web_ip) === normalizeIp(ip);
}

export function createLoginChallenge(userId: number): string {
  return jwt.sign({ type: 'login_challenge', userId }, JWT_SECRET, { expiresIn: CHALLENGE_TTL });
}

export function parseLoginChallenge(token: string): number | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { type?: string; userId?: number };
    if (payload.type !== 'login_challenge' || !payload.userId) return null;
    return Number(payload.userId);
  } catch {
    return null;
  }
}

export function getUserEmailForLogin(userId: number): string | null {
  const row = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
  return row?.email ?? null;
}
