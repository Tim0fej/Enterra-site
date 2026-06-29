import { db } from '../db.js';
import { grantUserPrivilege } from './grantPrivilege.js';
import {
  resolveVipMonthsFromProducts,
  verifyEasyDonateSignature,
  type EasyDonateCallbackPayload,
} from './easydonate.js';
import {
  resolveShopProductKindFromProducts,
  shopProductKindLabel,
  type ShopProductKind,
} from '../../shared/easydonateConfig.js';
import { VIP_SLUG } from '../../shared/vipPlans.js';
import { recordShopFeedEvent } from './shopFeed.js';
import { fulfillShopProduct } from './shopFulfillment.js';

export interface EasyDonatePaymentRow {
  id: number;
  easydonate_payment_id: number;
  user_id: number | null;
  customer: string;
  amount_rub: number;
  months: number | null;
  product_id: number | null;
  product_kind: ShopProductKind | null;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export function getEasyDonatePayment(paymentId: number): EasyDonatePaymentRow | null {
  const row = db
    .prepare('SELECT * FROM easydonate_payments WHERE easydonate_payment_id = ?')
    .get(paymentId) as EasyDonatePaymentRow | undefined;
  return row ?? null;
}

export function recordEasyDonateCheckout(params: {
  paymentId: number;
  userId: number;
  customer: string;
  months: number | null;
  productId: number;
  productKind: ShopProductKind | null;
  amountRub?: number;
}): void {
  const existing = getEasyDonatePayment(params.paymentId);
  if (existing) return;

  db.prepare(`
    INSERT INTO easydonate_payments (
      easydonate_payment_id, user_id, customer, amount_rub, months, product_id, product_kind, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
    params.paymentId,
    params.userId,
    params.customer,
    params.amountRub ?? 0,
    params.months,
    params.productId,
    params.productKind,
  );
}

function findUserIdByCustomer(customer: string): number | null {
  const row = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(customer.trim()) as { id: number } | undefined;
  return row?.id ?? null;
}

function tryCompletePayment(paymentId: number): boolean {
  const result = db.prepare(`
    UPDATE easydonate_payments
    SET status = 'completed', completed_at = COALESCE(completed_at, datetime('now'))
    WHERE easydonate_payment_id = ? AND status = 'pending'
  `).run(paymentId);
  return result.changes === 1;
}

function resolveProductLabel(
  payload: EasyDonateCallbackPayload,
  months: number | null,
  productKind: ShopProductKind | null,
): string {
  if (months && [1, 3, 6].includes(months)) {
    return `VIP · ${months} мес.`;
  }
  if (productKind) {
    return shopProductKindLabel(productKind);
  }
  const name = payload.products?.[0]?.name?.trim();
  return name || 'товар в магазине';
}

function isVipMonths(months: number | null): months is 1 | 3 | 6 {
  return months !== null && [1, 3, 6].includes(months);
}

function firstProductId(payload: EasyDonateCallbackPayload): number | null {
  const first = payload.products?.[0];
  if (!first) return null;
  const productId = Number(first.product_id ?? first.id);
  return Number.isFinite(productId) && productId > 0 ? productId : null;
}

export function processEasyDonateCallback(payload: EasyDonateCallbackPayload): void {
  if (!verifyEasyDonateSignature(payload)) {
    throw new Error('Неверная подпись EasyDonate');
  }

  const paymentId = Number(payload.payment_id);
  if (!Number.isFinite(paymentId)) {
    throw new Error('Некорректный payment_id');
  }

  const existing = getEasyDonatePayment(paymentId);
  if (existing?.status === 'completed') {
    return;
  }

  const months = existing?.months ?? resolveVipMonthsFromProducts(payload.products) ?? null;
  const productKind =
    existing?.product_kind ??
    resolveShopProductKindFromProducts(payload.products, process.env) ??
    null;
  const productId = existing?.product_id ?? firstProductId(payload);
  const userId = existing?.user_id ?? findUserIdByCustomer(payload.customer);
  const label = resolveProductLabel(payload, months, productKind);

  if (!existing) {
    db.prepare(`
      INSERT INTO easydonate_payments (
        easydonate_payment_id, user_id, customer, amount_rub, months, product_id, product_kind, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      paymentId,
      userId,
      payload.customer,
      Number(payload.cost) || 0,
      months,
      productId,
      productKind,
    );
  }

  if (!tryCompletePayment(paymentId)) {
    return;
  }

  const completed = getEasyDonatePayment(paymentId);
  if (completed) {
    recordShopFeedEvent({
      source: 'easydonate',
      externalId: String(paymentId),
      kind: 'purchase',
      username: completed.customer,
      label: completed.months ? `VIP · ${completed.months} мес.` : label,
      amountRub: completed.amount_rub > 0 ? completed.amount_rub : Number(payload.cost) || null,
      createdAt: completed.completed_at ?? undefined,
    });
  }

  const kind = completed?.product_kind ?? productKind;

  if (userId && isVipMonths(months)) {
    grantUserPrivilege(
      userId,
      VIP_SLUG,
      userId,
      `EasyDonate #${paymentId}: VIP ${months} мес. (${payload.cost} ₽)`,
      null,
      { months },
    );
  }

  if (kind === 'unban' || kind === 'clear_warns') {
    fulfillShopProduct({
      kind,
      customer: payload.customer,
      userId,
      paymentId,
    });
  }
}
