import { TICKET_INACTIVITY_HOURS } from './ticketConfig';
import { MODERATOR_COMMAND_PERKS } from './vipCommands';

export const ADMIN_GUIDE_TITLE = 'Памятка администрации';
export const ADMIN_GUIDE_SUBTITLE =
  'Команды, инструменты и сценарии для модераторов и администраторов Enterra';

const MC_SERVER_ADDRESS = 'Enterra.minerent.io';
const MC_VERSION_LABEL = '1.21.4+';
const MC_LOADER = 'Fabric';

export type StaffGuideAudience = 'all' | 'admin';

export interface StaffGuideCommand {
  command: string;
  description: string;
  example?: string;
  note?: string;
}

export interface StaffGuideSituation {
  title: string;
  actions: readonly string[];
}

export interface StaffGuideSection {
  id: string;
  title: string;
  audience: StaffGuideAudience;
  intro?: string;
  commands?: StaffGuideCommand[];
  bullets?: string[];
  situations?: StaffGuideSituation[];
  links?: { label: string; href: string }[];
  warnings?: string[];
}

export const STAFF_GUIDE_SECTIONS: StaffGuideSection[] = [
  {
    id: 'overview',
    title: 'Кратко о ролях',
    audience: 'all',
    bullets: [
      'Модератор и админ на сайте получают группы LuckPerms moder и admin на сервере после входа (синхронизация EnterraAuth, команда /privsync).',
      'Группы admin, dev и moder на сервере защищены: их нельзя забанить, кикнуть или замутить через LiteBans и через панель наказаний на сайте.',
      'При режиме «Технические работы» на сайте обычные игроки не могут зайти на Minecraft — только модераторы и админы с ролью на сайте.',
      `Адрес сервера: ${MC_SERVER_ADDRESS} · версия ${MC_VERSION_LABEL} (${MC_LOADER}).`,
      'Памятка доступна по адресу /staff-guide из меню, панели модератора и админ-панели.',
    ],
    links: [
      { label: 'Панель модератора', href: '/moder' },
      { label: 'Тикеты', href: '/tickets' },
      { label: 'Форум', href: '/forum' },
    ],
  },
  {
    id: 'situations',
    title: 'Что делать в типичных ситуациях',
    audience: 'all',
    intro:
      'Краткие сценарии. Если сомневаешься или нужны права админа — передай тикет коллеге или оставь в общей очереди.',
    situations: [
      {
        title: 'Игрок не может войти на сервер',
        actions: [
          'Проверь статус на главной сайта и режим в админ-панели (auto / maintenance / offline).',
          'Попроси код доступа в профиле на сайте и команду /code на сервере.',
          'После покупки VIP или выдачи медиа — /privsync.',
          'Если бан — /checkban; разбан только если уверен в ошибке или по решению администрации.',
        ],
      },
      {
        title: 'Жалоба на игрока в тикете',
        actions: [
          'Ответь в тикете, закрепи диалог за собой (первый ответ mod/admin).',
          'Попроси ник, время, скрин или описание; при необходимости /co inspect у VIP-модера или проверь историю /history.',
          'Эскалация: warn → mute → kick → ban по правилам; фиксируй причину.',
          'Не наказывай модераторов и админов — передай администрации.',
        ],
      },
      {
        title: 'Токсичность, спам, оскорбления в чате',
        actions: [
          'Первое нарушение — /warn с понятной причиной.',
          'Повтор или флуд — /tempmute на срок (30m, 1h, 1d).',
          'Системный спам или тяжёлые оскорбления — mute дольше или kick; бан — за читы и повтор после банов.',
        ],
      },
      {
        title: 'Подозрение на читы',
        actions: [
          'Собери доказательства (скрин, видео, свидетели).',
          'Временный бан /tempban на проверку или постоянный ban с причиной «читы» после уверенности.',
          'Через сайт (/moder → «Применить на сервере») — только на обычных игроков, не на команду сервера.',
        ],
      },
      {
        title: 'Заявка на VIP или медиа',
        actions: [
          'VIP — оплата на сайте; после оплаты игрок жмёт /privsync.',
          'Медиа — тикет типа «YouTube / Twitch / TikTok»; проверь канал и статистику по условиям на /media.',
          'Выдачу медиа и VIP делает только admin в админ-панели; модератор помогает с проверкой и ответом в тикете.',
        ],
      },
      {
        title: 'Игрок просит разбан / снять мут',
        actions: [
          'Проверь /history и причину наказания.',
          'Если наказание справедливо — объясни срок; если ошибка — /unban или /unmute с комментарием.',
          'Разбан через сайт: /moder → активные наказания → «Разбан» / «Снять мут».',
        ],
      },
      {
        title: 'Наказание через сайт не сработало',
        actions: [
          'В «Истории с сайта» смотри статус: «В очереди», «Выполнено» или «Ошибка».',
          'Нельзя наказать moder/admin/dev на сервере — будет ошибка; используй /ban в игре только для обычных игроков.',
          'Не тестируй ban/mute на своём нике, если у тебя группа moder на сервере.',
          'Если ошибка на обычном игроке — сообщи админу; очередь опрашивается каждые ~5 сек.',
        ],
      },
      {
        title: 'Нужно опубликовать новость',
        actions: [
          'Форум → категория «Новости» — только модераторы и админы.',
          'Краткий заголовок, суть в первом посте; при необходимости закрепи тему.',
        ],
      },
      {
        title: 'Форум: спам, оффтоп, оскорбления',
        actions: [
          'Закрой тему (🔒), если обсуждение исчерпано или нарушает правила.',
          'Удали отдельное сообщение или всю тему (первый пост удаляет тему целиком).',
          'В закрытую тему игроки не пишут; модераторы и админы — могут.',
        ],
      },
      {
        title: 'Технические работы',
        actions: [
          'Admin включает maintenance в админ-панели — игроки без роли mod/admin на сайте не зайдут на MC.',
          'Команда сервера с ролью moderator/admin на сайте заходит как обычно.',
          'После работ — вернуть режим auto или online.',
        ],
      },
    ],
  },
  {
    id: 'site-moder',
    title: 'Сайт — модерация',
    audience: 'all',
    intro: 'Доступно модераторам и админам.',
    bullets: [
      'Панель модератора (/moder) — свободные тикеты, закреплённые диалоги, форум, наказания через LiteBans.',
      'Тикеты (/tickets) — свободные обращения видны всей администрации. Ответ mod/admin закрепляет диалог за вами.',
      'Передать диалог — в чате выбрать mod/admin или «Свободный — в общую очередь».',
      `Статусы: «Открыт», «В работе», «Закрыт». Без новых сообщений диалог исчезает через ${TICKET_INACTIVITY_HOURS} ч.`,
      'На форуме: закрепление, закрытие, удаление тем и сообщений.',
      'В закрытую тему пишут только модераторы и админы.',
    ],
    links: [
      { label: 'Панель модератора', href: '/moder' },
      { label: 'Тикеты', href: '/tickets' },
    ],
  },
  {
    id: 'site-punishments',
    title: 'Сайт — наказания через /moder',
    audience: 'all',
    intro: 'Команда ставится в очередь и выполняется на сервере через LiteBans (~5 сек).',
    bullets: [
      'Доступны: ban, unban, mute, unmute, warn, unwarn, kick.',
      'Укажи ник (3–16 символов), срок для ban/mute (7d, 30d, 1h) и причину.',
      'Активные ban/mute/warn подтягиваются с сервера (~25 сек) — блок «Активные наказания».',
      'Нельзя наказать модератора или админа на сайте и на сервере (группы moder, admin, dev).',
      'История показывает, кто отправил команду и статус выполнения.',
    ],
    warnings: [
      'Не используй панель для наказания членов команды — только обычных игроков.',
    ],
  },
  {
    id: 'site-admin',
    title: 'Сайт — админ-панель',
    audience: 'admin',
    intro: 'Только для роли admin на сайте.',
    bullets: [
      'Пользователи — поиск, смена роли (user / moderator / admin), сброс верификации, код доступа, удаление.',
      'Привилегии — VIP, Legend, медиа (YouTube, Twitch, TikTok). После выдачи — /privsync на сервере.',
      'Статус сервера — отображение на главной и блокировка входа на MC при тех. работах.',
      'Режим auto — из мониторинга. maintenance — тех. работы. offline / online — принудительный статус.',
      'Нельзя удалить последнего админа и нельзя изменить свой аккаунт из панели.',
    ],
    links: [{ label: 'Админ-панель', href: '/admin' }],
  },
  {
    id: 'mc-auth',
    title: 'Minecraft — EnterraAuth',
    audience: 'all',
    intro: 'Авторизация через сайт. Полезно при помощи игрокам.',
    commands: [
      {
        command: '/code <код>',
        description: 'Подтвердить вход кодом из профиля на сайте.',
        example: '/code A1B2C3',
      },
      {
        command: '/privsync',
        description: 'Синхронизировать привилегию и роль с сайтом (VIP, медиа, mod/admin).',
        example: '/privsync',
      },
    ],
    bullets: [
      'Код доступа — в профиле (enterra.tech/profile).',
      'При смене кода на сайте игрок будет кикнут.',
      'Мультиаккаунт с одного IP блокируется.',
    ],
  },
  {
    id: 'mc-vip-commands',
    title: 'Minecraft — команды VIP / медиа / moder',
    audience: 'all',
    intro: 'У модераторов те же VIP-команды плюс LiteBans и /tp. У admin/dev — полный доступ.',
    bullets: [...MODERATOR_COMMAND_PERKS],
    warnings: [
      '/musicdisc reload — запрещён для VIP, медиа и moder (только администрация сервера).',
      '/co rollback, restore, purge — только администрация; moder использует /co inspect.',
    ],
  },
  {
    id: 'mc-litebans',
    title: 'Minecraft — LiteBans (наказания)',
    audience: 'all',
    intro: 'Время: 1h, 7d, 30d, permanent. Градация: warn → mute → kick → ban.',
    commands: [
      { command: '/ban <ник> [время] [причина]', description: 'Забанить.', example: '/ban Steve 7d читы' },
      { command: '/tempban <ник> <время> [причина]', description: 'Временный бан.', example: '/tempban Steve 3d токсичность' },
      { command: '/unban <ник>', description: 'Снять бан.', example: '/unban Steve' },
      { command: '/kick <ник> [причина]', description: 'Кикнуть.', example: '/kick Steve AFK' },
      { command: '/mute <ник> [время] [причина]', description: 'Мут.', example: '/mute Steve 1h спам' },
      { command: '/tempmute <ник> <время> [причина]', description: 'Временный мут.', example: '/tempmute Steve 30m флуд' },
      { command: '/unmute <ник>', description: 'Снять мут.', example: '/unmute Steve' },
      { command: '/warn <ник> [причина]', description: 'Предупреждение.', example: '/warn Steve оскорбления' },
      { command: '/unwarn <ник>', description: 'Снять warn.', example: '/unwarn Steve' },
      { command: '/history <ник>', description: 'История наказаний.', example: '/history Steve' },
      { command: '/staffhistory <ник>', description: 'Кто выдавал наказания.', example: '/staffhistory Steve' },
      { command: '/checkban <ник>', description: 'Проверить бан.', example: '/checkban Steve' },
      { command: '/checkmute <ник>', description: 'Проверить мут.', example: '/checkmute Steve' },
      { command: '/banlist', description: 'Список банов.', example: '/banlist' },
    ],
    warnings: [
      'Не наказывай игроков с группами admin, dev, moder — команда заблокируется.',
      'Тихое наказание: флаг -s, если настроено в LiteBans: /ban -s Steve причина.',
    ],
  },
  {
    id: 'mc-luckperms',
    title: 'Minecraft — LuckPerms',
    audience: 'admin',
    intro: 'Роли и привилегии обычно идут с сайта; ручные правки — осторожно.',
    commands: [
      { command: '/lp user <ник> info', description: 'Права и группы.', example: '/lp user Steve info' },
      { command: '/lp user <ник> parent set <группа>', description: 'Основная группа.', example: '/lp user Steve parent set vip' },
      { command: '/lp group <группа> info', description: 'Состав группы.', example: '/lp group moder info' },
    ],
    bullets: [
      'Группы: default, vip, moder, admin, dev, youtube, twitch, tiktok.',
      'Роль moderator/admin на сайте → moder/admin на сервере. VIP и медиа — через сайт + /privsync.',
    ],
  },
];

export function staffGuideSectionsForRole(isAdmin: boolean): StaffGuideSection[] {
  return STAFF_GUIDE_SECTIONS.filter(
    (section) => section.audience === 'all' || (section.audience === 'admin' && isAdmin),
  );
}
