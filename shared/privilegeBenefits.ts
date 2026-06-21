import { MEDIA_REQUIREMENTS } from './mediaRequirements';

const SHARED_GAME_BENEFITS = [
  'EnterraMusic — создание и проигрывание музыки',
  'Музыкальные пластинки — до 15 минут на одну',
  'CoreProtect — просмотр логов блоков (/co inspect)',
  'Расширенный набор команд (Vip whitelist)',
] as const;

export function getVipBenefits(): string[] {
  return [
    'Бейдж Vip на сайте и в списке игроков',
    'Группа Vip в игре — выдаётся после оформления на сайте',
    'Префикс Vip в чате',
    ...SHARED_GAME_BENEFITS,
  ];
}

export function getMediaPlatformBenefits(platform: 'YouTube' | 'Twitch' | 'TikTok'): string[] {
  return [
    `Бейдж ${platform} на сайте и в списке игроков`,
    `Группа ${platform} в игре — те же права, что у Vip`,
    `Префикс ${platform} в чате`,
    'Для контент-мейкеров про Enterra',
    ...MEDIA_REQUIREMENTS,
    'Выдаётся после проверки заявки администрацией',
    ...SHARED_GAME_BENEFITS,
  ];
}

export const PRIVILEGE_BENEFITS: Record<string, string[]> = {
  vip: getVipBenefits(),
  youtube: getMediaPlatformBenefits('YouTube'),
  twitch: getMediaPlatformBenefits('Twitch'),
  tiktok: getMediaPlatformBenefits('TikTok'),
};
