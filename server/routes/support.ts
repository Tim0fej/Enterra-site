import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, type AuthRequest } from '../auth.js';
import { getUserPrivilege, grantUserPrivilege } from '../lib/grantPrivilege.js';
import { normalizeMediaPlatform } from '../../shared/displayGroup.js';
import { PRIVILEGE_BENEFITS } from '../../shared/privilegeBenefits.js';

const router = Router();

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
      'Enterra — некоммерческий ванильный сервер. Поддержка помогает оплачивать хостинг. Vip оформляется на сайте, YouTube / Twitch / TikTok — по заявке.',
    serverCost: {
      monthlyRub: SERVER_MONTHLY_COST,
      label: `Содержание сервера — от ${SERVER_MONTHLY_COST} ₽/мес`,
      note: 'Хостинг, резервные копии и обновления. Без поддержки игроков сервер не сможет работать 24/7.',
    },
    privileges,
    boostyUrl: process.env.SUPPORT_BOOSTY_URL ?? '',
  });
});

router.post('/purchase', authMiddleware, (req: AuthRequest, res) => {
  const { tierSlug } = req.body as { tierSlug?: string };

  if (!tierSlug) {
    res.status(400).json({ error: 'Укажите tierSlug' });
    return;
  }

  const tier = db
    .prepare(`
      SELECT slug, name, price_rub, billing_period, purchasable
      FROM privilege_tiers
      WHERE slug = ? AND purchasable = 1
    `)
    .get(tierSlug) as
    | { slug: string; name: string; price_rub: number; billing_period: string; purchasable: number }
    | undefined;

  if (!tier) {
    res.status(404).json({ error: 'Тариф не найден или недоступен для покупки' });
    return;
  }

  const existing = getUserPrivilege(req.user!.id);
  if (existing?.slug === tier.slug) {
    res.status(400).json({ error: 'У тебя уже есть эта привилегия' });
    return;
  }

  const privilege = (() => {
    try {
      return grantUserPrivilege(
        req.user!.id,
        tier.slug,
        req.user!.id,
        `Авто: оформление ${tier.name} (${tier.price_rub} ₽/${tier.billing_period === 'month' ? 'мес' : tier.billing_period})`,
      );
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Не удалось выдать привилегию',
      });
      return null;
    }
  })();

  if (!privilege) return;

  res.json({
    ok: true,
    privilege,
    message: `Статус ${tier.name} выдан. Если ты в игре — группа обновится автоматически в течение минуты.`,
  });
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

  const mediaPlatform = normalizeMediaPlatform(platform);
  if (!mediaPlatform) {
    res.status(400).json({ error: 'Доступны только YouTube, Twitch и TikTok' });
    return;
  }

  const platformLabel =
    mediaPlatform === 'youtube' ? 'YouTube' : mediaPlatform === 'twitch' ? 'Twitch' : 'TikTok';

  const body = [
    `Площадка: ${platformLabel}`,
    `Ссылка: ${channelUrl.trim()}`,
    `Подписчики: ${subscribers.trim()}`,
    `Просмотры на видео: ${views.trim()}`,
    '',
    'Описание:',
    content.trim(),
  ]
    .join('\n');

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

export default router;
