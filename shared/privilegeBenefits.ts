import {
  getMediaPlatformSpec,
  getMediaSpecBySlug,
  type MediaPlatformName,
} from './mediaRequirements';
import { VIP_COMMAND_PERKS } from './vipCommands';

export function getVipBenefits(): string[] {
  return [
    'Бейдж VIP на сайте и в списке игроков',
    'Группа VIP в игре — выдаётся после оформления на сайте',
    'Префикс VIP в чате',
    'Смена цвета ника — палитра и RGB в профиле на сайте',
    ...VIP_COMMAND_PERKS,
  ];
}

export function getMediaPlatformBenefits(platform: MediaPlatformName): string[] {
  return [...getMediaPlatformSpec(platform).perks];
}

export function getMediaPlatformBenefitsBySlug(slug: string): string[] {
  const spec = getMediaSpecBySlug(slug);
  return spec ? [...spec.perks] : [];
}

export const PRIVILEGE_BENEFITS: Record<string, string[]> = {
  vip: getVipBenefits(),
  youtube: getMediaPlatformBenefits('YouTube'),
  twitch: getMediaPlatformBenefits('Twitch'),
  tiktok: getMediaPlatformBenefits('TikTok'),
};
