import { SHARED_MEDIA_PERKS } from '../../shared/mediaRequirements';
import { PrivilegePerksCard } from './PrivilegePerksCard';

export function MediaSharedPerks() {
  return <PrivilegePerksCard title="Что получают все медиа" items={SHARED_MEDIA_PERKS} />;
}
