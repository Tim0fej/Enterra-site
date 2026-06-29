import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, type AuthRequest } from '../auth.js';
import { normalizeMediaPlatform } from '../../shared/displayGroup.js';
import { PRIVILEGE_BENEFITS } from '../../shared/privilegeBenefits.js';
import { getMediaTicketMetricLabels, type MediaPlatformName } from '../../shared/mediaRequirements.js';
import { DONATION_ALERTS_URL } from '../../shared/supportConfig.js';
import { buildVipPlans, getVipPlanPrice, isVipPlanMonths } from '../../shared/vipPlans.js';
import { loadEnv } from '../env.js';
import { secureCompareSecret } from '../lib/secureCompare.js';
import { parseYooWebhook } from '../lib/yookassa.js';
import { validateUserContent } from '../lib/spamGuard.js';
import {
  linkAttachmentsToTicketMessage,
  parseAttachmentIds,
} from '../lib/attachments.js';
import { VIP_MONTHLY_PRICE_RUB } from '../../shared/vipPlans.js';
import {
  createVipPaymentCheckout,
  getVipPaymentOrder,
  isVipPurchaseEnabled,
  processYookassaNotification,
  syncVipPaymentFromYoo,
} from '../lib/vipPayment.js';
import {
  createEasyDonatePayment,
  getEasyDonateShopUrl,
  isEasyDonateConfigured,
  type EasyDonateCallbackPayload,
} from '../lib/easydonate.js';
import {
  processEasyDonateCallback,
  recordEasyDonateCheckout,
} from '../lib/easydonatePayments.js';
import { parseEasyDonateVipProductId } from '../../shared/easydonateConfig.js';

const router = Router();
const env = loadEnv();

const SERVER_MONTHLY_COST = Number(process.env.SERVER_MONTHLY_COST) || 1500;

router.get('/', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT slug, name, description, color, price_rub, billing_period, purchasable
      FROM privilege_tiers
      ORDER BY sort_order
    `)
    .all() as {
      slug: string;
      name: string;
      description: string;
      color: string;
      price_rub: number | null;
      billing_period: string | null;
      purchasable: number;
    }[];

  const privileges = rows.map((tier) => ({
    slug: tier.slug,
    name: tier.name,
    description: tier.description,
    color: tier.color,
    price_rub: tier.price_rub,
    billing_period: tier.billing_period,
    purchasable: Boolean(tier.purchasable),
    benefits: PRIVILEGE_BENEFITS[tier.slug] ?? [],
  }));

  res.json({
    title: 'Поддержка проекта Enterra',
    description:
      'Enterra — некоммерческий ванильный сервер. Поддержка помогает оплачивать хостинг. VIP и донаты — через EasyDonate.',
    serverCost: {
      monthlyRub: SERVER_MONTHLY_COST,
      label: `Содержание сервера — от ${SERVER_MONTHLY_COST} ₽/мес`,
      note: 'Хостинг, резервные копии и обновления.',
    },
    privileges,
    vipPlans: isVipPurchaseEnabled() ? buildVipPlans() : [],
    boostyUrl: process.env.SUPPORT_BOOSTY_URL ?? '',
    donationAlertsUrl: process.env.SUPPORT_DONATION_ALERTS_URL ?? DONATION_ALERTS_URL,
    easydonateEnabled: isEasyDonateConfigured(),
    easydonateShopUrl: getEasyDonateShopUrl(),
    vipPurchaseEnabled: isVipPurchaseEnabled(),
  });
});

router.post('/easydonate/checkout', authMiddleware, async (req: AuthRequest, res) => {
  if (!isEasyDonateConfigured()) {
    res.status(503).json({ error: 'Оплата через EasyDonate временно недоступна' });
    return;
  }

  const { months } = req.body as { months?: number };
  if (!isVipPlanMonths(months)) {
    res.status(400).json({ error: 'Срок VIP: 1, 3 или 6 месяцев' });
    return;
  }

  const returnBase =
    process.env.EASYDONATE_SUCCESS_URL?.trim() ||
    (env.siteUrl ? `${env.siteUrl}/shop?payment=success` : '');

  if (!returnBase) {
    res.status(503).json({ error: 'Не настроен SITE_URL для возврата после оплаты' });
    return;
  }

  try {
    const emailRow = db
      .prepare('SELECT email FROM users WHERE id = ?')
      .get(req.user!.id) as { email: string } | undefined;
    if (!emailRow?.email) {
      res.status(400).json({ error: 'У аккаунта не указан email' });
      return;
    }

    const checkout = await createEasyDonatePayment({
      customer: req.user!.username,
      email: emailRow.email,
      months,
      successUrl: returnBase,
    });

    recordEasyDonateCheckout({
      paymentId: checkout.paymentId,
      userId: req.user!.id,
      customer: req.user!.username,
      months: months ?? null,
      productId: parseEasyDonateVipProductId(months, process.env) ?? 0,
      productKind: 'vip',
      amountRub: getVipPlanPrice(months),
    });

    res.json({
      ok: true,
      paymentId: checkout.paymentId,
      paymentUrl: checkout.paymentUrl,
      message: 'Перенаправляем на оплату…',
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Не удалось создать платёж',
    });
  }
});

router.post('/easydonate/webhook', (req, res) => {
  const payload = req.body as EasyDonateCallbackPayload;
  if (!payload?.payment_id || !payload.customer || payload.cost === undefined || !payload.signature) {
    res.status(400).json({ success: false, error: 'Invalid payload' });
    return;
  }

  try {
    processEasyDonateCallback(payload);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('EasyDonate webhook error:', err instanceof Error ? err.message : err);
    res.status(400).json({ success: false, error: 'Verification failed' });
  }
});

router.post('/purchase', authMiddleware, async (req: AuthRequest, res) => {
  if (!isVipPurchaseEnabled()) {
    res.status(503).json({ error: 'Оформление VIP временно недоступно' });
    return;
  }

  const { tierSlug, months } = req.body as { tierSlug?: string; months?: number };

  if (!tierSlug) {
    res.status(400).json({ error: 'Укажите tierSlug' });
    return;
  }

  if (!isVipPlanMonths(months)) {
    res.status(400).json({ error: 'Срок VIP: 1, 3 или 6 месяцев' });
    return;
  }

  const returnBase =
    process.env.YOOKASSA_RETURN_URL?.trim() ||
    (env.siteUrl ? `${env.siteUrl}/support?payment=return` : '');

  if (!returnBase) {
    res.status(503).json({ error: 'Не настроен SITE_URL для возврата после оплаты' });
    return;
  }

  try {
    const checkout = await createVipPaymentCheckout({
      userId: req.user!.id,
      username: req.user!.username,
      tierSlug,
      months,
      returnUrlBase: returnBase,
    });

    res.json({
      ok: true,
      orderId: checkout.orderId,
      confirmationUrl: checkout.confirmationUrl,
      message: 'Перенаправляем на оплату…',
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Не удалось создать платёж',
    });
  }
});

router.get('/payment/:orderId', authMiddleware, async (req: AuthRequest, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isFinite(orderId)) {
    res.status(400).json({ error: 'Некорректный номер заказа' });
    return;
  }

  const order = getVipPaymentOrder(orderId, req.user!.id);
  if (!order) {
    res.status(404).json({ error: 'Заказ не найден' });
    return;
  }

  try {
    const synced = await syncVipPaymentFromYoo(order);
    res.json({
      orderId: synced.id,
      status: synced.status,
      tierSlug: synced.tier_slug,
      months: synced.months,
      amountRub: synced.amount_rub,
      completed: synced.status === 'succeeded',
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Не удалось проверить оплату',
    });
  }
});

router.post('/yookassa/webhook', async (req, res) => {
  const { isProd } = loadEnv();
  const webhookSecret = process.env.YOOKASSA_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    if (isProd) {
      res.status(503).json({ error: 'Webhook not configured' });
      return;
    }
  } else {
    const provided = req.headers['x-yookassa-webhook-secret'];
    if (!secureCompareSecret(provided, webhookSecret)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
  }

  const notification = parseYooWebhook(req.body);
  if (!notification) {
    res.status(400).json({ error: 'Invalid notification' });
    return;
  }

  const paymentId = notification.object.id;

  try {
    if (
      notification.event === 'payment.succeeded' ||
      notification.event === 'payment.waiting_for_capture' ||
      notification.event === 'payment.canceled'
    ) {
      await processYookassaNotification(paymentId);
    }
    res.status(200).send('OK');
  } catch (err) {
    console.error('YooKassa webhook error:', err instanceof Error ? err.message : err);
    res.status(500).send('Error');
  }
});

router.post('/media-application', authMiddleware, (req: AuthRequest, res) => {
  const { platform, channelUrl, subscribers, views, content } = req.body as {
    platform?: string;
    channelUrl?: string;
    subscribers?: string;
    views?: string;
    content?: string;
  };

  if (!platform?.trim() || !channelUrl?.trim() || !subscribers?.trim() || !views?.trim() || !content?.trim()) {
    res.status(400).json({ error: 'Заполните все поля заявки' });
    return;
  }

  const spamError = validateUserContent(content.trim(), req.user!.id);
  if (spamError) {
    res.status(400).json({ error: spamError });
    return;
  }

  const mediaPlatform = normalizeMediaPlatform(platform);
  if (!mediaPlatform) {
    res.status(400).json({ error: 'Доступны только YouTube, Twitch и TikTok' });
    return;
  }

  const platformLabel =
    mediaPlatform === 'youtube' ? 'YouTube' : mediaPlatform === 'twitch' ? 'Twitch' : 'TikTok';

  const metricLabels = getMediaTicketMetricLabels(platformLabel as MediaPlatformName);

  const body = [
    `Площадка: ${platformLabel}`,
    `Ссылка: ${channelUrl.trim()}`,
    `${metricLabels.audience}: ${subscribers.trim()}`,
    `${metricLabels.metric}: ${views.trim()}`,
    '',
    'Описание:',
    content.trim(),
  ].join('\n');

  const ticketId = db.transaction(() => {
    const ticket = db
      .prepare("INSERT INTO tickets (user_id, title, type) VALUES (?, ?, 'media')")
      .run(req.user!.id, `Заявка ${platformLabel} — ${req.user!.username}`);

    const id = Number(ticket.lastInsertRowid);

    db.prepare('INSERT INTO ticket_messages (ticket_id, user_id, content) VALUES (?, ?, ?)').run(
      id,
      req.user!.id,
      body,
    );

    return id;
  })();

  res.status(201).json({ ticketId, message: 'Заявка отправлена. Ответ придёт в чат поддержки.' });
});

router.post('/vip-request', authMiddleware, (req: AuthRequest, res) => {
  if (isEasyDonateConfigured()) {
    res.status(400).json({
      error: 'VIP оформляется через EasyDonate на странице «Оформить VIP»',
    });
    return;
  }

  const { paymentReference, note, attachmentIds: rawAttachmentIds } = req.body as {
    paymentReference?: string;
    note?: string;
    attachmentIds?: unknown;
  };

  const ref = paymentReference?.trim();
  if (!ref) {
    res.status(400).json({ error: 'Укажите ссылку или ID платежа DonationAlerts' });
    return;
  }

  const attachmentIds = parseAttachmentIds(rawAttachmentIds);
  if (attachmentIds.length === 0) {
    res.status(400).json({ error: 'Прикрепите скриншот оплаты' });
    return;
  }

  const extra = note?.trim() ?? '';
  if (extra) {
    const spamError = validateUserContent(extra, req.user!.id);
    if (spamError) {
      res.status(400).json({ error: spamError });
      return;
    }
  }

  const body = [
    `Заявка на VIP — ${VIP_MONTHLY_PRICE_RUB} ₽ / 1 месяц`,
    `Платёж DonationAlerts: ${ref}`,
    extra ? `\nКомментарий:\n${extra}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ticketId = db.transaction(() => {
      const ticket = db
        .prepare("INSERT INTO tickets (user_id, title, type) VALUES (?, ?, 'vip')")
        .run(req.user!.id, `VIP — ${req.user!.username}`);

      const id = Number(ticket.lastInsertRowid);

      const message = db
        .prepare('INSERT INTO ticket_messages (ticket_id, user_id, content) VALUES (?, ?, ?)')
        .run(id, req.user!.id, body);

      linkAttachmentsToTicketMessage(req.user!.id, Number(message.lastInsertRowid), attachmentIds);

      return id;
    })();

    res.status(201).json({
      ticketId,
      message: 'Заявка на VIP отправлена. Ответ придёт в чат поддержки.',
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось создать тикет' });
  }
});

export default router;
