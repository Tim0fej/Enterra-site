import {
  getDisplayGroupMeta,
  MEDIA_BADGES,
  MEDIA_PLATFORMS,
  resolveDisplayGroup,
  resolveGroupBadge,
  type DisplayGroupId,
  type MediaPlatform,
} from '../../shared/displayGroup';
import type { UserRole } from '../utils/roles';

interface GroupBadgeProps {
  role: UserRole | string;
  privilegeSlug?: string | null;
  group?: DisplayGroupId | string;
  mediaPlatform?: MediaPlatform | string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function badgeSizeClass(size: GroupBadgeProps['size']) {
  if (size === 'sm') return ' group-badge--sm';
  if (size === 'lg') return ' group-badge--lg';
  return '';
}

export function GroupBadge({
  role,
  privilegeSlug,
  group,
  mediaPlatform,
  className = '',
  size = 'md',
}: GroupBadgeProps) {
  const id = (group ?? resolveDisplayGroup(role, privilegeSlug, mediaPlatform)) as DisplayGroupId;
  const info = getDisplayGroupMeta(id);
  const src = resolveGroupBadge(id, mediaPlatform);

  return (
    <img
      src={src}
      alt={info.label}
      title={info.label}
      className={`group-badge${badgeSizeClass(size)}${className ? ` ${className}` : ''}`}
      loading="lazy"
      decoding="async"
    />
  );
}

interface MediaPlatformBadgesProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MediaPlatformBadges({ className = '', size = 'md' }: MediaPlatformBadgesProps) {
  return (
    <div className={`group-badges-row${className ? ` ${className}` : ''}`}>
      {MEDIA_PLATFORMS.map((platform) => (
        <img
          key={platform}
          src={MEDIA_BADGES[platform]}
          alt={getDisplayGroupMeta(platform).label}
          title={getDisplayGroupMeta(platform).label}
          className={`group-badge${badgeSizeClass(size)}`}
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}
