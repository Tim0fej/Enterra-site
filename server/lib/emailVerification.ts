import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { normalizeEmail, validateEmail } from '../../shared/accountValidation.js';
import { sendVerificationCodeEmail } from './mailer.js';

export type EmailCodePurpose =
  | 'register'
  | 'change_email'
  | 'verify_email'
  | 'login_verify'
  | 'reset_password';

function generateCode(): string {
  return String(crypto.randomInt(100_000, 1_000_000));
}

export function issueEmailCode(
  email: string,
  purpose: EmailCodePurpose,
  userId?: number,
): { ok: true; code: string; normalized: string } | { ok: false; error: string; status: number } {
  const emailError = validateEmail(email);
  if (emailError) {
    return { ok: false, error: emailError, status: 400 };
  }

  const normalized = normalizeEmail(email);

  const recent = db
    .prepare(`
      SELECT id FROM email_verification_codes
      WHERE email = ? COLLATE NOCASE AND purpose = ?
        AND created_at > datetime('now', '-60 seconds')
      LIMIT 1
    `)
    .get(normalized, purpose);

  if (recent) {
    return {
      ok: false,
      error: 'Подождите минуту перед повторной отправкой',
      status: 429,
    };
  }

  const hourly = db
    .prepare(`
      SELECT COUNT(*) as count FROM email_verification_codes
      WHERE email = ? COLLATE NOCASE AND purpose = ?
        AND created_at > datetime('now', '-1 hour')
    `)
    .get(normalized, purpose) as { count: number };

  if (hourly.count >= 5) {
    return {
      ok: false,
      error: 'Слишком много кодов на этот адрес. Попробуйте через час.',
      status: 429,
    };
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);

  db.prepare(
    `INSERT INTO email_verification_codes (email, purpose, code_hash, user_id, expires_at)
     VALUES (?, ?, ?, ?, datetime('now', '+15 minutes'))`,
  ).run(normalized, purpose, codeHash, userId ?? null);

  return { ok: true as const, code, normalized };
}

export async function sendEmailCode(
  email: string,
  purpose: EmailCodePurpose,
  userId?: number,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const result = issueEmailCode(email, purpose, userId);
  if (!result.ok) return result;

  try {
    await sendVerificationCodeEmail(result.normalized, result.code);
    return { ok: true };
  } catch (err) {
    console.error('[mail] send failed:', err);
    const msg = err instanceof Error ? err.message : 'Не удалось отправить письмо';
    return { ok: false, error: msg, status: 502 };
  }
}

export function consumeEmailCode(
  email: string,
  purpose: EmailCodePurpose,
  code: string,
  userId?: number,
): boolean {
  const normalized = normalizeEmail(email);
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) return false;

  const rows = db
    .prepare(`
      SELECT id, code_hash, user_id FROM email_verification_codes
      WHERE email = ? COLLATE NOCASE AND purpose = ?
        AND expires_at > datetime('now')
      ORDER BY id DESC LIMIT 5
    `)
    .all(normalized, purpose) as {
    id: number;
    code_hash: string;
    user_id: number | null;
  }[];

  for (const row of rows) {
    if (userId != null && row.user_id != null && row.user_id !== userId) continue;
    if (!bcrypt.compareSync(trimmed, row.code_hash)) continue;

    db.prepare('DELETE FROM email_verification_codes WHERE id = ?').run(row.id);
    return true;
  }

  return false;
}

export function cleanupExpiredCodes(): void {
  db.prepare("DELETE FROM email_verification_codes WHERE expires_at < datetime('now')").run();
}
