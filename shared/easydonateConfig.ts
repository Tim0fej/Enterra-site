import type { VipPlanMonths } from './vipPlans.js';

/** Публичный URL магазина Enterra на EasyDonate */
export const EASYDONATE_SHOP_URL_DEFAULT = 'https://enterra.easydonate.ru';

/** ID товаров VIP в EasyDonate (1 / 3 / 6 месяцев) */
export const EASYDONATE_VIP_PRODUCT_IDS = {
  1: 1098490,
  3: 1098491,
  6: 1098492,
} as const;

/** ID услуг в EasyDonate */
export const EASYDONATE_SERVICE_PRODUCT_IDS = {
  unban: 1098559,
  clear_warns: 1098560,
} as const;

export type ShopProductKind = 'vip' | 'unban' | 'clear_warns';

export function parseEasyDonateVipProductId(
  months: VipPlanMonths,
  env: Record<string, string | undefined>,
): number | null {
  const raw = env[`EASYDONATE_VIP_PRODUCT_${months}`]?.trim();
  if (raw) {
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) return id;
  }
  const fallback = EASYDONATE_VIP_PRODUCT_IDS[months];
  return fallback > 0 ? fallback : null;
}

export function parseEasyDonateServiceProductId(
  kind: Exclude<ShopProductKind, 'vip'>,
  env: Record<string, string | undefined>,
): number | null {
  const raw = env[`EASYDONATE_SERVICE_${kind.toUpperCase()}`]?.trim();
  if (raw) {
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) return id;
  }
  const fallback = EASYDONATE_SERVICE_PRODUCT_IDS[kind];
  return fallback > 0 ? fallback : null;
}

export function monthsForEasyDonateProduct(
  productId: number,
  env: Record<string, string | undefined>,
): VipPlanMonths | null {
  for (const months of [1, 3, 6] as const) {
    if (parseEasyDonateVipProductId(months, env) === productId) {
      return months;
    }
  }
  return null;
}

function explicitProductKind(
  productId: number,
  env: Record<string, string | undefined>,
): ShopProductKind | null {
  const raw = env[`EASYDONATE_PRODUCT_${productId}_KIND`]?.trim().toLowerCase();
  if (raw === 'vip' || raw === 'unban' || raw === 'clear_warns') {
    return raw;
  }
  return null;
}

function productKindFromKnownIds(
  productId: number,
  env: Record<string, string | undefined>,
): ShopProductKind | null {
  if (monthsForEasyDonateProduct(productId, env)) return 'vip';
  if (productId === parseEasyDonateServiceProductId('unban', env)) return 'unban';
  if (productId === parseEasyDonateServiceProductId('clear_warns', env)) return 'clear_warns';
  return null;
}

export function resolveShopProductKind(
  productId: number,
  productName: string,
  env: Record<string, string | undefined>,
): ShopProductKind | null {
  const explicit = explicitProductKind(productId, env);
  if (explicit) return explicit;

  const fromIds = productKindFromKnownIds(productId, env);
  if (fromIds) return fromIds;

  const haystack = productName.toLowerCase();
  if (haystack.includes('разбан') || haystack.includes('unban')) return 'unban';
  if (
    haystack.includes('предупреж') ||
    haystack.includes('warn') ||
    haystack.includes('снять все')
  ) {
    return 'clear_warns';
  }

  return null;
}

export function shopProductKindLabel(kind: ShopProductKind): string {
  switch (kind) {
    case 'vip':
      return 'VIP';
    case 'unban':
      return 'Разбан';
    case 'clear_warns':
      return 'Снять все предупреждения';
    default:
      return 'товар в магазине';
  }
}

export function resolveShopProductKindFromProducts(
  products: Array<{ product_id?: number; id?: number; name?: string }> | undefined,
  env: Record<string, string | undefined>,
): ShopProductKind | null {
  const first = products?.[0];
  if (!first) return null;
  const productId = Number(first.product_id ?? first.id);
  const name = first.name?.trim() ?? '';
  if (!Number.isFinite(productId) || productId <= 0) {
    return resolveShopProductKind(0, name, env);
  }
  return resolveShopProductKind(productId, name, env);
}
