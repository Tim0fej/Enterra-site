const DEFAULT_JWT = 'enterra-dev-secret-change-in-production';
const DEFAULT_MC_KEY = 'enterra-plugin-key';

export function loadEnv() {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProd = nodeEnv === 'production';

  const port = Number(process.env.PORT) || 3001;
  const jwtSecret = process.env.JWT_SECRET ?? DEFAULT_JWT;
  const minecraftApiKey = process.env.MINECRAFT_API_KEY ?? DEFAULT_MC_KEY;
  const siteUrl = (process.env.SITE_URL ?? process.env.PUBLIC_URL ?? '').replace(/\/$/, '');
  const trustProxy = process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';

  if (isProd) {
    if (jwtSecret === DEFAULT_JWT) {
      console.error('ERROR: Set a strong JWT_SECRET in production (.env)');
      process.exit(1);
    }
    if (minecraftApiKey === DEFAULT_MC_KEY) {
      console.error('ERROR: Set a strong MINECRAFT_API_KEY in production and sync the plugin config');
      process.exit(1);
    }
    if (!siteUrl) {
      console.error('ERROR: Set SITE_URL in production (required for CORS)');
      process.exit(1);
    }
    if (
      process.env.YOOKASSA_SHOP_ID?.trim() &&
      process.env.YOOKASSA_SECRET_KEY?.trim() &&
      !process.env.YOOKASSA_WEBHOOK_SECRET?.trim()
    ) {
      console.error('ERROR: Set YOOKASSA_WEBHOOK_SECRET in production when YooKassa is enabled');
      process.exit(1);
    }
    if (!trustProxy) {
      console.warn('WARN: TRUST_PROXY is not enabled — IP rate limits may affect all users behind one proxy');
    }
  }

  return {
    nodeEnv,
    isProd,
    port,
    jwtSecret,
    minecraftApiKey,
    siteUrl,
    trustProxy,
    mcHost: process.env.MC_HOST ?? 'Enterra.minerent.io',
    mcPort: Number(process.env.MC_PORT) || 25565,
    supportBoostyUrl: process.env.SUPPORT_BOOSTY_URL ?? '',
    serverMonthlyCost: Number(process.env.SERVER_MONTHLY_COST) || 1500,
  };
}

export type AppEnv = ReturnType<typeof loadEnv>;
