import { db } from '../db.js';
import { getUserPrivilege, grantUserPrivilege } from './grantPrivilege.js';
import {
  buildVipPlans,
  getVipPlanPrice,
  isVipPlanMonths,
  VIP_SLUG,
  type VipPlanMonths,
} from '../../shared/vipPlans.js';
import {
  createYooPayment,
  formatRubAmount,
  getYooPayment,
  isYookassaConfigured,
  type YooPaymentStatus,
} from './yookassa.js';

export type VipPaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';

export interface VipPaymentRow {
  id: number;
  user_id: number;
  tier_slug: string;
  amount_rub: number;
  months: number;
  yookassa_payment_id: string | null;
  status: VipPaymentStatus;
  created_at: string;
  completed_at: string | null;
}

function mapYooStatus(status: YooPaymentStatus): VipPaymentStatus {
  return status;
}

export function getVipPaymentOrder(orderId: number, userId?: number): VipPaymentRow | null {
  const row = userId
    ? (db
        .prepare('SELECT * FROM vip_payments WHERE id = ? AND user_id = ?')
        .get(orderId, userId) as VipPaymentRow | undefined)
    : (db.prepare('SELECT * FROM vip_payments WHERE id = ?').get(orderId) as VipPaymentRow | undefined);
  return row ?? null;
}

export function getVipPaymentByYookassaId(paymentId: string): VipPaymentRow | null {
  const row = db
    .prepare('SELECT * FROM vip_payments WHERE yookassa_payment_id = ?')
    .get(paymentId) as VipPaymentRow | undefined;
  return row ?? null;
}

function updateOrderStatus(orderId: number, status: VipPaymentStatus, completedAt?: string) {
  db.prepare(`
    UPDATE vip_payments
    SET status = ?, completed_at = COALESCE(?, completed_at)
    WHERE id = ?
  `).run(status, completedAt ?? null, orderId);
}

function tryClaimOrder(orderId: number): boolean {
  const result = db.prepare(`
    UPDATE vip_payments
    SET status = 'succeeded', completed_at = COALESCE(completed_at, datetime('now'))
    WHERE id = ? AND status IN ('pending', 'waiting_for_capture')
  `).run(orderId);
  return result.changes === 1;
}

function fulfillOrder(order: VipPaymentRow, paymentId: string): { alreadyDone: boolean } {
  if (order.status === 'succeeded') {
    return { alreadyDone: true };
  }

  if (!tryClaimOrder(order.id)) {
    return { alreadyDone: true };
  }

  const tier = db
    .prepare('SELECT slug, name, price_rub FROM privilege_tiers WHERE slug = ?')
    .get(order.tier_slug) as { slug: string; name: string; price_rub: number } | undefined;

  if (!tier) {
    throw new Error('Тариф не найден');
  }

  const months = isVipPlanMonths(order.months) ? order.months : 1;

  grantUserPrivilege(
    order.user_id,
    order.tier_slug,
    order.user_id,
    `ЮKassa: ${tier.name} ${months} мес. (${order.amount_rub} ₽), платёж ${paymentId}`,
    null,
    { months },
  );

  return { alreadyDone: false };
}

export async function syncVipPaymentFromYoo(order: VipPaymentRow): Promise<VipPaymentRow> {
  if (!order.yookassa_payment_id) {
    return order;
  }

  if (order.status === 'succeeded' || order.status === 'canceled') {
    return order;
  }

  const payment = await getYooPayment(order.yookassa_payment_id);
  const status = mapYooStatus(payment.status);

  if (status !== order.status) {
    updateOrderStatus(order.id, status, status === 'succeeded' ? new Date().toISOString() : undefined);
    order = getVipPaymentOrder(order.id)!;
  }

  if (payment.status === 'succeeded' && payment.paid) {
    const expected = formatRubAmount(order.amount_rub);
    if (payment.amount.value !== expected || payment.amount.currency !== 'RUB') {
      throw new Error('Сумма платежа не совпадает с заказом');
    }

    const metaUserId = payment.metadata?.user_id;
    const metaOrderId = payment.metadata?.order_id;
    if (metaUserId && Number(metaUserId) !== order.user_id) {
      throw new Error('Платёж привязан к другому пользователю');
    }
    if (metaOrderId && Number(metaOrderId) !== order.id) {
      throw new Error('Платёж привязан к другому заказу');
    }

    fulfillOrder(order, payment.id);
    return getVipPaymentOrder(order.id)!;
  }

  return order;
}

export async function processYookassaNotification(paymentId: string): Promise<void> {
  const order = getVipPaymentByYookassaId(paymentId);
  if (!order) {
    console.warn(`YooKassa webhook: unknown payment ${paymentId}`);
    return;
  }
  await syncVipPaymentFromYoo(order);
}

export async function createVipPaymentCheckout(params: {
  userId: number;
  username: string;
  tierSlug: string;
  months: VipPlanMonths;
  returnUrlBase: string;
}): Promise<{ orderId: number; confirmationUrl: string }> {
  if (params.tierSlug !== VIP_SLUG) {
    throw new Error('Онлайн-оплата доступна только для VIP');
  }

  if (!isVipPlanMonths(params.months)) {
    throw new Error('Выберите срок VIP: 1, 3 или 6 месяцев');
  }

  const tier = db
    .prepare(`
      SELECT slug, name, price_rub, billing_period, purchasable
      FROM privilege_tiers
      WHERE slug = ? AND purchasable = 1
    `)
    .get(params.tierSlug) as
    | { slug: string; name: string; price_rub: number; billing_period: string; purchasable: number }
    | undefined;

  if (!tier) {
    throw new Error('Тариф не найден или недоступен для покупки');
  }

  const amountRub = getVipPlanPrice(params.months);
  const existing = getUserPrivilege(params.userId);
  if (existing?.slug === tier.slug && !existing.expiresAt) {
    throw new Error('У тебя уже есть бессрочный VIP');
  }

  const pending = db
    .prepare(`
      SELECT id FROM vip_payments
      WHERE user_id = ? AND tier_slug = ? AND months = ? AND status IN ('pending', 'waiting_for_capture')
      ORDER BY id DESC
      LIMIT 1
    `)
    .get(params.userId, tier.slug, params.months) as { id: number } | undefined;

  if (pending) {
    const existingOrder = getVipPaymentOrder(pending.id, params.userId)!;
    if (existingOrder.yookassa_payment_id) {
      const payment = await getYooPayment(existingOrder.yookassa_payment_id);
      if (payment.status === 'pending' && payment.confirmation?.confirmation_url) {
        return {
          orderId: existingOrder.id,
          confirmationUrl: payment.confirmation.confirmation_url,
        };
      }
    }
  }

  const insert = db
    .prepare(`
      INSERT INTO vip_payments (user_id, tier_slug, amount_rub, months, status)
      VALUES (?, ?, ?, ?, 'pending')
    `)
    .run(params.userId, tier.slug, amountRub, params.months);

  const orderId = Number(insert.lastInsertRowid);
  const returnUrl = `${params.returnUrlBase}${params.returnUrlBase.includes('?') ? '&' : '?'}order=${orderId}`;

  const periodLabel = buildVipPlans().find((plan) => plan.months === params.months)?.label ?? `${params.months} мес`;
  const payment = await createYooPayment({
    amountRub,
    description: `Enterra ${tier.name} — ${periodLabel} (${params.username})`,
    returnUrl,
    metadata: {
      order_id: String(orderId),
      user_id: String(params.userId),
      tier_slug: tier.slug,
      months: String(params.months),
    },
  });

  if (!payment.confirmation?.confirmation_url) {
    throw new Error('ЮKassa не вернула ссылку на оплату');
  }

  db.prepare(`
    UPDATE vip_payments
    SET yookassa_payment_id = ?, status = ?
    WHERE id = ?
  `).run(payment.id, mapYooStatus(payment.status), orderId);

  return { orderId, confirmationUrl: payment.confirmation.confirmation_url };
}

export function isVipPurchaseEnabled(): boolean {
  return process.env.VIP_PURCHASE_ENABLED === 'true' && isYookassaConfigured();
}
