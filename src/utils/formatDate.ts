/** Все даты на сайте показываем в московском времени. */
export const SITE_TIME_ZONE = 'Europe/Moscow';

const SITE_LOCALE = 'ru-RU';

/** SQLite UTC (`2026-06-27 18:43:22`) или ISO → Date. */
export function parseSiteDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatSiteDateTime(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  const date = parseSiteDate(value);
  if (!date) return '';
  return date.toLocaleString(SITE_LOCALE, { timeZone: SITE_TIME_ZONE, ...options });
}

export function formatSiteDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return formatSiteDateTime(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatSiteTime(value: string | null | undefined): string {
  return formatSiteDateTime(value, { hour: '2-digit', minute: '2-digit' });
}

/** «сейчас», «5 мин», «2 ч» или дата — для списков мессенджера. */
export function formatSiteRelativeTime(value: string | null | undefined): string {
  const date = parseSiteDate(value);
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return 'сейчас';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} мин`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} ч`;
  return formatSiteDate(value, { year: undefined });
}

/** Сегодня — время, иначе дата (форум на главной). */
export function formatSiteRelativeOrTime(value: string | null | undefined): string {
  const date = parseSiteDate(value);
  if (!date) return '—';
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 86_400_000) {
    return formatSiteTime(value);
  }
  return formatSiteDate(value, { year: undefined });
}
