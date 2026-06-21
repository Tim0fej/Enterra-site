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
      console.warn('WARN: MINECRAFT_API_KEY is still the default — change it for production');
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
    mcHost: process.env.MC_HOST ?? 'play.enterra.ru',
    mcPort: Number(process.env.MC_PORT) || 25565,
    supportBoostyUrl: process.env.SUPPORT_BOOSTY_URL ?? '',
    serverMonthlyCost: Number(process.env.SERVER_MONTHLY_COST) || 1500,
  };
}

export type AppEnv = ReturnType<typeof loadEnv>;
