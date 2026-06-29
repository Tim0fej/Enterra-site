import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, type AuthRequest } from '../auth.js';
import { loadEnv } from '../env.js';
import {
  createEasyDonateProductPayment,
  isEasyDonateConfigured,
  listEasyDonateProducts,
} from '../lib/easydonate.js';
import { monthsForEasyDonateProduct, resolveShopProductKind } from '../../shared/easydonateConfig.js';
import { recordEasyDonateCheckout } from '../lib/easydonatePayments.js';
import { buildShopInfoPayload } from '../lib/shopInfo.js';
import { listShopPurchases } from '../lib/shopFeed.js';

const router = Router();
const env = loadEnv();

router.get('/', (_req, res) => {
  res.json(buildShopInfoPayload());
});

router.get('/recent-purchases', (_req, res) => {
  res.json({ purchases: listShopPurchases(30) });
});

router.post('/checkout', authMiddleware, async (req: AuthRequest, res) => {
  if (!isEasyDonateConfigured()) {
    res.status(503).json({ error: 'Магазин временно недоступен' });
    return;
  }

  const { productId } = req.body as { productId?: number };
  const id = Number(productId);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: 'Укажите товар' });
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

    const products = await listEasyDonateProducts();
    const product = products.find((item) => item.id === id);

    const checkout = await createEasyDonateProductPayment({
      customer: req.user!.username,
      email: emailRow.email,
      productId: id,
      successUrl: returnBase,
    });

    const months = monthsForEasyDonateProduct(id, process.env);
    const productKind = resolveShopProductKind(id, product?.name ?? '', process.env);
    recordEasyDonateCheckout({
      paymentId: checkout.paymentId,
      userId: req.user!.id,
      customer: req.user!.username,
      months,
      productId: id,
      productKind,
      amountRub: product?.price ?? 0,
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

export default router;
