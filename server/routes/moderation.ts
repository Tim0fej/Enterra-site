import { Router } from 'express';
import { authMiddleware, staffMiddleware, type AuthRequest } from '../auth.js';
import {
  enqueueModerationAction,
  listActivePunishments,
  listModerationHistory,
  listRecentPurchases,
  type PunishmentRow,
} from '../lib/moderation.js';
import {
  MODERATION_ACTION_LABELS,
  type ModerationActionType,
  type PunishmentType,
} from '../../shared/moderation.js';

const router = Router();

const STAFF_ACTIONS = new Set<ModerationActionType>([
  'ban',
  'unban',
  'mute',
  'unmute',
  'warn',
  'unwarn',
  'kick',
]);

function mapPurchase(row: ReturnType<typeof listRecentPurchases>[number]) {
  const label = row.months ? `VIP · ${row.months} мес.` : 'Покупка в магазине';
  return {
    id: row.id,
    paymentId: row.easydonate_payment_id,
    username: row.site_username ?? row.customer,
    amountRub: row.amount_rub,
    label,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapPunishment(row: PunishmentRow) {
  return {
    id: row.litebans_id,
    type: row.type,
    targetUsername: row.target_username,
    targetUuid: row.target_uuid,
    reason: row.reason,
    staffName: row.staff_name,
    expiresAt: row.expires_at,
    syncedAt: row.synced_at,
  };
}

router.get('/purchases/recent', authMiddleware, staffMiddleware, (_req, res) => {
  res.json({ purchases: listRecentPurchases(30).map(mapPurchase) });
});

router.get('/punishments', authMiddleware, staffMiddleware, (req, res) => {
  const type = typeof req.query.type === 'string' ? (req.query.type as PunishmentType) : undefined;
  if (type && !['ban', 'mute', 'warn'].includes(type)) {
    res.status(400).json({ error: 'type: ban | mute | warn' });
    return;
  }

  const punishments = listActivePunishments(type).map(mapPunishment);
  res.json({ punishments });
});

router.get('/history', authMiddleware, staffMiddleware, (_req, res) => {
  const rows = listModerationHistory(50).map((row) => ({
    id: row.id,
    action: row.action,
    actionLabel: MODERATION_ACTION_LABELS[row.action],
    targetUsername: row.target_username,
    duration: row.duration,
    reason: row.reason,
    staffUsername: row.staff_username,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  }));
  res.json({ history: rows });
});

router.post('/actions', authMiddleware, staffMiddleware, (req: AuthRequest, res) => {
  const { action, targetUsername, duration, reason } = req.body as {
    action?: ModerationActionType;
    targetUsername?: string;
    duration?: string | null;
    reason?: string | null;
  };

  if (!action || !STAFF_ACTIONS.has(action)) {
    res.status(400).json({ error: 'Укажите действие: ban, unban, mute, unmute, warn, unwarn, kick' });
    return;
  }

  if (!targetUsername?.trim()) {
    res.status(400).json({ error: 'Укажите ник игрока' });
    return;
  }

  try {
    const queued = enqueueModerationAction({
      action,
      targetUsername,
      duration,
      reason,
      staffUserId: req.user!.id,
      staffName: req.user!.username,
    });

    res.status(201).json({
      ok: true,
      queueId: queued.id,
      message: 'Команда поставлена в очередь — сервер выполнит в течение минуты',
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Не удалось создать действие',
    });
  }
});

export default router;
