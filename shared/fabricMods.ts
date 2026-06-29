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
export const FABRIC_LOADER_VERSION = '0.19.3';

export const MOD_CATEGORY_LABELS: Record<ModCategory, string> = {
  base: 'База',
  performance: 'Производительность',
  comfort: 'Комфорт',
};

export const MOD_CATEGORY_HINTS: Record<ModCategory, string> = {
  base: 'Без этого Fabric не запустится или моды не загрузятся.',
  performance: 'Больше FPS и плавнее картинка — особенно на слабых ПК.',
  comfort: 'Голосовой чат, анимации интерфейса и полезные подсказки в игре.',
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
    note: 'В сборке: 0.119.4+1.21.4',
  },
  {
    id: 'modmenu',
    name: 'Mod Menu',
    description: 'Список модов в игре и кнопка настроек у каждого мода.',
    category: 'base',
    modrinthSlug: 'modmenu',
    curseforgeSlug: 'modmenu',
    note: 'В сборке: 13.0.4',
  },
  {
    id: 'sodium',
    name: 'Sodium',
    description: 'Главный мод на оптимизацию — заметно поднимает FPS и убирает лаги.',
    category: 'performance',
    required: true,
    modrinthSlug: 'sodium',
    curseforgeSlug: 'sodium',
    note: 'В сборке: 0.6.13+mc1.21.4',
  },
  {
    id: 'iris',
    name: 'Iris Shaders',
    description: 'Шейдеры и красивая графика. Работает вместе с Sodium.',
    category: 'performance',
    modrinthSlug: 'iris',
    curseforgeSlug: 'irisshaders',
    note: 'В сборке: 1.8.8+mc1.21.4. Шейдеры BSL, Complementary, Solas и photon уже в архиве.',
  },
  {
    id: 'entityculling',
    name: 'Entity Culling',
    description: 'Не рендерит то, что за стенами — ещё немного FPS в городах и фермах.',
    category: 'performance',
    modrinthSlug: 'entityculling',
    curseforgeSlug: 'entity-culling',
    note: 'В сборке: 1.10.5-mc1.21.4',
  },
  {
    id: 'voice-chat',
    name: 'Simple Voice Chat',
    description: 'Голосовой чат рядом с игроками — удобно общаться без Discord.',
    category: 'comfort',
    required: true,
    modrinthSlug: 'simple-voice-chat',
    curseforgeSlug: 'simple-voice-chat',
    note: 'В сборке: 2.6.18. На сервере Enterra голос работает, если мод установлен у тебя и у собеседника.',
  },
  {
    id: 'shulker-box-tooltip',
    name: 'Shulker Box Tooltip',
    description: 'Смотри содержимое шалкеров наведением — не нужно открывать каждый раз.',
    category: 'comfort',
    modrinthSlug: 'shulkerboxtooltip',
    curseforgeSlug: 'shulker-box-tooltip',
    note: 'В сборке: 5.2.6+1.21.4',
  },
  {
    id: 'emotecraft',
    name: 'Emotecraft',
    description: 'Эмоции и жесты персонажа — маши рукой, танцуй, показывай настроение в игре.',
    category: 'comfort',
    modrinthSlug: 'emotecraft',
    curseforgeSlug: 'emotecraft',
    note: 'В сборке: 2.5.8. Клавиша эмоций — по умолчанию B.',
  },
  {
    id: 'hold-my-items',
    name: 'Hold My Items',
    description: 'Предметы в руках видны от первого лица — меч, факел, еда с анимациями.',
    category: 'comfort',
    modrinthSlug: 'hold-my-items',
    curseforgeSlug: 'hold-my-items',
    note: 'В сборке: 4.3. Только клиент.',
  },
  {
    id: 'smooth-scroll',
    name: 'Smooth Scrolling',
    description: 'Плавная прокрутка чата, хотбара и списков — без резких скачков.',
    category: 'comfort',
    modrinthSlug: 'smooth-scroll',
    curseforgeSlug: 'smooth-scroll',
    note: 'В сборке: 2.2.2.1',
  },
  {
    id: 'smooth-swapping',
    name: 'Smooth Swapping',
    description: 'Предметы плавно перемещаются между слотами инвентаря.',
    category: 'comfort',
    modrinthSlug: 'smooth-swapping',
    curseforgeSlug: 'smooth-swapping',
    note: 'В сборке: 0.9.4.3',
  },
  {
    id: 'smooth-gui',
    name: 'Smooth Gui',
    description: 'Меню открываются с мягкой анимацией вместо мгновенного появления.',
    category: 'comfort',
    modrinthSlug: 'smooth-gui',
    curseforgeSlug: 'smooth-gui',
    note: 'В сборке: 0.1.1',
  },
  {
    id: 'minecraft-cursor',
    name: 'Minecraft Cursor',
    description: 'Курсор в стиле Minecraft — разные иконки для кнопок, слотов и текста.',
    category: 'comfort',
    modrinthSlug: 'minecraft-cursor',
    curseforgeSlug: 'minecraft-cursor',
    note: 'В сборке: 3.11.2+1.21.4',
  },
  {
    id: 'tiny-item-animations',
    name: 'Tiny Item Animations',
    description: 'Небольшая анимация, когда подбираешь предмет курсором.',
    category: 'comfort',
    modrinthSlug: 'tiny-item-animations',
    curseforgeSlug: 'tiny-item-animations',
    note: 'В сборке: 1.2.2',
  },
  {
    id: 'litematica',
    name: 'Litematica',
    description: 'Схематики для строительства — подсказки блоков прямо в мире (только клиент).',
    category: 'comfort',
    modrinthSlug: 'litematica',
    curseforgeSlug: 'litematica',
    note: 'В сборке: 0.21.6. Нужен MaLiLib 0.23.5 — он уже в архиве. Автопостройка запрещена.',
  },
];

export const FABRIC_FORBIDDEN = [
  'X-Ray, Freecam, Baritone и другие читы',
  'Моды на полёт, скорость и автоклик',
  'Миникарты с радаром игроков и мобов (если показывают то, что не видно в игре)',
  'Автопостройка схематик (Easy Place / принтер) — Litematica только для подсказок',
] as const;

export function modrinthInstallUrl(slug: string) {
  return `https://modrinth.com/mod/${slug}?version=${FABRIC_GAME_VERSION}&loader=fabric#download`;
}

export function curseforgeInstallUrl(slug: string) {
  return `https://www.curseforge.com/minecraft/mc-mods/${slug}/files/all?page=1&pageSize=20&version=${FABRIC_GAME_VERSION}&gameVersionTypeId=4`;
}
