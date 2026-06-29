export const SERVER_DISPLAY_MODES = ['auto', 'maintenance', 'offline', 'online'] as const;

export type ServerDisplayMode = (typeof SERVER_DISPLAY_MODES)[number];

export type ServerDisplayState = 'online' | 'offline' | 'maintenance';

export const SERVER_DISPLAY_STATE_LABELS: Record<ServerDisplayState, string> = {
  online: 'Онлайн',
  offline: 'Сервер оффлайн',
  maintenance: 'Технические работы',
};

export const SERVER_DISPLAY_MODE_LABELS: Record<ServerDisplayMode, string> = {
  auto: 'Авто (по API)',
  maintenance: 'Технические работы',
  offline: 'Оффлайн',
  online: 'Онлайн (принудительно)',
};

export const SERVER_DISPLAY_MODE_HINTS: Record<ServerDisplayMode, string> = {
  auto: 'Статус берётся из мониторинга Minecraft. Сообщение ниже — необязательно.',
  maintenance: 'На сайте — тех. работы. На сервер Minecraft смогут зайти только админы и модераторы.',
  offline: 'На сайте сервер всегда «оффлайн».',
  online: 'На сайте сервер всегда «онлайн». Онлайн игроков — из мониторинга.',
};
