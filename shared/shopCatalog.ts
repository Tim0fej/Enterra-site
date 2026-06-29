import { monthsForEasyDonateProduct } from './easydonateConfig.js';
import type { DisplayGroupId } from './displayGroup.js';
import { DONATION_ALERTS_URL } from './supportConfig.js';

export type ShopCategoryId = 'vip' | 'items' | 'bundles' | 'services';

export interface ShopCategoryMeta {
  id: ShopCategoryId;
  title: string;
  subtitle: string;
  intro: string;
  icon: string;
}

export type ShopSidebarFilter = 'all' | ShopCategoryId | 'other';

export interface ShopSidebarItem {
  id: ShopSidebarFilter;
  title: string;
  icon: string;
  /** Какие категории товаров входят в фильтр */
  matchCategories: ShopCategoryId[];
}

export const SHOP_SIDEBAR: ShopSidebarItem[] = [
  {
    id: 'all',
    title: 'Все товары',
    icon: '▦',
    matchCategories: ['vip', 'items', 'bundles', 'services'],
  },
  {
    id: 'vip',
    title: 'Подписка',
    icon: '★',
    matchCategories: ['vip'],
  },
  {
    id: 'bundles',
    title: 'Помочь серверу',
    icon: '♥',
    matchCategories: ['bundles'],
  },
  {
    id: 'other',
    title: 'Другие',
    icon: '◆',
    matchCategories: ['items', 'services'],
  },
];

export const SHOP_CATEGORY_ORDER: ShopCategoryId[] = [
  'vip',
  'items',
  'bundles',
  'services',
];

export const SHOP_CATEGORIES: Record<ShopCategoryId, ShopCategoryMeta> = {
  vip: {
    id: 'vip',
    title: 'Подписка',
    subtitle: 'VIP — поддержка сервера и игровые возможности',
    intro: 'VIP не даёт силы в PvP. Выдаётся на сервере и в профиле на сайте после оплаты.',
    icon: '★',
  },
  items: {
    id: 'items',
    title: 'Предметы',
    subtitle: 'Ключи, кейсы и игровые предметы',
    intro: 'Выдаются автоматически на сервере после оплаты.',
    icon: '🗝',
  },
  bundles: {
    id: 'bundles',
    title: 'Помочь серверу',
    subtitle: 'Пожертвования и поддержка проекта',
    intro: 'Средства идут на хостинг и развитие сервера.',
    icon: '♥',
  },
  services: {
    id: 'services',
    title: 'Услуги',
    subtitle: 'Разбан, смена ника и другое',
    intro: 'Обрабатываются администрацией — обычно в течение суток.',
    icon: '⚙',
  },
};

/** Пожертвование через DonationAlerts — всегда в «Помочь серверу» */
export const SHOP_DONATION = {
  title: 'Пожертвование',
  description: 'Любая сумма от 10 ₽ — средства идут на хостинг и развитие проекта',
  priceLabel: 'от 10 ₽',
  url: DONATION_ALERTS_URL,
  logoSrc: '/donationalerts-logo.svg',
} as const;

/** Фильтры, в которых показывается карточка DonationAlerts */
export const SHOP_DONATION_FILTERS: ShopSidebarFilter[] = ['all', 'bundles'];

export interface ShopPlaceholderItem {
  id: string;
  title: string;
  category: ShopCategoryId;
  /** Скрыть, если в EasyDonate уже есть товар с таким ключевым словом */
  matchKeywords: string[];
}

/** Карточки «скоро» — пока товары не добавлены в EasyDonate */
export const SHOP_PLACEHOLDERS: ShopPlaceholderItem[] = [
  {
    id: 'service-unban',
    title: 'Разбан',
    category: 'services',
    matchKeywords: ['разбан', 'unban'],
  },
  {
    id: 'service-clear-warns',
    title: 'Снять все предупреждения',
    category: 'services',
    matchKeywords: ['предупреж', 'warn', 'снять все'],
  },
];

const CATEGORY_KEYWORDS: Record<Exclude<ShopCategoryId, 'vip'>, string[]> = {
  items: [
    'ключ',
    'key',
    'кейс',
    'case',
    'предмет',
    'item',
    'монет',
    'coin',
    'токен',
    'сундук',
    'привилег',
    'privilege',
    'legend',
    'легенд',
    'premium',
    'премиум',
    'supporter',
    'саппорт',
    'статус',
    'ранг',
  ],
  bundles: ['набор', 'bundle', 'pack', 'комплект', 'пак', 'пожертв', 'донат', 'помочь', 'поддерж'],
  services: ['разбан', 'unban', 'услуг', 'service', 'ник', 'nickname', 'перенос', 'смена', 'предупреж', 'warn'],
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function placeholderCoveredByProduct(
  placeholder: ShopPlaceholderItem,
  name: string,
  description: string | null,
): boolean {
  const haystack = normalizeText(`${name} ${description ?? ''}`);
  return placeholder.matchKeywords.some((word) => haystack.includes(word));
}

export function visibleShopPlaceholders(
  products: { name: string; description: string | null; category: ShopCategoryId }[],
  categories: ShopCategoryId[],
): ShopPlaceholderItem[] {
  return SHOP_PLACEHOLDERS.filter((item) => {
    if (!categories.includes(item.category)) return false;
    return !products.some(
      (product) =>
        product.category === item.category &&
        placeholderCoveredByProduct(item, product.name, product.description),
    );
  });
}

function explicitCategoryFromEnv(
  productId: number,
  env: Record<string, string | undefined>,
): ShopCategoryId | null {
  const direct = env[`EASYDONATE_PRODUCT_${productId}_CATEGORY`]?.trim().toLowerCase();
  if (direct === 'privileges') return 'items';
  if (direct && direct in SHOP_CATEGORIES) {
    return direct as ShopCategoryId;
  }
  return null;
}

function categoryFromKeywords(name: string, description: string | null): ShopCategoryId | null {
  const haystack = normalizeText(`${name} ${description ?? ''}`);
  for (const categoryId of ['items', 'bundles', 'services'] as const) {
    if (CATEGORY_KEYWORDS[categoryId].some((word) => haystack.includes(word))) {
      return categoryId;
    }
  }
  return null;
}

export function resolveShopCategory(
  productId: number,
  name: string,
  description: string | null,
  env: Record<string, string | undefined>,
): ShopCategoryId {
  const explicit = explicitCategoryFromEnv(productId, env);
  if (explicit) return explicit;

  if (monthsForEasyDonateProduct(productId, env)) return 'vip';

  const fromKeywords = categoryFromKeywords(name, description);
  if (fromKeywords) return fromKeywords;

  return 'items';
}

export function resolveShopBadgeSlug(
  category: ShopCategoryId,
  name: string,
): DisplayGroupId | null {
  const haystack = normalizeText(name);
  if (category === 'vip' || haystack.includes('vip')) return 'vip';
  if (haystack.includes('legend') || haystack.includes('легенд')) return 'vip';
  if (haystack.includes('supporter') || haystack.includes('саппорт') || haystack.includes('moder')) {
    return 'moder';
  }
  return null;
}

export function parseProductFeatureLines(description: string | null): string[] {
  if (!description?.trim()) return [];
  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-–—*]+/, '').trim())
    .filter(Boolean);
}
