import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { initDb } from './db.js';
import { loadEnv } from './env.js';
import { DIST_DIR, DATA_DIR } from './paths.js';
import authRoutes from './routes/auth.js';
import forumRoutes from './routes/forum.js';
import ticketsRoutes from './routes/tickets.js';
import minecraftRoutes from './routes/minecraft.js';
import adminRoutes from './routes/admin.js';
import playersRoutes from './routes/players.js';
import supportRoutes from './routes/support.js';
import uploadsRoutes from './routes/uploads.js';

const env = loadEnv();
initDb();

const app = express();

if (env.trustProxy) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use(
  cors({
    origin: env.isProd && env.siteUrl ? env.siteUrl : true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/minecraft', minecraftRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/uploads', uploadsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    env: env.nodeEnv,
    dataDir: DATA_DIR,
  });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API error:', err instanceof Error ? err.message : err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const indexHtml = path.join(DIST_DIR, 'index.html');

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
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(indexHtml);
});

const server = app.listen(env.port, '0.0.0.0', () => {
  const host = env.siteUrl || `http://127.0.0.1:${env.port}`;
  console.log(`Enterra ${env.nodeEnv} → ${host}`);
  console.log(`Data: ${DATA_DIR}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`ERROR: Port ${env.port} is already in use. Change PORT in .env`);
  } else {
    console.error('ERROR:', err.message);
  }
  process.exit(1);
});
