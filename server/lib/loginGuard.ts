import { getClientIp } from './clientIp.js';
import { recordAbuse } from './ipBan.js';
import type { Request } from 'express';

type FailureEntry = { count: number; blockedUntil: number };

const ipFailures = new Map<string, FailureEntry>();
const accountFailures = new Map<string, FailureEntry>();

const MAX_FAILURES = Number.parseInt(process.env.LOGIN_MAX_FAILURES ?? '8', 10) || 8;
const BLOCK_MS = Number.parseInt(process.env.LOGIN_BLOCK_MS ?? String(15 * 60_000), 10) || 15 * 60_000;
const ACCOUNT_MAX_FAILURES = Number.parseInt(process.env.LOGIN_ACCOUNT_MAX_FAILURES ?? '6', 10) || 6;
const ACCOUNT_BLOCK_MS = Number.parseInt(process.env.LOGIN_ACCOUNT_BLOCK_MS ?? String(30 * 60_000), 10) || 30 * 60_000;

function ipKey(req: Request): string {
  return getClientIp(req) ?? req.ip ?? 'unknown';
}

function accountKey(login: string): string {
  return login.trim().toLowerCase();
}

function cleanupStore(store: Map<string, FailureEntry>) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.blockedUntil <= now && entry.count === 0) {
      store.delete(key);
    }
  }
}

setInterval(() => {
  cleanupStore(ipFailures);
  cleanupStore(accountFailures);
}, 60_000);

function isBlocked(store: Map<string, FailureEntry>, key: string): boolean {
  const entry = store.get(key);
  if (!entry) return false;
  return entry.blockedUntil > Date.now();
}

function recordFailure(
  store: Map<string, FailureEntry>,
  key: string,
  maxFailures: number,
  blockMs: number,
): void {
  const now = Date.now();
  const entry = store.get(key) ?? { count: 0, blockedUntil: 0 };

  if (entry.blockedUntil > now) {
    return;
  }

  entry.count += 1;
  if (entry.count >= maxFailures) {
    entry.blockedUntil = now + blockMs;
    entry.count = 0;
  }

  store.set(key, entry);
}

function maybeRecordLoginAbuse(req: Request): void {
  const ip = ipKey(req);
  if (ip !== 'unknown') recordAbuse(ip, 2);
}

export function isLoginBlocked(req: Request): boolean {
  return isBlocked(ipFailures, ipKey(req));
}

export function isAccountLoginBlocked(login: string): boolean {
  const key = accountKey(login);
  if (!key) return false;
  return isBlocked(accountFailures, key);
}

export function recordLoginFailure(req: Request, login?: string): void {
  recordFailure(ipFailures, ipKey(req), MAX_FAILURES, BLOCK_MS);
  maybeRecordLoginAbuse(req);
  if (login?.trim()) {
    recordFailure(accountFailures, accountKey(login), ACCOUNT_MAX_FAILURES, ACCOUNT_BLOCK_MS);
  }
}

export function clearLoginFailures(req: Request, login?: string): void {
  ipFailures.delete(ipKey(req));
  if (login?.trim()) {
    accountFailures.delete(accountKey(login));
  }
}

export function loginBlockedMessage(): string {
  const minutes = Math.ceil(BLOCK_MS / 60_000);
  return `Слишком много неудачных попыток входа. Подождите ${minutes} мин.`;
}

export function accountLoginBlockedMessage(): string {
  const minutes = Math.ceil(ACCOUNT_BLOCK_MS / 60_000);
  return `Аккаунт временно заблокирован из‑за подозрительной активности. Попробуйте через ${minutes} мин. или напишите в поддержку.`;
}

function failureCount(req: Request): number {
  return ipFailures.get(ipKey(req))?.count ?? 0;
}

/** Задержка растёт с числом неудачных попыток — усложняет перебор. */
export async function applyLoginFailureDelay(req: Request): Promise<void> {
  const failures = failureCount(req);
  const delayMs = Math.min(4000, 350 + failures * 250);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
