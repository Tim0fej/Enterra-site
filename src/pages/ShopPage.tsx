import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PRIVILEGE_BENEFITS } from '../../shared/privilegeBenefits';
import { PrivilegePerksCard } from '../components/PrivilegePerksCard';
import {
  SHOP_CATEGORIES,
  SHOP_DONATION,
  SHOP_DONATION_FILTERS,
  SHOP_SIDEBAR,
  visibleShopPlaceholders,
  type ShopCategoryId,
  type ShopPlaceholderItem,
  type ShopSidebarFilter,
} from '../../shared/shopCatalog';
import { donationAlertsUrlForUsername } from '../../shared/supportConfig';
import { api } from '../api/client';
import { GroupBadge } from '../components/GroupBadge';
import { ShopPurchaseTicker } from '../components/ShopPurchaseTicker';
import { PageShell, useLayoutError, useLayoutToast } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { EasyDonateCheckoutResult, ShopInfo, ShopProduct } from '../types/players';
import { formatApiError } from '../utils/formatError';

declare global {
  interface Window {
    __ENTERRA_SHOP__?: ShopInfo;
  }
}

function readInitialShopInfo(): ShopInfo | null {
  const data = window.__ENTERRA_SHOP__;
  if (!data || !Array.isArray(data.products)) return null;
  return data;
}

function vipPeriodLabel(months: number): string {
  const mod10 = months % 10;
  const mod100 = months % 100;
  if (mod10 === 1 && mod100 !== 11) return `${months} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${months} месяца`;
  return `${months} месяцев`;
}

function productCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

function ShopPlaceholderCard({ item }: { item: ShopPlaceholderItem }) {
  const categoryMeta = SHOP_CATEGORIES[item.category];

  return (
    <article className="shop-card shop-card--soon">
      <div className="shop-card__visual" aria-hidden="true">
        <span className="shop-card__icon">{categoryMeta.icon}</span>
      </div>
      <h4 className="shop-card__title">{item.title}</h4>
      <p className="shop-card__price shop-card__price--soon">Скоро</p>
      <div className="shop-card__actions">
        <p className="muted shop-card__soon">Товар появится в магазине</p>
      </div>
    </article>
  );
}

function ShopDonationCard() {
  const { user } = useAuth();
  const donationUrl = donationAlertsUrlForUsername(user?.username);

  return (
    <article className="shop-card shop-card--donation">
      <div className="shop-card__visual shop-card__visual--donation">
        <img
          src={SHOP_DONATION.logoSrc}
          alt="DonationAlerts"
          className="shop-card__logo"
          width={160}
          height={48}
        />
      </div>
      <h4 className="shop-card__title">{SHOP_DONATION.title}</h4>
      <p className="shop-card__price shop-card__price--donation">{SHOP_DONATION.priceLabel}</p>
      <div className="shop-card__actions">
        <a
          href={donationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--primary btn--full shop-card__buy shop-card__buy--donation"
        >
          Пожертвовать
        </a>
      </div>
    </article>
  );
}

function ShopProductCard({
  product,
  user,
  shopEnabled,
  onBuy,
  loadingId,
}: {
  product: ShopProduct;
  user: ReturnType<typeof useAuth>['user'];
  shopEnabled: boolean;
  onBuy: (productId: number) => void;
  loadingId: number | null;
}) {
  const loginNext = `/login?next=${encodeURIComponent('/shop')}`;
  const categoryMeta = SHOP_CATEGORIES[product.category];
  const title = product.vipMonths
    ? `${product.name} · ${vipPeriodLabel(product.vipMonths)}`
    : product.name;
  const buying = loadingId === product.id;

  return (
    <article className="shop-card">
      <div className="shop-card__visual" aria-hidden="true">
        {product.badgeSlug ? (
          <GroupBadge role="user" privilegeSlug={product.badgeSlug} size="lg" />
        ) : (
          <span className="shop-card__icon">{categoryMeta.icon}</span>
        )}
      </div>
      <h4 className="shop-card__title">{title}</h4>
      <p className="shop-card__price">{product.priceRub} ₽</p>
      <div className="shop-card__actions">
        {shopEnabled ? (
          user ? (
            <button
              type="button"
              className="btn btn--primary btn--full shop-card__buy"
              disabled={loadingId !== null}
              onClick={() => onBuy(product.id)}
            >
              {buying ? 'Оплата…' : 'Купить'}
            </button>
          ) : (
            <Link to={loginNext} className="btn btn--ghost btn--full shop-card__buy">
              Войти
            </Link>
          )
        ) : (
          <p className="muted shop-card__soon">Скоро</p>
        )}
      </div>
    </article>
  );
}

function ShopSidebar({
  active,
  counts,
  onSelect,
}: {
  active: ShopSidebarFilter;
  counts: Record<ShopSidebarFilter, number>;
  onSelect: (filter: ShopSidebarFilter) => void;
}) {
  return (
    <nav className="shop-sidebar" aria-label="Категории магазина">
      {SHOP_SIDEBAR.map((item) => {
        const count = counts[item.id];
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`shop-sidebar__item${isActive ? ' shop-sidebar__item--active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="shop-sidebar__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="shop-sidebar__text">
              <span className="shop-sidebar__title">{item.title}</span>
              <span className="shop-sidebar__count">{productCountLabel(count)}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function ShopPage() {
  const { user, refreshUser } = useAuth();
  const { showError } = useLayoutError();
  const { showToast } = useLayoutToast();
  const [searchParams] = useSearchParams();
  const [info, setInfo] = useState<ShopInfo | null>(() => readInitialShopInfo());
  const [loading, setLoading] = useState(() => readInitialShopInfo() === null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<ShopSidebarFilter>('all');

  const paymentSuccess = searchParams.get('payment') === 'success';

  const products = useMemo(() => {
    return (info?.products ?? []).map((product) => ({
      ...product,
      category: product.category ?? (product.vipMonths ? 'vip' : 'items'),
    }));
  }, [info]);

  const showDonation = SHOP_DONATION_FILTERS.includes(activeFilter);

  const activeCategories = useMemo(() => {
    const nav = SHOP_SIDEBAR.find((item) => item.id === activeFilter);
    return nav?.matchCategories ?? [];
  }, [activeFilter]);

  const visiblePlaceholders = useMemo(
    () => visibleShopPlaceholders(products, activeCategories),
    [products, activeCategories],
  );

  const counts = useMemo(() => {
    const result = {} as Record<ShopSidebarFilter, number>;
    for (const item of SHOP_SIDEBAR) {
      const productCount = products.filter((p) => item.matchCategories.includes(p.category)).length;
      const placeholderCount = visibleShopPlaceholders(products, item.matchCategories).length;
      const donationBonus = SHOP_DONATION_FILTERS.includes(item.id) ? 1 : 0;
      result[item.id] = productCount + placeholderCount + donationBonus;
    }
    return result;
  }, [products]);

  const visibleProducts = useMemo(() => {
    const nav = SHOP_SIDEBAR.find((item) => item.id === activeFilter);
    if (!nav) return products;
    return products.filter((p) => nav.matchCategories.includes(p.category));
  }, [products, activeFilter]);

  const activeNav = SHOP_SIDEBAR.find((item) => item.id === activeFilter);
  const activeTitle = activeFilter === 'all' ? 'Магазин' : (activeNav?.title ?? 'Магазин');

  useEffect(() => {
    if (paymentSuccess) {
      void refreshUser();
      showToast(
        'Оплата принята — VIP в профиле через минуту. Там же можно выбрать цвет ника',
      );
    }
  }, [paymentSuccess, refreshUser, showToast]);

  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  useEffect(() => {
    if (readInitialShopInfo()) return;

    let cancelled = false;

    void api<ShopInfo>('/store')
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setInfo(null);
          showErrorRef.current(formatApiError(err, 'Не удалось загрузить магазин'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBuy = async (productId: number) => {
    setLoadingId(productId);
    try {
      const data = await api<EasyDonateCheckoutResult>('/store/checkout', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      window.location.href = data.paymentUrl;
    } catch (err) {
      showError(formatApiError(err, 'Не удалось перейти к оплате'));
      setLoadingId(null);
    }
  };

  const showVipPerks = activeFilter === 'vip' || (activeFilter === 'all' && visibleProducts.some((p) => p.category === 'vip'));

  return (
    <PageShell title="Магазин" subtitle="Подписки и товары — оплата на сайте" wide>
      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : !info ? (
        <div className="card empty-state">
          <p>Не удалось загрузить магазин</p>
        </div>
      ) : (
        <>
          <div className="pixel-panel pixel-panel--intro shop-intro">
            <p>{info.description}</p>
            <p className="muted">
              Ник при оплате должен совпадать с аккаунтом на сайте
              {user ? (
                <>
                  : <strong>{user.username}</strong>
                </>
              ) : (
                <> — <Link to="/login?next=%2Fshop">войдите</Link>, чтобы купить</>
              )}
              .
            </p>
          </div>

          <ShopPurchaseTicker />

          <div className="shop-layout">
            <ShopSidebar active={activeFilter} counts={counts} onSelect={setActiveFilter} />

            <div className="shop-main">
              <header className="shop-main__head">
                <h2 className="shop-main__title">{activeTitle}</h2>
                {activeFilter !== 'all' && activeNav ? (
                  <p className="muted shop-main__subtitle">
                    {activeFilter === 'other'
                      ? 'Предметы и услуги сервера'
                      : SHOP_CATEGORIES[activeFilter as ShopCategoryId]?.subtitle}
                  </p>
                ) : null}
              </header>

              {showVipPerks ? (
                <PrivilegePerksCard title="Что входит в VIP" items={PRIVILEGE_BENEFITS.vip} />
              ) : null}

              {visibleProducts.length > 0 || showDonation || visiblePlaceholders.length > 0 ? (
                <div className="shop-grid">
                  {showDonation ? <ShopDonationCard /> : null}
                  {visiblePlaceholders.map((item) => (
                    <ShopPlaceholderCard key={item.id} item={item} />
                  ))}
                  {visibleProducts.map((product) => (
                    <ShopProductCard
                      key={product.id}
                      product={product}
                      user={user}
                      shopEnabled={info.easydonateEnabled}
                      onBuy={(id) => void handleBuy(id)}
                      loadingId={loadingId}
                    />
                  ))}
                </div>
              ) : (
                <div className="card shop-category__empty">
                  <p className="muted">Товары скоро появятся</p>
                </div>
              )}
            </div>
          </div>

          <div className="card support-cta shop-media-cta">
            <h3>Контент-мейкер?</h3>
            <p className="muted">YouTube, Twitch и TikTok — привилегии по заявке, без оплаты.</p>
            <Link to="/media" className="btn btn--ghost">
              Заявка для медиа →
            </Link>
          </div>
        </>
      )}
    </PageShell>
  );
}
