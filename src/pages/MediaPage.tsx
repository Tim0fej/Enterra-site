import { Link } from 'react-router-dom';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { GroupBadge } from '../components/GroupBadge';
import { MediaRequirementsBlock } from '../components/MediaRequirementsBlock';
import { MediaSharedPerks } from '../components/MediaSharedPerks';
import { PRIVILEGE_BENEFITS } from '../../shared/privilegeBenefits';
import type { SupportPrivilege } from '../types/players';

const MEDIA_TIERS: SupportPrivilege[] = [
  {
    slug: 'youtube',
    name: 'YouTube',
    description: 'Для ютуберов — контент про Enterra на YouTube.',
    color: '#ff0000',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: PRIVILEGE_BENEFITS.youtube,
  },
  {
    slug: 'twitch',
    name: 'Twitch',
    description: 'Для стримеров Twitch — контент про Enterra.',
    color: '#9146ff',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: PRIVILEGE_BENEFITS.twitch,
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    description: 'Для авторов TikTok — контент про Enterra.',
    color: '#00f2ea',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: PRIVILEGE_BENEFITS.tiktok,
  },
];

function MediaTierCard({
  tier,
  user,
}: {
  tier: SupportPrivilege;
  user: ReturnType<typeof useAuth>['user'];
}) {
  const hasTier = user?.privilege?.slug === tier.slug;
  const applyPath = `/media/apply?platform=${tier.slug}`;
  const loginPath = `/login?next=${encodeURIComponent(applyPath)}`;

  return (
    <div className="card support-card support-card--plan support-card--media">
      <div className="support-card__badge">
        <GroupBadge role="user" privilegeSlug={tier.slug} size="lg" />
      </div>
      <p className="support-card__price support-card__price--free">По заявке</p>
      <p className="muted">{tier.description}</p>
      <MediaRequirementsBlock slug={tier.slug} variant="card" />
      {user ? (
        hasTier ? (
          <span className="badge badge--open">Заявка одобрена</span>
        ) : (
          <Link to={applyPath} className="btn btn--ghost btn--full">
            Подать заявку
          </Link>
        )
      ) : (
        <Link to={loginPath} className="btn btn--ghost btn--full">
          Войти и подать заявку
        </Link>
      )}
    </div>
  );
}

export function MediaPage() {
  const { user } = useAuth();

  return (
    <PageShell
      title="Медиа"
      subtitle="Привилегии для ютуберов, стримеров и авторов TikTok"
      wide
    >
      <div className="pixel-panel pixel-panel--intro">
        <p>
          Если вы снимаете контент про Enterra — подайте заявку. После одобрения выдаётся бейдж на
          сайте и группа в игре с правами уровня VIP.
        </p>
        <p className="muted">
          VIP за донат — в <Link to="/shop">магазине</Link>, здесь только заявки для медиа.
        </p>
      </div>

      <MediaSharedPerks />

      <h3 className="support-section-title">Платформы</h3>
      <div className="support-grid support-grid--media">
        {MEDIA_TIERS.map((tier) => (
          <MediaTierCard key={tier.slug} user={user} tier={tier} />
        ))}
      </div>

      <div className="card support-cta">
        <h3>Есть вопрос?</h3>
        <p className="muted">Напишите в чат поддержки — ответ придёт на сайте.</p>
        <Link to="/tickets" className="btn btn--primary">
          Открыть тикеты
        </Link>
      </div>
    </PageShell>
  );
}
