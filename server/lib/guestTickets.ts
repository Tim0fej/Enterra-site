import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateAccessCode } from '../db.js';
import {
  GUEST_TICKET_USER_EMAIL,
  GUEST_TICKET_USER_USERNAME,
} from '../../shared/guestTicketConfig.js';

let cachedGuestUserId: number | null = null;

export function ensureGuestTicketUser(): number {
  if (cachedGuestUserId) return cachedGuestUserId;

  const existing = db
    .prepare('SELECT id FROM users WHERE LOWER(email) = ?')
    .get(GUEST_TICKET_USER_EMAIL.toLowerCase()) as { id: number } | undefined;

  if (existing) {
    cachedGuestUserId = existing.id;
    return existing.id;
  }

  const passwordHash = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 10);
  const result = db
    .prepare(`
      INSERT INTO users (username, email, password_hash, access_code, email_verified_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `)
    .run(GUEST_TICKET_USER_USERNAME, GUEST_TICKET_USER_EMAIL, passwordHash, generateAccessCode());

  cachedGuestUserId = Number(result.lastInsertRowid);
  return cachedGuestUserId;
}

export function getGuestTicketUserId(): number {
  return ensureGuestTicketUser();
}

export function generateGuestTicketToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export interface GuestTicketAccessEntry {
  id: number;
  token: string;
}

export function parseGuestTicketAccessHeader(header: string | undefined): GuestTicketAccessEntry[] {
  if (!header?.trim()) return [];

  const entries: GuestTicketAccessEntry[] = [];
  for (const part of header.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(':');
    if (colon <= 0) continue;
    const id = Number.parseInt(trimmed.slice(0, colon), 10);
    const token = trimmed.slice(colon + 1).trim();
    if (!Number.isInteger(id) || id <= 0 || !/^[a-f0-9]{32,64}$/i.test(token)) continue;
    entries.push({ id, token });
  }

  return entries;
}

export function guestSpamUserId(email: string): number {
  let hash = 0;
  for (const char of email.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return hash || -1;
}
