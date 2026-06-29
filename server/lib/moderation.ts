import { db } from '../db.js';
import type { UserRole } from '../auth.js';
import {
  buildModerationCommand,
  isValidMcUsername,
  isValidModDuration,
  normalizeMcUsername,
  type ModerationActionType,
  type ModerationQueueStatus,
  type PunishmentType,
} from '../../shared/moderation.js';

export interface ModerationQueueRow {
  id: number;
  action: ModerationActionType;
  target_username: string;
  duration: string | null;
  reason: string;
  staff_user_id: number;
  status: ModerationQueueStatus;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface PunishmentRow {
  litebans_id: number;
  type: PunishmentType;
  target_username: string;
  target_uuid: string | null;
  reason: string | null;
  staff_name: string | null;
  expires_at: string | null;
  active: number;
  synced_at: string;
}

const PROTECTED_ROLES = new Set<UserRole>(['admin', 'moderator']);

export function assertCanPunishTarget(targetUsername: string): void {
  const normalized = normalizeMcUsername(targetUsername);
  const row = db
    .prepare('SELECT role FROM users WHERE username = ? COLLATE NOCASE')
    .get(normalized) as { role: UserRole } | undefined;

  if (row && PROTECTED_ROLES.has(row.role)) {
    throw new Error('Нельзя наказать администрацию на сайте — обратитесь к главному админу');
  }
}

export function enqueueModerationAction(params: {
  action: ModerationActionType;
  targetUsername: string;
  duration?: string | null;
  reason?: string | null;
  staffUserId: number;
  staffName: string;
}): { id: number; command: string } {
  const target = normalizeMcUsername(params.targetUsername);
  if (!isValidMcUsername(target)) {
    throw new Error('Некорректный ник Minecraft (3–16 символов)');
  }

  if (params.duration && !isValidModDuration(params.duration)) {
    throw new Error('Некорректный срок: используйте формат 1h, 7d, 30d');
  }

  assertCanPunishTarget(target);

  const needsReason = ['ban', 'mute', 'warn', 'kick'].includes(params.action);
  const reason = params.reason?.trim() || (needsReason ? 'Нарушение правил' : '');

  if (needsReason && !reason) {
    throw new Error('Укажите причину');
  }

  const command = buildModerationCommand({
    action: params.action,
    target,
    duration: params.duration ?? null,
    reason,
    staffName: params.staffName,
  });

  const result = db
    .prepare(`
      INSERT INTO moderation_queue (action, target_username, duration, reason, staff_user_id, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `)
    .run(params.action, target, params.duration?.trim() || null, reason, params.staffUserId);

  return { id: Number(result.lastInsertRowid), command };
}

export function listPendingModerationActions(limit = 20): Array<
  ModerationQueueRow & { staff_username: string; command: string }
> {
  const rows = db
    .prepare(`
      SELECT q.*, u.username AS staff_username
      FROM moderation_queue q
      JOIN users u ON u.id = q.staff_user_id
      WHERE q.status = 'pending'
      ORDER BY q.id ASC
      LIMIT ?
    `)
    .all(limit) as Array<ModerationQueueRow & { staff_username: string }>;

  return rows.map((row) => ({
    ...row,
    command: buildModerationCommand({
      action: row.action,
      target: row.target_username,
      duration: row.duration,
      reason: row.reason,
      staffName: row.staff_username,
    }),
  }));
}

export function completeModerationAction(
  id: number,
  ok: boolean,
  errorMessage?: string | null,
): boolean {
  const result = db
    .prepare(`
      UPDATE moderation_queue
      SET status = ?, error_message = ?, processed_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `)
    .run(ok ? 'done' : 'failed', errorMessage?.trim() || null, id);
  return result.changes === 1;
}

export function listModerationHistory(limit = 40): Array<
  ModerationQueueRow & { staff_username: string }
> {
  return db
    .prepare(`
      SELECT q.*, u.username AS staff_username
      FROM moderation_queue q
      JOIN users u ON u.id = q.staff_user_id
      ORDER BY q.created_at DESC
      LIMIT ?
    `)
    .all(limit) as Array<ModerationQueueRow & { staff_username: string }>;
}

export function listActivePunishments(type?: PunishmentType): PunishmentRow[] {
  if (type) {
    return db
      .prepare(`
        SELECT * FROM mc_punishments
        WHERE active = 1 AND type = ?
        ORDER BY synced_at DESC, litebans_id DESC
      `)
      .all(type) as PunishmentRow[];
  }

  return db
    .prepare(`
      SELECT * FROM mc_punishments
      WHERE active = 1
      ORDER BY type ASC, synced_at DESC, litebans_id DESC
    `)
    .all() as PunishmentRow[];
}

export interface PunishmentSyncItem {
  litebansId: number;
  type: PunishmentType;
  targetUsername: string;
  targetUuid?: string | null;
  reason?: string | null;
  staffName?: string | null;
  expiresAt?: string | null;
}

export function syncPunishmentsFromServer(items: PunishmentSyncItem[]): void {
  const grouped = new Map<PunishmentType, PunishmentSyncItem[]>();
  for (const item of items) {
    if (!grouped.has(item.type)) grouped.set(item.type, []);
    grouped.get(item.type)!.push(item);
  }

  const syncType = db.transaction((type: PunishmentType, rows: PunishmentSyncItem[]) => {
    db.prepare('UPDATE mc_punishments SET active = 0 WHERE type = ?').run(type);
    const upsert = db.prepare(`
      INSERT INTO mc_punishments (
        litebans_id, type, target_username, target_uuid, reason, staff_name, expires_at, active, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
      ON CONFLICT(type, litebans_id) DO UPDATE SET
        target_username = excluded.target_username,
        target_uuid = excluded.target_uuid,
        reason = excluded.reason,
        staff_name = excluded.staff_name,
        expires_at = excluded.expires_at,
        active = 1,
        synced_at = datetime('now')
    `);

    for (const row of rows) {
      upsert.run(
        row.litebansId,
        type,
        row.targetUsername,
        row.targetUuid ?? null,
        row.reason ?? null,
        row.staffName ?? null,
        row.expiresAt ?? null,
      );
    }
  });

  for (const type of ['ban', 'mute', 'warn'] as const) {
    syncType(type, grouped.get(type) ?? []);
  }
}

export function listRecentPurchases(limit = 30) {
  return db
    .prepare(`
      SELECT
        ep.id,
        ep.easydonate_payment_id,
        ep.customer,
        ep.amount_rub,
        ep.months,
        ep.status,
        ep.created_at,
        ep.completed_at,
        u.username AS site_username
      FROM easydonate_payments ep
      LEFT JOIN users u ON u.id = ep.user_id
      ORDER BY ep.created_at DESC
      LIMIT ?
    `)
    .all(limit) as Array<{
      id: number;
      easydonate_payment_id: number;
      customer: string;
      amount_rub: number;
      months: number | null;
      status: 'pending' | 'completed';
      created_at: string;
      completed_at: string | null;
      site_username: string | null;
    }>;
}
