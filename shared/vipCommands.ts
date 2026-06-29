/** Команды в CommandWhitelist — сверка с deploy/command-whitelist-config.yml */

export const DEFAULT_PLAYER_COMMANDS = [
  'code / verify — вход на сервер',
  'privsync — синхронизация привилегий с сайтом',
  'emote / emotes — Emotecraft',
  'voicechat / vc — Simple Voice Chat',
  'msg, tell, list — чат и список игроков',
] as const;

/** Команды VIP / медиа (группы vip, youtube, twitch, tiktok). */
export const VIP_COMMAND_PERKS = [
  'EnterraMusic — /musicdisc (play, create, stop; reload запрещён)',
  'Любой скин — /skin (SkinsRestorer)',
  'Логи блоков — /co inspect (CoreProtect)',
  'Цвет чата — /chatcolor',
  'Бросок диска — /disc, /throw',
] as const;

/** Команды модераторов (группа moder): VIP + LiteBans + tp. */
export const MODERATOR_COMMAND_PERKS = [
  ...VIP_COMMAND_PERKS,
  'LiteBans — ban, mute, warn, kick, history, checkban и т.д.',
  'Телепорт — /tp, /tphere',
] as const;

/** dev / admin — пустой whitelist = все команды. */
export const STAFF_COMMAND_GROUPS = ['dev', 'admin'] as const;
