export type ModCategory = 'base' | 'performance' | 'comfort';

export interface FabricMod {
  id: string;
  name: string;
  description: string;
  category: ModCategory;
  required?: boolean;
  modrinthSlug: string;
  curseforgeSlug: string;
  note?: string;
}

export const FABRIC_GAME_VERSION = '1.21.4';

export const MOD_CATEGORY_LABELS: Record<ModCategory, string> = {
  base: 'База',
  performance: 'Производительность',
  comfort: 'Комфорт',
};

export const MOD_CATEGORY_HINTS: Record<ModCategory, string> = {
  base: 'Без этого Fabric не запустится или моды не загрузятся.',
  performance: 'Больше FPS и плавнее картинка — особенно на слабых ПК.',
  comfort: 'Голосовой чат и полезные подсказки в игре.',
};

export const FABRIC_MODS: FabricMod[] = [
  {
    id: 'fabric-api',
    name: 'Fabric API',
    description: 'Обязательная библиотека для большинства Fabric-модов.',
    category: 'base',
    required: true,
    modrinthSlug: 'fabric-api',
    curseforgeSlug: 'fabric-api',
  },
  {
    id: 'sodium',
    name: 'Sodium',
    description: 'Главный мод на оптимизацию — заметно поднимает FPS и убирает лаги.',
    category: 'performance',
    required: true,
    modrinthSlug: 'sodium',
    curseforgeSlug: 'sodium',
  },
  {
    id: 'iris',
    name: 'Iris Shaders',
    description: 'Шейдеры и красивая графика. Работает вместе с Sodium.',
    category: 'performance',
    modrinthSlug: 'iris',
    curseforgeSlug: 'irisshaders',
    note: 'Шейдер-пак скачивай отдельно — Complementary или BSL подойдут для ваниллы.',
  },
  {
    id: 'entityculling',
    name: 'Entity Culling',
    description: 'Не рендерит то, что за стенами — ещё немного FPS в городах и фермах.',
    category: 'performance',
    modrinthSlug: 'entityculling',
    curseforgeSlug: 'entity-culling',
  },
  {
    id: 'voice-chat',
    name: 'Simple Voice Chat',
    description: 'Голосовой чат рядом с игроками — удобно общаться без Discord.',
    category: 'comfort',
    required: true,
    modrinthSlug: 'simple-voice-chat',
    curseforgeSlug: 'simple-voice-chat',
    note: 'На сервере Enterra голос работает, если мод установлен у тебя и у собеседника.',
  },
  {
    id: 'shulker-box-tooltip',
    name: 'Shulker Box Tooltip',
    description: 'Смотри содержимое шалкеров наведением — не нужно открывать каждый раз.',
    category: 'comfort',
    modrinthSlug: 'shulkerboxtooltip',
    curseforgeSlug: 'shulker-box-tooltip',
  },
];

export const FABRIC_FORBIDDEN = [
  'X-Ray, Freecam, Baritone и другие читы',
  'Моды на полёт, скорость и автоклик',
  'Миникарты с радаром игроков и мобов (если показывают то, что не видно в игре)',
] as const;

export function modrinthInstallUrl(slug: string) {
  return `https://modrinth.com/mod/${slug}?version=${FABRIC_GAME_VERSION}&loader=fabric#download`;
}

export function curseforgeInstallUrl(slug: string) {
  return `https://www.curseforge.com/minecraft/mc-mods/${slug}/files/all?page=1&pageSize=20&version=${FABRIC_GAME_VERSION}&gameVersionTypeId=4`;
}
