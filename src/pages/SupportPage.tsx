import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useLayoutToast } from '../components/Layout';
import type { SupportInfo, SupportPrivilege } from '../types/players';
import { PRIVILEGE_BENEFITS } from '../../shared/privilegeBenefits';
import { isMediaPrivilegeSlug } from '../../shared/displayGroup';
import { GroupBadge } from '../components/GroupBadge';

const FALLBACK_BENEFITS = PRIVILEGE_BENEFITS;

const FALLBACK_VIP: SupportPrivilege = {
  slug: 'vip',
  name: 'Vip',
  description: 'Поддержка сервера — префикс Vip и полный набор игровых возможностей',
  color: '#00c8ff',
  price_rub: 99,
  billing_period: 'month',
  purchasable: true,
  benefits: FALLBACK_BENEFITS.vip,
};

const FALLBACK_MEDIA_TIERS: SupportPrivilege[] = [
  {
    slug: 'youtube',
    name: 'YouTube',
    description: 'Для ютуберов — по заявке после проверки канала.',
    color: '#ff0000',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: FALLBACK_BENEFITS.youtube,
  },
  {
    slug: 'twitch',
    name: 'Twitch',
    description: 'Для стримеров — по заявке после проверки канала.',
    color: '#9146ff',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: FALLBACK_BENEFITS.twitch,
  },
  {
    slug: 'tiktok',
    name: 'TikTok',
    description: 'Для авторов TikTok — по заявке после проверки канала.',
    color: '#00f2ea',
    price_rub: null,
    billing_period: null,
    purchasable: false,
    benefits: FALLBACK_BENEFITS.tiktok,
  },
];

type RawSupportInfo = SupportInfo & {
  plans?: SupportPrivilege[];
  perks?: string[];
};

function normalizeTierSlug(slug: string) {
  if (slug === 'legend') return 'vip';
  if (slug === 'media') return 'youtube';
  return slug;
}

function normalizeSupportInfo(raw: RawSupportInfo): SupportInfo {
  const source = raw.privileges?.length ? raw.privileges : raw.plans ?? [];

  const privileges = source
    .map((tier) => {
      const slug = normalizeTierSlug(tier.slug);
      return {
        ...tier,
        slug,
        name: tier.slug === 'legend' ? 'Vip' : tier.name,
        benefits: FALLBACK_BENEFITS[slug]?.length
          ? FALLBACK_BENEFITS[slug]
          : tier.benefits ?? [],
      };
    })
    .filter((tier) => tier.slug !== 'media');

  if (!privileges.some((tier) => tier.slug === 'vip')) {
    privileges.unshift(FALLBACK_VIP);
  }

  for (const fallback of FALLBACK_MEDIA_TIERS) {
    if (!privileges.some((tier) => tier.slug === fallback.slug)) {
      privileges.push(fallback);
    }
  }

  return {
    title: raw.title,
    description: raw.description,
    serverCost: raw.serverCost,
    privileges,
    boostyUrl: raw.boostyUrl ?? '',
  };
}

function formatPeriod(period: string | null) {
  if (period === 'month') return 'мес';
  if (period === 'year') return 'год';
  return period ?? '';
}

function PrivilegeCard({
  tier,
  user,
  purchasing,
  boostyUrl,
  onPurchase,
}: {
  tier: SupportPrivilege;
  user: ReturnType<typeof useAuth>['user'];
  purchasing: string | null;
  boostyUrl: string;
  onPurchase: (slug: string) => void;
}) {
  const hasTier = user?.privilege?.slug === tier.slug
    || (tier.slug === 'vip' && user?.privilege?.slug === 'legend');
  const isVip = tier.slug === 'vip';
  const isMedia = isMediaPrivilegeSlug(tier.slug);

  return (
    <div className="card support-card support-card--plan">
      <div className="support-card__badge">
        <GroupBadge role="user" privilegeSlug={tier.slug} size="lg" />
      </div>

      {isVip && tier.price_rub != null && (
        <p className="support-card__price">
          {tier.price_rub} ₽<span> / {formatPeriod(tier.billing_period)}</span>
        </p>
      )}

      {isMedia && (
        <p className="support-card__price support-card__price--free">По заявке</p>
      )}

      <p className="muted">{tier.description}</p>

      <ul className="support-perks support-perks--card">
        {tier.benefits.map((benefit) => (
          <li key={benefit}>{benefit}</li>
        ))}
      </ul>

      {isVip ? (
        !user ? (
          <Link to="/login" className="btn btn--primary btn--full">Войти для оформления</Link>
        ) : hasTier ? (
          <span className="badge badge--open">Уже оформлено</span>
        ) : (
          <button
            type="button"
            className="btn btn--primary btn--full"
            disabled={purchasing === tier.slug}
            onClick={() => onPurchase(tier.slug)}
          >
            {purchasing === tier.slug ? 'Оформление...' : 'Оформить Vip'}
          </button>
        )
      ) : user ? (
        hasTier ? (
          <span className="badge badge--open">Заявка одобрена</span>
        ) : (
          <Link to="/support/media" className="btn btn--ghost btn--full">Подать заявку</Link>
        )
      ) : (
        <Link to="/login" className="btn btn--ghost btn--full">Войти и подать заявку</Link>
      )}

      {isVip && boostyUrl && (
        <a
          href={boostyUrl}
          className="link-btn support-card__boosty"
          target="_blank"
          rel="noopener noreferrer"
        >
          Или через Boosty →
        </a>
      )}
    </div>
  );
}

export function SupportPage() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useLayoutToast();
  const [info, setInfo] = useState<SupportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    void api<RawSupportInfo>('/support')
      .then((data) => setInfo(normalizeSupportInfo(data)))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (tierSlug: string) => {
    if (!user) return;
    setPurchasing(tierSlug);
    try {
      const result = await api<{ message: string }>('/support/purchase', {
        method: 'POST',
        body: JSON.stringify({ tierSlug }),
      });
      showToast(result.message);
      await refreshUser();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка оформления');
    } finally {
      setPurchasing(null);
    }
  };

  const vipTiers = info?.privileges.filter((tier) => tier.slug === 'vip') ?? [];
  const mediaTiers = info?.privileges.filter((tier) => isMediaPrivilegeSlug(tier.slug)) ?? [];

  return (
    <PageShell
      title="Поддержать проект"
      subtitle="Vip — оформление на сайте. YouTube, Twitch и TikTok — по заявке"
    >
      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : !info ? (
        <div className="card empty-state">
          <p>Не удалось загрузить информацию</p>
        </div>
      ) : (
        <>
          <div className="card support-cost">
            <span className="support-cost__label">Стоимость сервера</span>
            <strong className="support-cost__value">{info.serverCost.monthlyRub} ₽/мес</strong>
            <p className="muted">{info.serverCost.note}</p>
          </div>

          <div className="card">
            <p>{info.description}</p>
          </div>

          <div className="support-grid">
            {vipTiers.map((tier) => (
              <PrivilegeCard
                key={tier.slug}
                tier={tier}
                user={user}
                purchasing={purchasing}
                boostyUrl={info.boostyUrl}
                onPurchase={(slug) => void handlePurchase(slug)}
              />
            ))}
          </div>

          <h3 className="support-section-title">Контент-мейкеры</h3>
          <div className="support-grid support-grid--media">
            {mediaTiers.map((tier) => (
              <PrivilegeCard
                key={tier.slug}
                tier={tier}
                user={user}
                purchasing={purchasing}
                boostyUrl={info.boostyUrl}
                onPurchase={(slug) => void handlePurchase(slug)}
              />
            ))}
          </div>

          <div className="card support-cta">
            <h3>Есть вопрос?</h3>
            <p className="muted">Напиши в чат поддержки — ответ придёт на сайте.</p>
            <Link to="/tickets" className="btn btn--primary">Открыть поддержку</Link>
          </div>
        </>
      )}
    </PageShell>
  );
}
