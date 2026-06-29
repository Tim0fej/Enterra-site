export const MEDIA_PLATFORMS = ['YouTube', 'Twitch', 'TikTok'] as const;

export type MediaPlatformName = (typeof MEDIA_PLATFORMS)[number];

export interface MediaTierRequirement {
  level: string;
  audience: string;
  metric: string;
}

export interface MediaTierColumns {
  audience: string;
  metric: string;
}

export interface MediaPlatformSpec {
  platform: MediaPlatformName;
  identity: string;
  cardRequirements: readonly string[];
  eligibility: readonly string[];
  statsNote?: string;
  tierColumns?: MediaTierColumns;
  tiers?: readonly MediaTierRequirement[];
  perks: readonly string[];
  partnerExtras?: readonly string[];
  partnerExtrasShort?: string;
  shortSummary: string;
}

import { VIP_COMMAND_PERKS } from './vipCommands';

const SHARED_GAME_PERKS = [...VIP_COMMAND_PERKS] as const;

export const SHARED_MEDIA_PERKS = [
  'Бейдж площадки на сайте и в списке игроков',
  'Отдельная группа в игре — права на уровне VIP',
  'Свой префикс площадки в чате и табе',
  'Смена цвета ника — палитра и RGB в профиле на сайте',
  ...SHARED_GAME_PERKS,
] as const;

export const MEDIA_STATS_PERIOD = '30 дней';

export const MEDIA_OFFICIAL_STATS = {
  YouTube: 'YouTube Studio — studio.youtube.com',
  Twitch: 'панель автора Twitch — dashboard.twitch.tv',
  TikTok: 'TikTok Studio — tiktok.com/studio',
} as const;

export const MEDIA_REVIEW_NOTE =
  'Выдаётся после проверки заявки администрацией. Права в игре — на уровне VIP.';

const PARTNER_EXTRAS = [
  'Возможность загружать свои звуки / джинглы в EnterraMusic',
  'Приоритетная поддержка на сервере',
] as const;

export const YOUTUBE_MEDIA: MediaPlatformSpec = {
  platform: 'YouTube',
  identity: 'Префикс [YouTube]',
  cardRequirements: ['Обзоры, гайды, серии и ивенты про Enterra'],
  eligibility: [
    'Канал на YouTube',
    'Контент по Enterra (обзоры, гайды, серии, ивенты)',
    MEDIA_REVIEW_NOTE,
  ],
  statsNote: `Статистика за последние ${MEDIA_STATS_PERIOD} — только из ${MEDIA_OFFICIAL_STATS.YouTube}.`,
  tierColumns: { audience: 'Подписчики', metric: 'Просмотры' },
  tiers: [
    { level: 'Автор', audience: 'от 1 000', metric: 'от 400' },
    { level: 'Блогер', audience: 'от 3 000', metric: 'от 1 000' },
    { level: 'Партнёр YouTube', audience: 'от 5 000', metric: 'от 2 000' },
  ],
  perks: [
    'Бейдж YouTube на сайте и в списке игроков',
    'Группа YouTube в игре (права на уровне VIP)',
    'Префикс [YouTube] в чате и табе',
    'Смена цвета ника — палитра и RGB в профиле',
    ...SHARED_GAME_PERKS,
  ],
  partnerExtras: [...PARTNER_EXTRAS],
  partnerExtrasShort: 'Партнёр YouTube: свои звуки, приоритетная поддержка',
  shortSummary: 'три уровня — от 1 000 подписчиков и 400 просмотров на видео',
};

export const TWITCH_MEDIA: MediaPlatformSpec = {
  platform: 'Twitch',
  identity: 'Префикс [🎥 Twitch]',
  cardRequirements: ['Стримы, ивенты, обзоры и гайды про Enterra'],
  eligibility: [
    'Канал на Twitch',
    'Контент по Enterra (стримы, ивенты, обзоры, гайды)',
    MEDIA_REVIEW_NOTE,
  ],
  statsNote: `Статистика за последние ${MEDIA_STATS_PERIOD} — только из ${MEDIA_OFFICIAL_STATS.Twitch}.`,
  tierColumns: { audience: 'Фолловеры', metric: 'Средний онлайн' },
  tiers: [
    { level: 'Стример', audience: 'от 500', metric: 'от 20' },
    { level: 'Ведущий стример', audience: 'от 2 000', metric: 'от 60' },
    { level: 'Партнёр Twitch', audience: 'от 4 000', metric: 'от 150' },
  ],
  perks: [
    'Бейдж Twitch на сайте и в списке игроков',
    'Группа Twitch в игре (права на уровне VIP)',
    'Префикс [🎥 Twitch] в чате и табе',
    'Смена цвета ника — палитра и RGB в профиле',
    ...SHARED_GAME_PERKS,
  ],
  partnerExtras: [...PARTNER_EXTRAS],
  partnerExtrasShort: 'Партнёр Twitch: свои звуки, приоритетная поддержка',
  shortSummary: 'три уровня — от 500 фолловеров и 20 avg viewers',
};

export const TIKTOK_MEDIA: MediaPlatformSpec = {
  platform: 'TikTok',
  identity: 'Префикс [TikTok]',
  cardRequirements: ['Ролики, обзоры, гайды и ивенты про Enterra'],
  eligibility: [
    'Канал на TikTok',
    'Контент по Enterra (ролики, обзоры, гайды, ивенты)',
    MEDIA_REVIEW_NOTE,
  ],
  statsNote: `Статистика за последние ${MEDIA_STATS_PERIOD} — только из ${MEDIA_OFFICIAL_STATS.TikTok}.`,
  tierColumns: { audience: 'Подписчики', metric: 'Просмотры' },
  tiers: [
    { level: 'Автор', audience: 'от 1 000', metric: 'от 2 000' },
    { level: 'Блогер', audience: 'от 3 000', metric: 'от 5 000' },
    { level: 'Партнёр TikTok', audience: 'от 5 000', metric: 'от 10 000' },
  ],
  perks: [
    'Бейдж TikTok на сайте и в списке игроков',
    'Группа TikTok в игре (права на уровне VIP)',
    'Префикс [TikTok] в чате и табе',
    'Смена цвета ника — палитра и RGB в профиле',
    ...SHARED_GAME_PERKS,
  ],
  partnerExtras: [...PARTNER_EXTRAS],
  partnerExtrasShort: 'Партнёр TikTok: свои звуки, приоритетная поддержка',
  shortSummary: 'три уровня — от 1 000 подписчиков и 2 000 просмотров на ролик',
};

const MEDIA_BY_PLATFORM: Record<MediaPlatformName, MediaPlatformSpec> = {
  YouTube: YOUTUBE_MEDIA,
  Twitch: TWITCH_MEDIA,
  TikTok: TIKTOK_MEDIA,
};

const MEDIA_BY_SLUG: Record<'youtube' | 'twitch' | 'tiktok', MediaPlatformSpec> = {
  youtube: YOUTUBE_MEDIA,
  twitch: TWITCH_MEDIA,
  tiktok: TIKTOK_MEDIA,
};

export function getMediaPlatformSpec(platform: MediaPlatformName): MediaPlatformSpec {
  return MEDIA_BY_PLATFORM[platform];
}

export function getMediaSpecBySlug(slug: string): MediaPlatformSpec | null {
  if (slug === 'youtube' || slug === 'twitch' || slug === 'tiktok') {
    return MEDIA_BY_SLUG[slug];
  }
  return null;
}

export function getPartnerTierName(spec: MediaPlatformSpec): string | null {
  if (!spec.tiers?.length) return null;
  return spec.tiers[spec.tiers.length - 1]?.level ?? null;
}

export function getMediaFormLabels(platform: MediaPlatformName) {
  if (platform === 'Twitch') {
    return {
      audience: 'Фолловеры (followers)',
      audiencePlaceholder: 'Например: 650',
      metric: 'Средний онлайн (avg viewers)',
      metricPlaceholder: 'За последние 30 дней, например: 25',
      metricHint: `Укажите средний онлайн из ${MEDIA_OFFICIAL_STATS.Twitch} за ${MEDIA_STATS_PERIOD}`,
    };
  }

  if (platform === 'TikTok') {
    return {
      audience: 'Подписчики',
      audiencePlaceholder: 'Например: 3 200',
      metric: 'Просмотры на ролик',
      metricPlaceholder: 'Среднее за 30 дней, например: 6 500',
      metricHint: `Среднее на ролике из ${MEDIA_OFFICIAL_STATS.TikTok} за ${MEDIA_STATS_PERIOD}`,
    };
  }

  return {
    audience: 'Подписчики',
    audiencePlaceholder: 'Например: 2 800',
    metric: 'Просмотры на видео',
    metricPlaceholder: 'Среднее за 30 дней, например: 1 200',
    metricHint: `Среднее на видео из ${MEDIA_OFFICIAL_STATS.YouTube} за ${MEDIA_STATS_PERIOD}`,
  };
}

export function getMediaTicketMetricLabels(platform: MediaPlatformName) {
  if (platform === 'Twitch') {
    return { audience: 'Фолловеры', metric: 'Средний онлайн (avg viewers)' };
  }
  if (platform === 'TikTok') {
    return { audience: 'Подписчики', metric: 'Просмотры на ролик' };
  }
  return { audience: 'Подписчики', metric: 'Просмотры на видео' };
}

/** @deprecated Use getMediaPlatformSpec(platform).eligibility */
export const MEDIA_REQUIREMENTS = [...YOUTUBE_MEDIA.eligibility];

/** @deprecated Use getMediaPlatformSpec('YouTube').shortSummary */
export const MEDIA_REQUIREMENTS_SHORT = YOUTUBE_MEDIA.shortSummary;
