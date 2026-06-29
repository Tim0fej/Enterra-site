import crypto from 'crypto';

/** Сравнение секретов без утечки по времени (длина не важна — сравниваем SHA-256). */
export function secureCompareSecret(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || !expected) return false;
  const providedHash = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const expectedHash = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(providedHash, expectedHash);
}
