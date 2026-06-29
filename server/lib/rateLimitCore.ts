import type { Request, Response, NextFunction } from 'express';
import { getClientIp } from './clientIp.js';
import { sendHttpError } from './httpError.js';
import { recordAbuse } from './ipBan.js';

export type RateEntry = { count: number; resetAt: number };

const rateStores = new Map<string, Map<string, RateEntry>>();

export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function clientKey(req: Request): string {
  return getClientIp(req) ?? req.ip ?? 'unknown';
}

function getRateStore(name: string): Map<string, RateEntry> {
  let store = rateStores.get(name);
  if (!store) {
    store = new Map();
    rateStores.set(name, store);
  }
  return store;
}

setInterval(() => {
  const now = Date.now();
  for (const store of rateStores.values()) {
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }
}, 60_000);

export interface RateLimitOptions {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
  abuseWeight?: number;
}

export function createRateLimit(options: RateLimitOptions) {
  const store = getRateStore(options.name);
  const keyGenerator = options.keyGenerator ?? clientKey;
  const message = options.message ?? 'Слишком много запросов. Подождите немного.';
  const abuseWeight = options.abuseWeight ?? 1;

  return (req: Request, res: Response, next: NextFunction) => {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const ip = clientKey(req);
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + options.windowMs };
      store.set(key, entry);
    }

    entry.count += 1;

    res.setHeader('RateLimit-Limit', String(options.max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, options.max - entry.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > options.max) {
      recordAbuse(ip, abuseWeight);
      sendHttpError(req, res, 429, message, { code: 429 });
      return;
    }

    next();
  };
}
