import { db } from '../db.js';
import { revokeAllWebSessions } from './webSessions.js';

export function getTokenVersion(userId: number): number {
  const row = db.prepare('SELECT token_version FROM users WHERE id = ?').get(userId) as
    | { token_version: number }
    | undefined;
  return row?.token_version ?? 0;
}

/** Сбрасывает все активные JWT пользователя (смена пароля, роли и т.д.). */
export function bumpTokenVersion(userId: number): number {
  revokeAllWebSessions(userId);
  db.prepare(`
    UPDATE users
    SET token_version = COALESCE(token_version, 0) + 1
    WHERE id = ?
  `).run(userId);
  return getTokenVersion(userId);
}
