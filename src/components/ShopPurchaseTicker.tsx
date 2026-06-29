import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { api } from '../api/client';
import { parseSiteDate } from '../utils/formatDate';
import type { ShopRecentPurchase } from '../types/players';

function formatRelativeTime(iso: string): string {
  const date = parseSiteDate(iso);
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} д назад`;
}

function PurchaseChip({ purchase }: { purchase: ShopRecentPurchase }) {
  const price =
    purchase.amountRub != null && purchase.amountRub > 0
      ? `${Math.round(purchase.amountRub)} ₽`
      : null;
  const time = formatRelativeTime(purchase.createdAt);

  return (
    <div className="shop-ticker__item">
      <span className="shop-ticker__user">{purchase.username}</span>
      <span className="shop-ticker__action">купил</span>
      <span className="shop-ticker__label">{purchase.label}</span>
      {price ? <span className="shop-ticker__price">{price}</span> : null}
      {time ? <span className="shop-ticker__time">· {time}</span> : null}
    </div>
  );
}

function buildLoopItems(purchases: ShopRecentPurchase[], minItems = 10) {
  if (purchases.length === 0) return [];
  const repeated: ShopRecentPurchase[] = [];
  while (repeated.length < minItems) {
    repeated.push(...purchases);
  }
  return [...repeated, ...repeated];
}

function TickerLane({
  items,
  duration,
  lane,
}: {
  items: ShopRecentPurchase[];
  duration: string;
  lane: 'top';
}) {
  return (
    <div className={`shop-ticker__viewport shop-ticker__viewport--${lane}`}>
      <div
        className="shop-ticker__track"
        style={{ '--shop-ticker-duration': duration } as CSSProperties}
      >
        {items.map((purchase, index) => (
          <PurchaseChip key={`${lane}-${purchase.id}-${index}`} purchase={purchase} />
        ))}
      </div>
    </div>
  );
}

export function ShopPurchaseTicker() {
  const [purchases, setPurchases] = useState<ShopRecentPurchase[]>([]);

  useEffect(() => {
    const load = () => {
      void api<{ purchases: ShopRecentPurchase[] }>('/store/recent-purchases')
        .then((data) => setPurchases(Array.isArray(data.purchases) ? data.purchases : []))
        .catch(() => {});
    };
    load();
    const id = window.setInterval(load, 45_000);
    return () => window.clearInterval(id);
  }, []);

  const { duration, items } = useMemo(() => {
    if (purchases.length === 0) {
      return {
        duration: '60s',
        items: [] as ShopRecentPurchase[],
      };
    }
    const seconds = Math.max(48, purchases.length * 14);
    return {
      duration: `${seconds}s`,
      items: buildLoopItems(purchases),
    };
  }, [purchases]);

  if (purchases.length === 0) return null;

  return (
    <div className="shop-ticker" aria-live="polite">
      <div className="shop-ticker__label-side">
        <span className="shop-ticker__badge" aria-hidden="true">
          ◆
        </span>
        <span className="shop-ticker__heading">Покупки</span>
      </div>
      <div className="shop-ticker__lanes">
        <TickerLane items={items} duration={duration} lane="top" />
      </div>
    </div>
  );
}
