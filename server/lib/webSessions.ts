import crypto from 'crypto';
import type { Request } from 'express';
import { db } from '../db.js';
import { getClientIp } from './clientIp.js';

const MAX_ACTIVE_SESSIONS = 15;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

const lastTouchAt = new Map<string, number>();

export interface WebSessionRow {
  id: string;
  user_id: number;
  ip: string | null;
  user_agent: string;
  device_label: string;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
}

export interface WebSessionPublic {
  id: string;
  deviceLabel: string;
  ipMasked: string | null;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export function parseDeviceLabel(userAgent: string): string {
  const ua = userAgent.trim();
  if (!ua) return 'Браузер';

  let os = 'Неизвестная ОС';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Браузер';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Chrome\//i.test(ua)) browser = 'Chrome';
  else if (/Safari\//i.test(ua)) browser = 'Safari';

  return `${browser} · ${os}`;
}

export function maskIp(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null;
  const parts = ip.trim().split('.');
  if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  if (ip.includes(':')) {
    const chunks = ip.split(':').filter(Boolean);
    if (chunks.length >= 2) return `${chunks[0]}:${chunks[1]}:…`;
  }
  return null;
}

function pruneRevokedSessions() {
  db.prepare(`
    DELETE FROM web_sessions
    WHERE revoked_at IS NOT NULL
      AND revoked_at < datetime('now', '-7 days')
  `).run();
}

function enforceSessionLimit(userId: number) {
  const rows = db
    .prepare(`
      SELECT id FROM web_sessions
      WHERE user_id = ? AND revoked_at IS NULL
      ORDER BY last_seen_at ASC
    `)
    .all(userId) as { id: string }[];

  const excess = rows.length - MAX_ACTIVE_SESSIONS + 1;
  if (excess <= 0) return;

  const revoke = db.prepare(`
    UPDATE web_sessions SET revoked_at = datetime('now') WHERE id = ?
  `);
  for (let i = 0; i < excess; i++) {
    revoke.run(rows[i]!.id);
  }
}

export function createWebSession(userId: number, req: Request): string {
  pruneRevokedSessions();
  enforceSessionLimit(userId);

  const id = crypto.randomUUID();
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent']?.trim().slice(0, 512) ?? '';
  const deviceLabel = parseDeviceLabel(userAgent);

  db.prepare(`
    INSERT INTO web_sessions (id, user_id, ip, user_agent, device_label)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, ip, userAgent, deviceLabel);

  return id;
}

export function isWebSessionActive(sessionId: string, userId: number): boolean {
  const row = db
    .prepare(`
      SELECT id FROM web_sessions
      WHERE id = ? AND user_id = ? AND revoked_at IS NULL
    `)
    .get(sessionId, userId) as { id: string } | undefined;
  return Boolean(row);
}

export function touchWebSession(sessionId: string) {
  const now = Date.now();
  const last = lastTouchAt.get(sessionId) ?? 0;
  if (now - last < TOUCH_INTERVAL_MS) return;

  lastTouchAt.set(sessionId, now);
  db.prepare(`
    UPDATE web_sessions SET last_seen_at = datetime('now') WHERE id = ? AND revoked_at IS NULL
  `).run(sessionId);
}

export function listWebSessions(userId: number, currentSessionId: string | null): WebSessionPublic[] {
  const rows = db
    .prepare(`
      SELECT id, device_label, ip, created_at, last_seen_at
      FROM web_sessions
      WHERE user_id = ? AND revoked_at IS NULL
      ORDER BY last_seen_at DESC
    `)
    .all(userId) as {
    id: string;
    device_label: string;
    ip: string | null;
    created_at: string;
    last_seen_at: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    deviceLabel: row.device_label,
    ipMasked: maskIp(row.ip),
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    current: currentSessionId === row.id,
  }));
}

export function revokeWebSession(sessionId: string, userId: number): boolean {
  const result = db
    .prepare(`
      UPDATE web_sessions
      SET revoked_at = datetime('now')
      WHERE id = ? AND user_id = ? AND revoked_at IS NULL
    `)
    .run(sessionId, userId);
  lastTouchAt.delete(sessionId);
  return result.changes > 0;
}

export function revokeOtherWebSessions(userId: number, keepSessionId: string | null): number {
  if (keepSessionId) {
    const result = db
      .prepare(`
        UPDATE web_sessions
        SET revoked_at = datetime('now')
        WHERE user_id = ? AND id != ? AND revoked_at IS NULL
      `)
      .run(userId, keepSessionId);
    return result.changes;
  }

  const result = db
    .prepare(`
      UPDATE web_sessions
      SET revoked_at = datetime('now')
      WHERE user_id = ? AND revoked_at IS NULL
    `)
    .run(userId);
  return result.changes;
}

export function revokeAllWebSessions(userId: number): number {
  const result = db
    .prepare(`
      UPDATE web_sessions
      SET revoked_at = datetime('now')
      WHERE user_id = ? AND revoked_at IS NULL
    `)
    .run(userId);
  return result.changes;
}
