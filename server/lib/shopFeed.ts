import { db } from '../db.js';
import {
  getDonationAlertsAccessToken,
  isDonationAlertsConfigured,
} from './donationAlertsOAuth.js';
import { fetchDonationAlertsWidgetDonations } from './donationAlertsWidget.js';

export type ShopFeedKind = 'purchase' | 'donation';

export interface ShopFeedRow {
  id: number;
  source: string;
  external_id: string;
  kind: ShopFeedKind;
  username: string;
  label: string;
  amount_rub: number | null;
  created_at: string;
}

export interface ShopFeedItem {
  id: number;
  kind: ShopFeedKind;
  username: string;
  label: string;
  amountRub: number | null;
  createdAt: string;
}

export function recordShopFeedEvent(params: {
  source: string;
  externalId: string;
  kind: ShopFeedKind;
  username: string;
  label: string;
  amountRub?: number | null;
  createdAt?: string;
}): void {
  const username = params.username.trim();
  if (!username) return;

  db.prepare(`
    INSERT INTO shop_feed_events (source, external_id, kind, username, label, amount_rub, created_at)
    VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')))
    ON CONFLICT(source, external_id) DO UPDATE SET
      kind = excluded.kind,
      username = excluded.username,
      label = excluded.label,
      amount_rub = excluded.amount_rub,
      created_at = excluded.created_at
  `).run(
    params.source,
    params.externalId,
    params.kind,
    username,
    params.label,
    params.amountRub ?? null,
    params.createdAt ?? null,
  );
}

export function listShopPurchases(limit = 30): ShopFeedItem[] {
  const rows = db
    .prepare(`
      SELECT id, kind, username, label, amount_rub, created_at
      FROM shop_feed_events
      WHERE kind = 'purchase'
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(limit) as Array<{
      id: number;
      kind: ShopFeedKind;
      username: string;
      label: string;
      amount_rub: number | null;
      created_at: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    username: row.username,
    label: row.label,
    amountRub: row.amount_rub,
    createdAt: row.created_at,
  }));
}

export function listShopFeed(limit = 30): ShopFeedItem[] {
  const rows = db
    .prepare(`
      SELECT id, kind, username, label, amount_rub, created_at
      FROM shop_feed_events
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `)
    .all(limit) as Array<{
      id: number;
      kind: ShopFeedKind;
      username: string;
      label: string;
      amount_rub: number | null;
      created_at: string;
    }>;

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    username: row.username,
    label: row.label,
    amountRub: row.amount_rub,
    createdAt: row.created_at,
  }));
}

export function backfillShopFeedFromEasyDonate(): number {
  const rows = db
    .prepare(`
      SELECT
        easydonate_payment_id,
        customer,
        amount_rub,
        months,
        completed_at,
        created_at
      FROM easydonate_payments
      WHERE status = 'completed'
    `)
    .all() as Array<{
      easydonate_payment_id: number;
      customer: string;
      amount_rub: number;
      months: number | null;
      completed_at: string | null;
      created_at: string;
    }>;

  for (const row of rows) {
    recordShopFeedEvent({
      source: 'easydonate',
      externalId: String(row.easydonate_payment_id),
      kind: 'purchase',
      username: row.customer,
      label: row.months ? `VIP · ${row.months} мес.` : 'товар в магазине',
      amountRub: row.amount_rub > 0 ? row.amount_rub : null,
      createdAt: row.completed_at ?? row.created_at,
    });
  }

  return rows.length;
}

function resolveDonationUsername(
  donorName: string,
  message?: string | null,
): string {
  const fromMessage = message?.match(/enterra\s*:\s*([A-Za-z0-9_]{3,16})/i)?.[1];
  if (fromMessage) return fromMessage;

  const trimmed = donorName.trim();
  if (!trimmed) return '';

  const siteUser = db
    .prepare('SELECT username FROM users WHERE username = ? COLLATE NOCASE')
    .get(trimmed) as { username: string } | undefined;
  return siteUser?.username ?? trimmed;
}

function parseDonationAmountRub(amount: string, currency: string): number | null {
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  const cur = currency.trim().toUpperCase();
  if (cur === 'RUB' || cur === 'RUR' || cur === '₽') return value;
  return value;
}

export async function syncDonationAlertsFeed(): Promise<number> {
  const token = await getDonationAlertsAccessToken();
  if (!token) return 0;

  const response = await fetch('https://www.donationalerts.com/api/v1/alerts/donations', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`DonationAlerts API HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    data?: Array<{
      id: number;
      username?: string;
      name?: string;
      amount?: string;
      currency?: string;
      message?: string;
      created_at?: string;
    }>;
  };

  let count = 0;
  for (const item of body.data ?? []) {
    const donorName = (item.username ?? item.name ?? '').trim();
    const username = resolveDonationUsername(donorName, item.message);
    if (!username) continue;

    recordShopFeedEvent({
      source: 'donationalerts',
      externalId: String(item.id),
      kind: 'donation',
      username,
      label: 'пожертвование',
      amountRub: parseDonationAmountRub(item.amount ?? '', item.currency ?? 'RUB'),
      createdAt: item.created_at ?? undefined,
    });
    count += 1;
  }

  return count;
}

export async function syncDonationAlertsWidgetFeed(): Promise<number> {
  const donations = await fetchDonationAlertsWidgetDonations();
  for (const item of donations) {
    recordShopFeedEvent({
      source: 'donationalerts',
      externalId: item.externalId,
      kind: 'donation',
      username: item.username,
      label: 'пожертвование',
      amountRub: item.amountRub,
      createdAt: item.createdAt,
    });
  }
  return donations.length;
}

async function syncDonationAlertsFeedSources(): Promise<void> {
  if (isDonationAlertsConfigured()) {
    await syncDonationAlertsFeed();
  }
  if (process.env.DONATION_ALERTS_WIDGET_TOKEN?.trim()) {
    await syncDonationAlertsWidgetFeed();
  }
}

export function startDonationAlertsFeedSync(): void {
  const hasWidget = Boolean(process.env.DONATION_ALERTS_WIDGET_TOKEN?.trim());
  if (!isDonationAlertsConfigured() && !hasWidget) {
    console.warn(
      'DonationAlerts: подключите OAuth в админке или задайте DONATION_ALERTS_WIDGET_TOKEN',
    );
    return;
  }

  const tick = () => {
    void syncDonationAlertsFeedSources().catch((err) => {
      console.error(
        'DonationAlerts feed sync:',
        err instanceof Error ? err.message : err,
      );
    });
  };

  tick();
  setInterval(tick, 60_000);
}
