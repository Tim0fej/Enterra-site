export const SERVER_CONFIG = {
  ip: 'play.enterra.ru',
  port: 25565,
  version: '1.21.4',
  loader: 'Fabric',
} as const;

/**
 * Готовая сборка модов — поменяй downloadUrl, когда выложишь ZIP / Modpack.
 * Подойдёт ссылка с Modrinth, CurseForge, Google Drive, Discord и т.д.
 */
export const ENTERRA_MODPACK = {
  downloadUrl: 'https://www.dropbox.com/scl/fi/u956qby6ooi67mwy6yq47/mods.rar?rlkey=kpn81m4oiqu2t2qw3glqxxv62&st=snl2y7zb&dl=1',
  title: 'Enterra Comfort',
  description: 'Fabric 1.21.4 — все рекомендуемые моды уже внутри. Скачай, распакуй в .minecraft и играй.',
} as const;

export const NAV_LINKS = [
  { href: '/forum', label: 'Форум' },
  { href: '/mods', label: 'Моды' },
  { href: '/support', label: 'Поддержать' },
  { href: '/tickets', label: 'Тикеты' },
] as const;

export const FEATURES = [
  {
    icon: '🌿',
    title: 'Чистая ванилла',
    description:
      'Только Paper/Spigot для стабильности. Геймплей максимально близок к одиночной игре — без китов, варпов и экономики.',
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

export const RULES = [
  {
    title: 'Уважай других игроков',
    description: 'Без оскорблений, травли, дискриминации и спама в чате.',
  },
  {
    title: 'Не грифь',
    description: 'Не ломай и не воруй чужие постройки.',
  },
  {
    title: 'Без читов',
    description: 'X-Ray, fly-hack, автокликеры и другие читы — мгновенный бан без апелляции.',
  },
  {
    title: 'Не используй баги',
    description: 'Дюпы и эксплойты запрещены. Нашёл баг — сообщи администрации.',
  },
  {
    title: 'Играй честно',
    description: 'Один аккаунт на человека. Мультиаккаунты для обхода бана запрещены.',
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

export const STATS = [
  { key: 'players', label: 'игроков онлайн', dynamic: true },
  { value: '24/7', label: 'работа сервера', dynamic: false },
  { value: '100%', label: 'ванильный геймплей', dynamic: false },
  { value: '0', label: 'донат за силу', dynamic: false },
] as const;
