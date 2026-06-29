import { db } from '../db.js';
import { enqueueModerationAction } from './moderation.js';
import type { ShopProductKind } from '../../shared/easydonateConfig.js';
import { shopProductKindLabel } from '../../shared/easydonateConfig.js';

function getShopStaffUserId(fallbackUserId: number | null): number {
  if (fallbackUserId) return fallbackUserId;
  const admin = db
    .prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;
  if (admin) return admin.id;
  const anyUser = db.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').get() as
    | { id: number }
    | undefined;
  return anyUser?.id ?? 1;
}

function countActiveWarnings(username: string): number {
  const row = db
    .prepare(`
      SELECT COUNT(*) AS count
      FROM mc_punishments
      WHERE type = 'warn' AND active = 1 AND target_username = ? COLLATE NOCASE
    `)
    .get(username.trim()) as { count: number };
  return row.count;
}

export function fulfillShopProduct(params: {
  kind: ShopProductKind;
  customer: string;
  userId: number | null;
  paymentId: number;
}): void {
  const staffUserId = getShopStaffUserId(params.userId);
  const reason = `EasyDonate #${params.paymentId}: ${shopProductKindLabel(params.kind)}`;

  if (params.kind === 'unban') {
    enqueueModerationAction({
      action: 'unban',
      targetUsername: params.customer,
      staffUserId,
      staffName: 'магазин',
      reason,
    });
    return;
  }

  if (params.kind === 'clear_warns') {
    const warnCount = countActiveWarnings(params.customer);
    const iterations = Math.max(warnCount, 1);
    for (let i = 0; i < iterations; i += 1) {
      enqueueModerationAction({
        action: 'unwarn',
        targetUsername: params.customer,
        staffUserId,
        staffName: 'магазин',
        reason,
      });
    }
  }
}
