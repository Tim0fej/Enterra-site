import { db } from '../db.js';
import {
  canCustomizeNameColor,
  normalizeNameColorInput,
} from '../../shared/nameColor.js';
import { getUserPrivilege } from './grantPrivilege.js';

export function getUserNameColor(userId: number): string | null {
  const row = db.prepare('SELECT name_color FROM users WHERE id = ?').get(userId) as
    | { name_color: string | null }
    | undefined;
  return row?.name_color?.trim() || null;
}

export function userCanCustomizeNameColor(userId: number): boolean {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as
    | { role: string }
    | undefined;
  if (!user) return false;
  const priv = getUserPrivilege(userId);
  return canCustomizeNameColor({ role: user.role, privilegeSlug: priv?.slug ?? null });
}

export function setUserNameColor(userId: number, color: string | null): void {
  db.prepare('UPDATE users SET name_color = ? WHERE id = ?').run(color, userId);
}

export function updateUserNameColor(userId: number, rawValue: string | null): string | null {
  if (!userCanCustomizeNameColor(userId)) {
    throw new Error('Цвет ника доступен VIP, медиа и администрации');
  }
  const normalized = normalizeNameColorInput(rawValue);
  setUserNameColor(userId, normalized);
  return normalized;
}
