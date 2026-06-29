export type ModerationActionType =
  | 'ban'
  | 'unban'
  | 'mute'
  | 'unmute'
  | 'warn'
  | 'unwarn'
  | 'kick';

export type PunishmentType = 'ban' | 'mute' | 'warn';

export type ModerationQueueStatus = 'pending' | 'done' | 'failed';

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  ban: 'Бан',
  unban: 'Разбан',
  mute: 'Мут',
  unmute: 'Снять мут',
  warn: 'Предупреждение',
  unwarn: 'Снять предупреждение',
  kick: 'Кик',
};

export const PUNISHMENT_TYPE_LABELS: Record<PunishmentType, string> = {
  ban: 'Бан',
  mute: 'Мут',
  warn: 'Предупреждение',
};

/** Minecraft-ник: 3–16 символов */
export const MC_USERNAME_RE = /^[a-zA-Z0-9_]{3,16}$/;

/** LiteBans duration: 1d, 7d, 30d, 1h и т.п. */
export const MOD_DURATION_RE = /^\d+[smhdwMy]$/;

export function normalizeMcUsername(value: string): string {
  return value.trim();
}

export function isValidMcUsername(value: string): boolean {
  return MC_USERNAME_RE.test(normalizeMcUsername(value));
}

export function isValidModDuration(value: string): boolean {
  return MOD_DURATION_RE.test(value.trim());
}

function quoteCommandArg(value: string): string {
  if (/^[a-zA-Z0-9_]+$/.test(value)) {
    return value;
  }
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function buildModerationCommand(params: {
  action: ModerationActionType;
  target: string;
  duration?: string | null;
  reason?: string | null;
  staffName: string;
}): string {
  const target = normalizeMcUsername(params.target);
  const baseReason = params.reason?.trim() || 'Нарушение правил';
  const reason = quoteCommandArg(`${baseReason} · сайт: ${params.staffName}`);
  const duration = params.duration?.trim() || null;

  switch (params.action) {
    case 'ban':
      return duration ? `tempban ${target} ${duration} ${reason}` : `ban ${target} ${reason}`;
    case 'unban':
      return `unban ${target}`;
    case 'mute':
      return duration ? `tempmute ${target} ${duration} ${reason}` : `mute ${target} ${reason}`;
    case 'unmute':
      return `unmute ${target}`;
    case 'warn':
      return `warn ${target} ${reason}`;
    case 'unwarn':
      return `unwarn ${target}`;
    case 'kick':
      return `kick ${target} ${reason}`;
    default:
      return '';
  }
}
