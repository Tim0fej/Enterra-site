export type SiteRole = 'user' | 'moderator' | 'admin';

export type MediaPlatform = 'youtube' | 'twitch' | 'tiktok';

export const MEDIA_PLATFORMS: MediaPlatform[] = ['youtube', 'twitch', 'tiktok'];

export type MediaPrivilegeSlug = MediaPlatform;

export type DisplayGroupId = 'player' | 'admin' | 'moder' | 'vip' | MediaPrivilegeSlug;

export const MEDIA_BADGES: Record<MediaPlatform, string> = {
  youtube: '/groups/media-youtube.png',
  twitch: '/groups/media-twitch.png',
  tiktok: '/groups/media-tiktok.png',
};

export const DISPLAY_GROUPS: Record<
  DisplayGroupId,
  { label: string; luckPermsGroup: string; badge: string }
> = {
  player: { label: 'Player', luckPermsGroup: 'default', badge: '/groups/player.png' },
  admin: { label: 'Admin', luckPermsGroup: 'admin', badge: '/groups/admin.png' },
  moder: { label: 'Supporter', luckPermsGroup: 'moder', badge: '/groups/supporter.png' },
  vip: { label: 'Vip', luckPermsGroup: 'vip', badge: '/groups/vip.png' },
  youtube: { label: 'YouTube', luckPermsGroup: 'youtube', badge: MEDIA_BADGES.youtube },
  twitch: { label: 'Twitch', luckPermsGroup: 'twitch', badge: MEDIA_BADGES.twitch },
  tiktok: { label: 'TikTok', luckPermsGroup: 'tiktok', badge: MEDIA_BADGES.tiktok },
};

export function isMediaPrivilegeSlug(slug?: string | null): slug is MediaPrivilegeSlug {
  return slug === 'youtube' || slug === 'twitch' || slug === 'tiktok';
}

export function normalizeMediaPlatform(value?: string | null): MediaPlatform | null {
  if (!value?.trim()) return null;
  const v = value.trim().toLowerCase();
  if (v === 'youtube' || v.includes('youtube')) return 'youtube';
  if (v === 'twitch' || v.includes('twitch')) return 'twitch';
  if (v === 'tiktok' || v.includes('tiktok')) return 'tiktok';
  return null;
}

export function resolveDisplayGroup(
  role: SiteRole | string,
  privilegeSlug?: string | null,
  mediaPlatform?: string | null,
): DisplayGroupId {
  const slug = privilegeSlug?.toLowerCase();
  if (slug === 'vip' || slug === 'legend') return 'vip';
  if (isMediaPrivilegeSlug(slug)) return slug;
  if (slug === 'media') {
    return normalizeMediaPlatform(mediaPlatform) ?? 'youtube';
  }
  if (role === 'admin') return 'admin';
  if (role === 'moderator') return 'moder';
  return 'player';
}

export function getDisplayGroupMeta(group: DisplayGroupId | string) {
  if (group in DISPLAY_GROUPS) {
    return DISPLAY_GROUPS[group as DisplayGroupId];
  }
  if (isMediaPrivilegeSlug(group)) {
    return DISPLAY_GROUPS[group];
  }
  return DISPLAY_GROUPS.player;
}

export function resolveGroupBadge(
  group: DisplayGroupId | string,
  _mediaPlatform?: MediaPlatform | string | null,
): string {
  if (isMediaPrivilegeSlug(group)) {
    return MEDIA_BADGES[group];
  }
  return getDisplayGroupMeta(group).badge;
}

export function resolveLuckPermsGroup(
  role: SiteRole | string,
  privilegeSlug?: string | null,
  mediaPlatform?: string | null,
): string {
  const slug = privilegeSlug?.toLowerCase();
  if (isMediaPrivilegeSlug(slug)) {
    return slug;
  }
  if (slug === 'media') {
    return normalizeMediaPlatform(mediaPlatform) ?? 'youtube';
  }
  return DISPLAY_GROUPS[resolveDisplayGroup(role, privilegeSlug, mediaPlatform)].luckPermsGroup;
}
