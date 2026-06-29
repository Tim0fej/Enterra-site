export const NAME_COLOR_MAX_LENGTH = 32;

/** Базовые цвета Minecraft (&-коды) для Violet-NameFormat */
export const NAME_COLOR_PRESETS = [
  { id: 'white', label: 'Белый', value: '&f' },
  { id: 'gray', label: 'Серый', value: '&7' },
  { id: 'cyan', label: 'Бирюза', value: '&b' },
  { id: 'aqua', label: 'Голубой', value: '&3' },
  { id: 'green', label: 'Зелёный', value: '&a' },
  { id: 'yellow', label: 'Жёлтый', value: '&e' },
  { id: 'gold', label: 'Золото', value: '&6' },
  { id: 'red', label: 'Красный', value: '&c' },
  { id: 'pink', label: 'Розовый', value: '&d' },
  { id: 'purple', label: 'Фиолетовый', value: '&5' },
  { id: 'blue', label: 'Синий', value: '&9' },
] as const;

const MINECRAFT_COLOR_CSS: Record<string, string> = {
  '0': '#000000',
  '1': '#0000AA',
  '2': '#00AA00',
  '3': '#00AAAA',
  '4': '#AA0000',
  '5': '#AA00AA',
  '6': '#FFAA00',
  '7': '#AAAAAA',
  '8': '#555555',
  '9': '#5555FF',
  a: '#55FF55',
  b: '#55FFFF',
  c: '#FF5555',
  d: '#FF55FF',
  e: '#FFFF55',
  f: '#FFFFFF',
};

const NAME_COLOR_RE =
  /^(?:&[0-9a-fk-or]|#[0-9a-fA-F]{6}|&#[0-9a-fA-F]{6})+$/;

/** VIP, медиа и администрация — не обычные игроки */
export function canCustomizeNameColor(params: {
  role: string;
  privilegeSlug?: string | null;
}): boolean {
  if (params.role === 'admin' || params.role === 'moderator') return true;
  return Boolean(params.privilegeSlug?.trim());
}

export function hasVipNameColorAccess(privilegeSlug?: string | null): boolean {
  const slug = privilegeSlug?.toLowerCase();
  return slug === 'vip' || slug === 'legend';
}

export function normalizeNameColorInput(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/§/g, '&');
  if (!NAME_COLOR_RE.test(normalized)) return null;
  if (normalized.length > NAME_COLOR_MAX_LENGTH) return null;
  return normalized;
}

export function nameColorToCss(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const hex = value.match(/#([0-9a-fA-F]{6})/)?.[1];
  if (hex) return `#${hex}`;

  const codes = value.replace(/§/g, '&');
  let css: string | null = null;
  for (const part of codes.matchAll(/&([0-9a-f])/g)) {
    css = MINECRAFT_COLOR_CSS[part[1]!.toLowerCase()] ?? css;
  }
  return css;
}

export function formatNameColorPreview(username: string, color: string | null | undefined): string {
  if (!color?.trim()) return username;
  return `${color.replace(/§/g, '&')}${username}`;
}

const RGB_HEX_RE = /^#?[0-9a-fA-F]{6}$/;

export function extractHexFromNameColor(value: string | null | undefined): string {
  const hex = value?.match(/#([0-9a-fA-F]{6})/i)?.[1];
  return hex ? `#${hex.toUpperCase()}` : '#FFAA00';
}

export function normalizeRgbHexInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!RGB_HEX_RE.test(trimmed)) return null;
  const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  return `#${hex.toUpperCase()}`;
}

export function isCustomHexNameColor(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return /#([0-9a-fA-F]{6})/.test(value) && !NAME_COLOR_PRESETS.some((preset) => preset.value === value);
}

export function nameColorPreviewStyle(value: string | null | undefined): { color?: string } {
  const css = nameColorToCss(value);
  return css ? { color: css } : {};
}