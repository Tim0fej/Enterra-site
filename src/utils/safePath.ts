/** Безопасный внутренний путь после логина (без open redirect). */
export function safeNextPath(next: string | null | undefined, fallback = '/profile'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes(':\\')) {
    return fallback;
  }
  return next;
}

/** Безопасный URL вложения — только same-origin API. */
export function isSafeAttachmentUrl(url: string): boolean {
  if (!url.startsWith('/api/uploads/')) return false;
  const idPart = url.slice('/api/uploads/'.length);
  return /^\d+$/.test(idPart);
}

/** Безопасный редирект на оплату ЮKassa. */
export function isSafePaymentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'yookassa.ru' ||
      host.endsWith('.yookassa.ru') ||
      host === 'yoomoney.ru' ||
      host.endsWith('.yoomoney.ru')
    );
  } catch {
    return false;
  }
}
