const recentContent = new Map<string, number>();

const DUPLICATE_WINDOW_MS = Number.parseInt(process.env.SPAM_DUPLICATE_MS ?? '30000', 10) || 30_000;
const MAX_LINKS = Number.parseInt(process.env.SPAM_MAX_LINKS ?? '8', 10) || 8;

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of recentContent) {
    if (now - ts > DUPLICATE_WINDOW_MS * 2) {
      recentContent.delete(key);
    }
  }
}, 60_000);

export function hasExcessiveLinks(content: string): boolean {
  const matches = content.match(/https?:\/\//gi);
  return (matches?.length ?? 0) > MAX_LINKS;
}

export function isDuplicateContent(userId: number, content: string): boolean {
  const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');
  if (normalized.length < 16) return false;

  const key = `${userId}:${normalized.slice(0, 240)}`;
  const now = Date.now();
  const prev = recentContent.get(key);
  recentContent.set(key, now);

  return prev !== undefined && now - prev < DUPLICATE_WINDOW_MS;
}

export function validateTitle(title: string, maxLength = 200): string | null {
  const trimmed = title.trim();
  if (!trimmed) return 'Укажите заголовок';
  if (trimmed.length > maxLength) return `Заголовок не длиннее ${maxLength} символов`;
  return null;
}

export function validateUserContent(content: string, userId: number): string | null {
  const trimmed = content.trim();
  if (!trimmed) {
    return 'Сообщение не может быть пустым';
  }
  if (trimmed.length > 20_000) {
    return 'Сообщение слишком длинное';
  }
  if (hasExcessiveLinks(trimmed)) {
    return 'Слишком много ссылок в сообщении';
  }
  if (isDuplicateContent(userId, trimmed)) {
    return 'Подождите перед отправкой такого же сообщения';
  }
  return null;
}
