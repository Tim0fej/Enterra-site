import { db, generateUniqueAccessCode } from '../db.js';

export const ACCESS_CODE_TTL_DAYS = 7;

export function accessCodeExpirySql(): string {
  return `datetime('now', '+${ACCESS_CODE_TTL_DAYS} days')`;
}

export function isAccessCodeActive(row: {
  code_verified_at: string | null;
  code_expires_at: string | null;
}): boolean {
  if (!row.code_verified_at || !row.code_expires_at) {
    return false;
  }

  const active = db
    .prepare(
      `SELECT 1 AS ok WHERE datetime(?) > datetime('now') AND datetime(?) IS NOT NULL`,
    )
    .get(row.code_expires_at, row.code_verified_at) as { ok: number } | undefined;

  return Boolean(active);
}

export function rotateAccessCode(userId: number): string {
  const accessCode = generateUniqueAccessCode();
  db.prepare(
    `
    UPDATE users
    SET access_code = ?,
        code_verified_at = NULL,
        code_expires_at = ${accessCodeExpirySql()}
    WHERE id = ?
  `,
  ).run(accessCode, userId);
  return accessCode;
}

export function ensureAccessCodeFresh(userId: number): boolean {
  const row = db
    .prepare('SELECT code_expires_at FROM users WHERE id = ?')
    .get(userId) as { code_expires_at: string | null } | undefined;

  if (!row) {
    return false;
  }

  if (!row.code_expires_at) {
    db.prepare(
      `
      UPDATE users
      SET code_expires_at = datetime(COALESCE(code_verified_at, created_at), '+${ACCESS_CODE_TTL_DAYS} days')
      WHERE id = ? AND code_expires_at IS NULL
    `,
    ).run(userId);
    return false;
  }

  const expired = db
    .prepare(`SELECT 1 AS ok WHERE datetime(?) <= datetime('now')`)
    .get(row.code_expires_at) as { ok: number } | undefined;

  if (!expired) {
    return false;
  }

  rotateAccessCode(userId);
  return true;
}

export function ensureAllExpiredAccessCodesRotated(): void {
  const expired = db
    .prepare(
      `
      SELECT id FROM users
      WHERE code_expires_at IS NOT NULL
        AND datetime(code_expires_at) <= datetime('now')
    `,
    )
    .all() as Array<{ id: number }>;

  for (const row of expired) {
    rotateAccessCode(row.id);
  }
}

export function markAccessCodeVerified(userId: number): void {
  db.prepare(
    `
    UPDATE users
    SET code_verified_at = datetime('now'),
        code_expires_at = ${accessCodeExpirySql()}
    WHERE id = ?
  `,
  ).run(userId);
}

export function issueNewAccessCode(userId: number): string {
  const accessCode = generateUniqueAccessCode();
  db.prepare(
    `
    UPDATE users
    SET access_code = ?,
        code_verified_at = NULL,
        code_expires_at = ${accessCodeExpirySql()}
    WHERE id = ?
  `,
  ).run(accessCode, userId);
  return accessCode;
}

export function toIsoTimestamp(sqliteDatetime: string): string {
  return `${sqliteDatetime.replace(' ', 'T')}Z`;
}
