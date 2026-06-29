import type { Request } from 'express';

/** Нормализует IPv4 / IPv4-mapped IPv6 для сравнения. */
export function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  let ip = raw.trim();
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice('::ffff:'.length);
  }

  if (ip === '::1') return '127.0.0.1';
  if (!/^[\da-f.:]+$/i.test(ip)) return null;
  return ip.toLowerCase();
}

const trustProxy =
  process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true';

export function getClientIp(req: Request): string | null {
  if (trustProxy) {
    const fromExpress = normalizeIp(req.ip);
    if (fromExpress) return fromExpress;
  }

  return normalizeIp(req.socket.remoteAddress ?? null);
}
