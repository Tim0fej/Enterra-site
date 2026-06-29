import {
  getMediaPlatformSpec,
  getMediaSpecBySlug,
  getPartnerTierName,
  type MediaPlatformSpec,
  type MediaTierColumns,
  type MediaTierRequirement,
} from '../../shared/mediaRequirements';

interface MediaRequirementsBlockProps {
  platform?: import('../../shared/mediaRequirements').MediaPlatformName;
  slug?: string;
  variant?: 'full' | 'card';
}

function resolveSpec(
  platform?: import('../../shared/mediaRequirements').MediaPlatformName,
  slug?: string,
): MediaPlatformSpec | null {
  if (platform) return getMediaPlatformSpec(platform);
  if (slug) return getMediaSpecBySlug(slug);
  return null;
}

function MediaTierTable({
  tiers,
  columns,
  compact = false,
}: {
  tiers: readonly MediaTierRequirement[];
  columns: MediaTierColumns;
  compact?: boolean;
}) {
  return (
    <div className={`media-tier-table-wrap${compact ? ' media-tier-table-wrap--compact' : ''}`}>
      <table className={`media-tier-table${compact ? ' media-tier-table--compact' : ''}`}>
        <thead>
          <tr>
            <th>Уровень</th>
            <th>{columns.audience}</th>
            <th>{columns.metric}</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((tier) => (
            <tr key={tier.level}>
              <td>{tier.level}</td>
              <td>{tier.audience}</td>
              <td>{tier.metric}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MediaRequirementsBlock({
  platform,
  slug,
  variant = 'full',
}: MediaRequirementsBlockProps) {
  const spec = resolveSpec(platform, slug);
  if (!spec) return null;

  const tierColumns = spec.tierColumns ?? { audience: 'Аудитория', metric: 'Показатель' };
  const partnerTier = getPartnerTierName(spec);

  if (variant === 'card') {
    return (
      <div className="media-requirements-block media-requirements-block--card">
        <p className="media-card-identity">{spec.identity}</p>
        <ul className="media-card-reqs">
          {spec.cardRequirements.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="media-requirements-block">
      <h4 className="media-requirements__title">Условия получения</h4>
      <ul className="support-perks media-requirements">
        {spec.eligibility.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {spec.tiers && spec.tiers.length > 0 && (
        <>
          <h4 className="media-requirements__title">Уровни доступа</h4>
          <MediaTierTable tiers={spec.tiers} columns={tierColumns} />
          {spec.statsNote && <p className="media-requirements__note">{spec.statsNote}</p>}
        </>
      )}

      <h4 className="media-requirements__title">
        {spec.platform === 'Twitch' ? 'Что получает стример' : 'Что получает автор'}
      </h4>
      <ul className="support-perks media-requirements">
        {spec.perks.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {spec.partnerExtras && spec.partnerExtras.length > 0 && partnerTier && (
        <>
          <h4 className="media-requirements__title">Дополнительно для «{partnerTier}»</h4>
          <ul className="support-perks media-requirements">
            {spec.partnerExtras.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
