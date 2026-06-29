export const SERVER_CONFIG = {
  ip: 'Enterra.minerent.io',
  port: 25565,
  version: '1.21.4',
  versionLabel: '1.21.4+',
  loader: 'Fabric',
  maxPlayers: 150,
} as const;

export {
  SERVER_DAILY_RESTART_SHORT,
  SERVER_DAILY_RESTART_DESCRIPTION,
} from '../shared/serverSchedule';

/** Официальный Telegram-канал */
export const TELEGRAM_CHANNEL_URL = 'https://t.me/enterra_official';

export { RULES_SUMMARY as RULES } from '../shared/rulesContent';

/**
 * Готовая сборка модов — поменяй downloadUrl, когда выложишь ZIP / Modpack.
 * Подойдёт ссылка с Modrinth, CurseForge, Google Drive, Discord и т.д.
 */
export const ENTERRA_MODPACK = {
  downloadUrl:
    'https://www.dropbox.com/scl/fi/1ojeuwocwsnbgqp738sf6/1.21.4.rar?rlkey=wzq06ttj3an9bx2ku4pif8d5k&st=b0j6ids4&dl=1',
  title: 'Enterra Comfort',
  description:
    'Fabric Loader 0.19.3 · Minecraft 1.21.4 — Sodium, Iris, голосовой чат, Emotecraft, Litematica и UI-моды. В архиве также шейдеры и ресурспак Excalibur. Скачай, распакуй в .minecraft и играй.',
} as const;

export const NAV_LINKS = [
  { href: '/forum', label: 'Форум' },
  { href: '/mods', label: 'Моды', authOnly: true },
  { href: '/shop', label: 'Магазин' },
  { href: '/media', label: 'Медиа' },
  { href: '/tickets', label: 'Тикеты' },
] as const;

export function navLinksForUser(isLoggedIn: boolean) {
  return NAV_LINKS.filter((link) => isLoggedIn || !('authOnly' in link && link.authOnly));
}

export const FEATURES = [
  {
    icon: '🌿',
    title: 'Чистая ванилла',
    description:
      'Моды только для комфорта (Sodium, Iris и UI). Геймплей максимально близок к одиночной игре — без китов, варпов и экономики.',
  },
  {
    icon: '🤝',
    title: 'Дружное сообщество',
    description:
      'Игроки помогают друг другу, строят города и проходят ивенты вместе. Токсичность здесь не приветствуется.',
  },
  {
    icon: '🛡️',
    title: 'Защита территорий',
    description:
      'CoreProtect фиксирует действия с блоками — администрация может восстановить постройки после грифа.',
  },
  {
    icon: '🗺️',
    title: 'Большой мир',
    description:
      'Огромная карта с биомами, данжами и океанами. Есть место для каждого — от hermit-базы до мегаполисов.',
  },
  {
    icon: '⚡',
    title: 'Стабильный TPS',
    description:
      'Мощное железо и оптимизация чанков обеспечивают плавную игру даже при большом онлайне.',
  },
] as const;

export const JOIN_STEPS = [
  {
    title: 'Зарегистрируйся на сайте',
    description:
      'Укажи тот же ник, что в Minecraft — буква в букву. Плагин сверяет их при входе на сервер',
    link: '/register',
  },
  {
    title: 'Запусти Minecraft',
    description: 'Java Edition 1.21.4 с Fabric — список модов на странице «Моды»',
    link: '/mods',
  },
  {
    title: 'Подключись к серверу',
    description: 'Скопируй IP из профиля на сайте',
    showIp: true,
  },
  {
    title: 'Введи код в чат',
    description: 'При первом входе на сервере: /code ТВОЙ_КОД из профиля',
  },
] as const;

export const HERO_HIGHLIGHTS = [
  { icon: '🧩', title: 'Моды', desc: 'Fabric-сборка Enterra Comfort', href: '/mods', authOnly: true },
  {
    icon: '📢',
    title: 'Telegram',
    desc: 'Новости и объявления сервера',
    href: TELEGRAM_CHANNEL_URL,
    external: true,
  },
  {
    icon: '🎫',
    title: 'Написать в поддержку',
    desc: 'Тикеты — поможем с входом и игрой',
    href: '/tickets/new',
  },
  { icon: '💬', title: 'Форум', desc: 'Обсуждения, новости и помощь', href: '/forum' },
] as const;

/** Лаунчеры и сервисы скинов для пиратских / offline аккаунтов */
export const SKIN_LAUNCHERS = [
  {
    id: 'elyby',
    name: 'Ely.by',
    icon: '🎭',
    url: 'https://ely.by',
    summary: 'Основной способ — скин привязан к нику на Ely.by',
    steps: [
      'Зарегистрируйся на Ely.by под тем же ником, что на сайте Enterra',
      'Выбери или загрузи скин в личном кабинете',
      'Зайди на сервер — скин подтянется автоматически',
    ],
  },
  {
    id: 'tlauncher',
    name: 'TLauncher / TLSkins',
    icon: '🚀',
    url: 'https://tlauncher.org',
    summary: 'В настройках лаунчера выбери сервер скинов Ely.by',
    steps: [
      'Открой настройки аккаунта → сервер скинов → Ely.by (не случайный TLSkins)',
      'Ник в лаунчере должен совпадать с ником на сайте',
      'Скин можно задать на Ely.by или через редактор в TLauncher',
    ],
  },
  {
    id: 'other',
    name: 'Prism, MultiMC и другие',
    icon: '💻',
    summary: 'Любой лаунчер с поддержкой Ely.by или лицензией Java',
    steps: [
      'Укажи Ely.by как источник скинов или привяжи аккаунт Ely.by',
      'Лицензия Java Edition — скин с account.microsoft.com тоже работает',
      'Если скин не обновился — перезайди или напиши в тикет',
    ],
  },
] as const;

export const STATS = [
  { key: 'players', label: 'игроков онлайн', dynamic: true },
  { value: '24/7', label: 'работа · рестарт 00:00 МСК', dynamic: false },
  { value: 'Fabric', label: 'сборка Comfort', dynamic: false },
] as const;
