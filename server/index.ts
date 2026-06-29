import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { initDb } from './db.js';
import { ensureGuestTicketUser } from './lib/guestTickets.js';
import { loadEnv } from './env.js';
import { purgeInactiveTickets } from './lib/ticketLifecycle.js';
import { purgeOrphanAttachments } from './lib/attachments.js';
import { backfillShopFeedFromEasyDonate } from './lib/shopFeed.js';
import { warmupEasyDonateProducts } from './lib/easydonate.js';
import { DIST_DIR, DATA_DIR } from './paths.js';
import authRoutes from './routes/auth.js';
import forumRoutes from './routes/forum.js';
import ticketsRoutes from './routes/tickets.js';
import minecraftRoutes from './routes/minecraft.js';
import adminRoutes from './routes/admin.js';
import moderationRoutes from './routes/moderation.js';
import playersRoutes from './routes/players.js';
import shopRoutes from './routes/shop.js';
import { buildShopInfoPayload } from './lib/shopInfo.js';
import supportRoutes from './routes/support.js';
import legalRoutes from './routes/legal.js';
import uploadsRoutes from './routes/uploads.js';
import { sendHttpError } from './lib/httpError.js';
import { isKnownSpaPath } from './lib/spaRoutes.js';
import {
  ipBlockMiddleware,
  jsonBodyMiddleware,
  methodGuardMiddleware,
  pathGuardMiddleware,
  probeBlockMiddleware,
  rateLimiters,
  mutationsOnly,
  requestTimeoutMiddleware,
  scannerBlockMiddleware,
  securityHeadersMiddleware,
  suspiciousBotMiddleware,
} from './middleware/security.js';
import { botUserAgentMiddleware, originGuardMiddleware } from './middleware/botGuard.js';

const env = loadEnv();
initDb();
ensureGuestTicketUser();
backfillShopFeedFromEasyDonate();
warmupEasyDonateProducts();

const removedTickets = purgeInactiveTickets();
if (removedTickets > 0) {
  console.log(`Removed ${removedTickets} inactive ticket(s) on startup`);
}

const removedUploads = purgeOrphanAttachments(48);
if (removedUploads > 0) {
  console.log(`Removed ${removedUploads} orphan upload(s) on startup`);
}

setInterval(() => {
  const removed = purgeInactiveTickets();
  if (removed > 0) {
    console.log(`Removed ${removed} inactive ticket(s)`);
  }
}, 15 * 60 * 1000);

setInterval(() => {
  const removed = purgeOrphanAttachments(48);
  if (removed > 0) {
    console.log(`Removed ${removed} orphan upload(s)`);
  }
}, 60 * 60 * 1000);

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use(securityHeadersMiddleware);
app.use(methodGuardMiddleware);
app.use(pathGuardMiddleware);
app.use(probeBlockMiddleware);
app.use(ipBlockMiddleware);
app.use(requestTimeoutMiddleware());
app.use(rateLimiters.burst);
app.use(rateLimiters.global);

app.use(
  cors({
    origin: env.isProd ? env.siteUrl : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(jsonBodyMiddleware);
app.use(scannerBlockMiddleware);
app.use(suspiciousBotMiddleware);
app.use(cookieParser());
app.use(botUserAgentMiddleware);
app.use(originGuardMiddleware);

app.use('/api', rateLimiters.api);

app.use('/api/auth/login', rateLimiters.login);
app.use('/api/auth/login/verify', rateLimiters.login);
app.use('/api/auth/register', rateLimiters.register);
app.use('/api/auth/send-email-code', rateLimiters.emailCode);
app.use('/api/auth/password', rateLimiters.sensitive);
app.use('/api/auth/reset-password', rateLimiters.sensitive);
app.use('/api/auth/email', rateLimiters.sensitive);
app.use('/api/auth/username', rateLimiters.sensitive);
app.use('/api/auth/regenerate-code', rateLimiters.sensitive);
app.use('/api/auth', authRoutes);

app.use('/api/forum', mutationsOnly(rateLimiters.write), rateLimiters.authenticated, forumRoutes);
app.use('/api/tickets', mutationsOnly(rateLimiters.write), ticketsRoutes);
app.use('/api/minecraft', rateLimiters.minecraft, minecraftRoutes);
app.use('/api/admin', rateLimiters.admin, adminRoutes);
app.use('/api/moderation', rateLimiters.admin, moderationRoutes);
app.use('/api/players', rateLimiters.publicRead, playersRoutes);
app.use('/api/store', rateLimiters.publicRead, shopRoutes);
app.use('/api/shop', rateLimiters.publicRead, shopRoutes);
app.use('/api/support/yookassa/webhook', rateLimiters.webhook);
app.use('/api/support/easydonate/webhook', rateLimiters.webhook);
app.use('/api/support', mutationsOnly(rateLimiters.write), rateLimiters.authenticated, supportRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/uploads', rateLimiters.upload, rateLimiters.authenticated, uploadsRoutes);

app.get('/api/health', rateLimiters.health, (_req, res) => {
  res.json({ ok: true });
});

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API error:', err instanceof Error ? err.message : err);
  if (res.headersSent) return;
  sendHttpError(req, res, 500, 'Внутренняя ошибка сервера', { code: 500 });
});

const indexHtml = path.join(DIST_DIR, 'index.html');
const notFoundHtml = path.join(DIST_DIR, '404.html');

if (!fs.existsSync(indexHtml)) {
  console.error('ERROR: dist/index.html not found. Run: npm run build');
  process.exit(1);
}

app.use(
  express.static(DIST_DIR, {
    maxAge: env.isProd ? '7d' : 0,
    index: false,
  }),
);
function sendSpaHtml(res: express.Response, injectShop = false) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!injectShop) {
    res.sendFile(indexHtml);
    return;
  }

  let html = fs.readFileSync(indexHtml, 'utf8');
  const payload = JSON.stringify(buildShopInfoPayload()).replace(/</g, '\\u003c');
  html = html.replace('</head>', `<script>window.__ENTERRA_SHOP__=${payload}</script></head>`);
  res.type('html').send(html);
}

app.get(/^\/shop\/?$/, (_req, res) => {
  sendSpaHtml(res, true);
});

app.get(/^(?!\/api).*/, (req, res) => {
  if (!isKnownSpaPath(req.path)) {
    res.status(404);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(notFoundHtml);
    return;
  }

  sendSpaHtml(res, false);
});

const server = app.listen(env.port, '0.0.0.0', () => {
  const host = env.siteUrl || `http://127.0.0.1:${env.port}`;
  console.log(`Enterra ${env.nodeEnv} → ${host}`);
  console.log(`Data: ${DATA_DIR}`);
});

const maxConnections = Number.parseInt(process.env.SERVER_MAX_CONNECTIONS ?? '400', 10);
if (Number.isFinite(maxConnections) && maxConnections > 0) {
  server.maxConnections = maxConnections;
}
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${env.port} is already in use. Change PORT in .env`);
  } else {
    console.error('ERROR:', err.message);
  }
  process.exit(1);
});
