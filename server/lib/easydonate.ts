import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  EASYDONATE_SHOP_URL_DEFAULT,
  monthsForEasyDonateProduct,
  parseEasyDonateVipProductId,
} from '../../shared/easydonateConfig.js';
import { isVipPlanMonths, type VipPlanMonths } from '../../shared/vipPlans.js';
import { DATA_DIR } from '../paths.js';

const API_BASE = 'https://easydonate.ru/api/v3';
const FETCH_TIMEOUT_MS = 6_000;
const RETRY_DELAYS_MS = [400, 1200];
const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;

let productCache: { expiresAt: number; products: EasyDonateProduct[] } | null = null;

const PRODUCT_CACHE_FILE = path.join(DATA_DIR, 'easydonate-products.json');

function loadPersistedProductCache(): void {
  try {
    if (!fs.existsSync(PRODUCT_CACHE_FILE)) return;
    const parsed = JSON.parse(fs.readFileSync(PRODUCT_CACHE_FILE, 'utf8')) as {
      expiresAt?: number;
      products?: EasyDonateProduct[];
    };
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) return;
    productCache = {
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : 0,
      products: parsed.products,
    };
  } catch (err) {
    console.warn(
      'EasyDonate cache load failed:',
      err instanceof Error ? err.message : err,
    );
  }
}

function persistProductCache(): void {
  if (!productCache?.products.length) return;
  try {
    fs.writeFileSync(PRODUCT_CACHE_FILE, JSON.stringify(productCache));
  } catch (err) {
    console.warn(
      'EasyDonate cache save failed:',
      err instanceof Error ? err.message : err,
    );
  }
}

loadPersistedProductCache();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface EasyDonateProduct {
  id: number;
  name: string;
  price: number;
  description: string | null;
}

export interface EasyDonateCallbackPayload {
  payment_id: number | string;
  shop_id?: number;
  customer: string;
  email?: string | null;
  cost: number | string;
  income?: number | string;
  products?: Array<{ product_id?: number; id?: number; name?: string }>;
  signature: string;
}

interface EasyDonateApiResponse<T> {
  success: boolean;
  response: T;
  error_code?: number;
}

function shopKey(): string {
  return process.env.EASYDONATE_SHOP_KEY?.trim() ?? '';
}

export function isEasyDonateConfigured(): boolean {
  if (process.env.EASYDONATE_ENABLED !== 'true') return false;
  if (!shopKey()) return false;
  if (!process.env.EASYDONATE_SERVER_ID?.trim()) return false;
  return vipProductId(1) !== null;
}

export function getEasyDonateShopUrl(): string {
  return (
    process.env.EASYDONATE_SHOP_URL?.trim() ||
    process.env.SUPPORT_EASYDONATE_URL?.trim() ||
    EASYDONATE_SHOP_URL_DEFAULT
  );
}

function vipProductId(months: VipPlanMonths): number | null {
  return parseEasyDonateVipProductId(months, process.env);
}

function serverId(): number {
  return Number(process.env.EASYDONATE_SERVER_ID);
}

async function easyDonateGet<T>(path: string, query?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Shop-Key': shopKey() },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      const text = await response.text();
      const trimmed = text.trim();

      if (!trimmed.startsWith('{')) {
        throw new Error(`EasyDonate API unavailable (${response.status})`);
      }

      const data = JSON.parse(trimmed) as EasyDonateApiResponse<T>;
      if (!response.ok || !data.success) {
        const message =
          typeof data.response === 'string'
            ? data.response
            : `EasyDonate API error (${response.status})`;
        throw new Error(message);
      }

      return data.response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  }

  throw lastError ?? new Error('EasyDonate API unavailable');
}

export function verifyEasyDonateSignature(payload: EasyDonateCallbackPayload): boolean {
  const key = shopKey();
  if (!key || !payload.signature) return false;

  const paymentId = String(payload.payment_id);
  const cost = String(payload.cost);
  const customer = String(payload.customer);
  const hashString = `${paymentId}@${cost}@${customer}`;
  const expected = crypto.createHmac('sha256', key).update(hashString).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(payload.signature, 'utf8'));
  } catch {
    return false;
  }
}

export function resolveVipMonthsFromProducts(
  products: EasyDonateCallbackPayload['products'],
): VipPlanMonths | null {
  if (!products?.length) return null;

  for (const item of products) {
    const productId = Number(item.product_id ?? item.id);
    if (!Number.isFinite(productId)) continue;
    const months = monthsForEasyDonateProduct(productId, process.env);
    if (months) return months;
  }

  return null;
}

export async function createEasyDonateProductPayment(params: {
  customer: string;
  email: string;
  productId: number;
  successUrl: string;
}): Promise<{ paymentUrl: string; paymentId: number }> {
  if (!isEasyDonateConfigured()) {
    throw new Error('EasyDonate не настроен на сервере');
  }

  if (!Number.isFinite(params.productId) || params.productId <= 0) {
    throw new Error('Некорректный товар');
  }

  const products = JSON.stringify({ [String(params.productId)]: 1 });

  const response = await easyDonateGet<{ url: string; payment: { id: number } }>(
    '/shop/payment/create',
    {
      customer: params.customer,
      email: params.email,
      server_id: String(serverId()),
      products,
      success_url: params.successUrl,
    },
  );

  if (!response.url || !response.payment?.id) {
    throw new Error('EasyDonate не вернул ссылку на оплату');
  }

  return { paymentUrl: response.url, paymentId: response.payment.id };
}

export async function createEasyDonatePayment(params: {
  customer: string;
  email: string;
  months: VipPlanMonths;
  successUrl: string;
}): Promise<{ paymentUrl: string; paymentId: number }> {
  if (!isVipPlanMonths(params.months)) {
    throw new Error('Выберите срок VIP: 1, 3 или 6 месяцев');
  }

  const productId = vipProductId(params.months);
  if (!productId) {
    throw new Error(`Товар VIP на ${params.months} мес. не настроен в EasyDonate`);
  }

  return createEasyDonateProductPayment({
    customer: params.customer,
    email: params.email,
    productId,
    successUrl: params.successUrl,
  });
}

export function getCachedEasyDonateProducts(): EasyDonateProduct[] {
  return productCache?.products ?? [];
}

export function warmupEasyDonateProducts(): void {
  if (!isEasyDonateConfigured()) return;
  void listEasyDonateProducts().catch((err) => {
    console.warn(
      'EasyDonate warmup failed:',
      err instanceof Error ? err.message : err,
    );
  });
}

export async function listEasyDonateProducts(): Promise<EasyDonateProduct[]> {
  if (productCache && productCache.expiresAt > Date.now()) {
    return productCache.products;
  }

  try {
    const rows = await easyDonateGet<EasyDonateProduct[]>('/shop/products', {
      server_id: String(serverId()),
    });
    const products = Array.isArray(rows) ? rows : [];
    productCache = { expiresAt: Date.now() + PRODUCT_CACHE_TTL_MS, products };
    persistProductCache();
    return products;
  } catch (err) {
    if (productCache) {
      console.warn(
        'EasyDonate products fetch failed, using cached list:',
        err instanceof Error ? err.message : err,
      );
      return productCache.products;
    }
    throw err;
  }
}
