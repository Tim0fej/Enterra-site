import {
  getCachedEasyDonateProducts,
  getEasyDonateShopUrl,
  isEasyDonateConfigured,
  listEasyDonateProducts,
  type EasyDonateProduct,
} from './easydonate.js';
import { monthsForEasyDonateProduct } from '../../shared/easydonateConfig.js';
import { resolveShopBadgeSlug, resolveShopCategory } from '../../shared/shopCatalog.js';

const SERVER_MONTHLY_COST = Number(process.env.SERVER_MONTHLY_COST) || 1500;

function mapShopProducts(products: EasyDonateProduct[]) {
  return products.map((product) => {
    const category = resolveShopCategory(
      product.id,
      product.name,
      product.description,
      process.env,
    );
    return {
      id: product.id,
      name: product.name,
      priceRub: product.price,
      description: product.description,
      vipMonths: monthsForEasyDonateProduct(product.id, process.env),
      category,
      badgeSlug: resolveShopBadgeSlug(category, product.name),
    };
  });
}

export function buildShopInfoPayload() {
  const shopUrl = getEasyDonateShopUrl();
  const enabled = isEasyDonateConfigured();

  if (enabled) {
    void listEasyDonateProducts().catch(() => {});
  }

  const products = getCachedEasyDonateProducts();

  return {
    title: 'Магазин Enterra',
    description:
      'VIP, привилегии, предметы, наборы и услуги. Оплата на сайте — ник при покупке должен совпадать с аккаунтом.',
    serverCost: {
      monthlyRub: SERVER_MONTHLY_COST,
      note: 'Средства идут на хостинг, резервные копии и развитие проекта.',
    },
    easydonateEnabled: enabled,
    easydonateShopUrl: shopUrl,
    products: mapShopProducts(products),
  };
}
