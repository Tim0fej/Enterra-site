import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../auth.js';
import {
  buildDonationAlertsAuthorizeUrl,
  exchangeDonationAlertsCode,
  getDonationAlertsSettings,
  isDonationAlertsConfigured,
  saveDonationAlertsClientId,
} from '../lib/donationAlertsOAuth.js';
import { syncDonationAlertsFeed } from '../lib/shopFeed.js';

const router = Router();

router.get('/status', authMiddleware, adminMiddleware, (_req, res) => {
  const settings = getDonationAlertsSettings();
  res.json({
    configured: isDonationAlertsConfigured(),
    hasClientId: Boolean(settings.clientId),
    hasTokens: Boolean(settings.accessToken && settings.refreshToken),
    updatedAt: settings.updatedAt,
    authorizeUrl: buildDonationAlertsAuthorizeUrl(),
  });
});

router.post('/config', authMiddleware, adminMiddleware, (req, res) => {
  const { clientId } = req.body as { clientId?: string };
  const trimmed = clientId?.trim();
  if (!trimmed) {
    res.status(400).json({ error: 'Укажите ID приложения DonationAlerts' });
    return;
  }

  saveDonationAlertsClientId(trimmed);
  res.json({
    ok: true,
    authorizeUrl: buildDonationAlertsAuthorizeUrl(),
  });
});

router.get('/oauth/start', authMiddleware, adminMiddleware, (_req, res) => {
  const url = buildDonationAlertsAuthorizeUrl();
  if (!url) {
    res.status(503).json({
      error: 'Сначала укажите ID приложения DonationAlerts в админке',
    });
    return;
  }

  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const error = typeof req.query.error === 'string' ? req.query.error : '';

  if (error) {
    res.redirect(`/admin?da=error&msg=${encodeURIComponent(error)}`);
    return;
  }

  if (!code) {
    res.redirect('/admin?da=error&msg=missing_code');
    return;
  }

  try {
    await exchangeDonationAlertsCode(code);
    await syncDonationAlertsFeed();
    res.redirect('/admin?da=ok');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'oauth_failed';
    res.redirect(`/admin?da=error&msg=${encodeURIComponent(message)}`);
  }
});

export default router;
