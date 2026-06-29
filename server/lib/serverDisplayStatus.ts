import { db } from '../db.js';
import type { McOnlineData } from './mcstatus.js';
import {
  SERVER_DISPLAY_MODES,
  SERVER_DISPLAY_STATE_LABELS,
  type ServerDisplayMode,
  type ServerDisplayState,
} from '../../shared/serverDisplayStatus.js';

const MODE_KEY = 'server_display_mode';
const MESSAGE_KEY = 'server_display_message';

export interface ServerDisplaySettings {
  mode: ServerDisplayMode;
  message: string;
  updatedAt: string | null;
  updatedBy: number | null;
}

export interface PublicServerStatus {
  online: boolean;
  displayState: ServerDisplayState;
  displayMode: ServerDisplayMode;
  playersOnline: number;
  playersMax: number | null;
  label: string;
  message: string | null;
}

function parseMode(value: string | undefined): ServerDisplayMode {
  if (value && SERVER_DISPLAY_MODES.includes(value as ServerDisplayMode)) {
    return value as ServerDisplayMode;
  }
  return 'auto';
}

export const DEFAULT_MAINTENANCE_MESSAGE = 'Технические работы. Сервер временно недоступен.';

export function isMaintenanceLockdown(): boolean {
  return getServerDisplaySettings().mode === 'maintenance';
}

export function canBypassMaintenanceLockdown(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'moderator';
}

export function getMaintenanceLockdownMessage(settings?: ServerDisplaySettings): string {
  const resolved = settings ?? getServerDisplaySettings();
  const custom = resolved.message.trim();
  if (custom) {
    return `${SERVER_DISPLAY_STATE_LABELS.maintenance}\n${custom}`;
  }
  return DEFAULT_MAINTENANCE_MESSAGE;
}

export function getServerDisplaySettings(): ServerDisplaySettings {
  const rows = db
    .prepare('SELECT key, value, updated_at, updated_by FROM site_settings WHERE key IN (?, ?)')
    .all(MODE_KEY, MESSAGE_KEY) as {
    key: string;
    value: string;
    updated_at: string;
    updated_by: number | null;
  }[];

  const byKey = new Map(rows.map((row) => [row.key, row]));
  const modeRow = byKey.get(MODE_KEY);
  const messageRow = byKey.get(MESSAGE_KEY);

  return {
    mode: parseMode(modeRow?.value),
    message: messageRow?.value?.trim() ?? '',
    updatedAt: modeRow?.updated_at ?? messageRow?.updated_at ?? null,
    updatedBy: modeRow?.updated_by ?? messageRow?.updated_by ?? null,
  };
}

export function setServerDisplaySettings(
  mode: ServerDisplayMode,
  message: string,
  adminId: number,
): ServerDisplaySettings {
  if (!SERVER_DISPLAY_MODES.includes(mode)) {
    throw new Error('Некорректный режим отображения');
  }

  const trimmedMessage = message.trim().slice(0, 200);

  const upsert = db.prepare(`
    INSERT INTO site_settings (key, value, updated_at, updated_by)
    VALUES (?, ?, datetime('now'), ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = datetime('now'),
      updated_by = excluded.updated_by
  `);

  upsert.run(MODE_KEY, mode, adminId);
  upsert.run(MESSAGE_KEY, trimmedMessage, adminId);

  return getServerDisplaySettings();
}

export function buildPublicServerStatus(
  mc: McOnlineData,
  settings: ServerDisplaySettings,
): PublicServerStatus {
  const playersOnline = mc.playersOnline;
  const playersMax = mc.playersMax;
  const customMessage = settings.message || null;

  if (settings.mode === 'maintenance') {
    return {
      online: false,
      displayState: 'maintenance',
      displayMode: 'maintenance',
      playersOnline,
      playersMax,
      label: SERVER_DISPLAY_STATE_LABELS.maintenance,
      message: customMessage,
    };
  }

  if (settings.mode === 'offline') {
    return {
      online: false,
      displayState: 'offline',
      displayMode: 'offline',
      playersOnline: 0,
      playersMax,
      label: customMessage || 'Сервер оффлайн',
      message: customMessage,
    };
  }

  if (settings.mode === 'online') {
    const label =
      customMessage || `Онлайн · ${playersOnline}/${playersMax ?? '?'} игроков`;
    return {
      online: true,
      displayState: 'online',
      displayMode: 'online',
      playersOnline,
      playersMax,
      label,
      message: customMessage,
    };
  }

  if (mc.online) {
    return {
      online: true,
      displayState: 'online',
      displayMode: 'auto',
      playersOnline,
      playersMax,
      label: customMessage || `Онлайн · ${playersOnline}/${playersMax ?? '?'} игроков`,
      message: customMessage,
    };
  }

  return {
    online: false,
    displayState: 'offline',
    displayMode: 'auto',
    playersOnline: 0,
    playersMax,
    label: customMessage || 'Сервер оффлайн',
    message: customMessage,
  };
}
