import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import {
  ensureAccessCodeFresh,
  isAccessCodeActive,
  toIsoTimestamp,
} from './accessCode.js';
import { getUserPrivilege } from './grantPrivilege.js';
import { normalizeMediaPlatform, resolveDisplayGroup, resolveLuckPermsGroup } from '../../shared/displayGroup.js';
import { getUserNameColor, userCanCustomizeNameColor } from './nameColor.js';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  accessCode: string;
  codeVerified: boolean;
  codeExpiresAt: string;
  emailVerified: boolean;
  createdAt: string;
  privilege: {
    slug: string;
    name: string;
    color: string;
    mediaPlatform: ReturnType<typeof normalizeMediaPlatform>;
    expiresAt: string | null;
  } | null;
  displayGroup: ReturnType<typeof resolveDisplayGroup>;
  luckPermsGroup: ReturnType<typeof resolveLuckPermsGroup>;
  mediaPlatform: ReturnType<typeof normalizeMediaPlatform>;
  nameColor: string | null;
  nameColorAllowed: boolean;
}

export function getUserProfile(userId: number): UserProfile | null {
  ensureAccessCodeFresh(userId);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as
    | {
        id: number;
        username: string;
        email: string;
        access_code: string;
        role: 'user' | 'admin' | 'moderator';
        code_verified_at: string | null;
        code_expires_at: string | null;
        email_verified_at: string | null;
        created_at: string;
      }
    | undefined;

  if (!user) return null;

  const priv = getUserPrivilege(user.id);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    accessCode: user.access_code,
    codeVerified: isAccessCodeActive(user),
    codeExpiresAt: user.code_expires_at ? toIsoTimestamp(user.code_expires_at) : toIsoTimestamp(user.created_at),
    emailVerified: Boolean(user.email_verified_at),
    createdAt: user.created_at,
    privilege: priv
      ? {
          slug: priv.slug,
          name: priv.name,
          color: priv.color,
          mediaPlatform: priv.mediaPlatform,
          expiresAt: priv.expiresAt ? toIsoTimestamp(priv.expiresAt) : null,
        }
      : null,
    displayGroup: resolveDisplayGroup(user.role, priv?.slug, priv?.mediaPlatform),
    luckPermsGroup: resolveLuckPermsGroup(user.role, priv?.slug, priv?.mediaPlatform),
    mediaPlatform: priv?.mediaPlatform ?? normalizeMediaPlatform(null),
    nameColor: getUserNameColor(user.id),
    nameColorAllowed: userCanCustomizeNameColor(user.id),
  };
}

export function verifyCurrentPassword(userId: number, password: string): boolean {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as
    | { password_hash: string }
    | undefined;
  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}
