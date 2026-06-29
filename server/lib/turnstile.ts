import { clientKey } from './rateLimitCore.js';

export function isTurnstileEnabled(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() && process.env.TURNSTILE_SITE_KEY?.trim(),
  );
}

export function getTurnstileSiteKey(): string | null {
  const key = process.env.TURNSTILE_SITE_KEY?.trim();
  return key || null;
}

export async function verifyTurnstileToken(token: string, reqIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  if (!token.trim()) return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (reqIp && reqIp !== 'unknown') {
    body.set('remoteip', reqIp);
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function verifyTurnstileFromRequest(
  token: unknown,
  req: { ip?: string; headers: Record<string, unknown> },
): Promise<boolean> {
  if (!isTurnstileEnabled()) return true;
  if (typeof token !== 'string') return false;
  return verifyTurnstileToken(token, clientKey(req as import('express').Request));
}
