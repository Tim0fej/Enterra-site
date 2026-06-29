import crypto from 'crypto';

const API_BASE = 'https://api.yookassa.ru/v3';

export type YooPaymentStatus = 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';

export interface YooPayment {
  id: string;
  status: YooPaymentStatus;
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string; return_url?: string };
  metadata?: Record<string, string>;
  description?: string;
}

export function isYookassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID?.trim() && process.env.YOOKASSA_SECRET_KEY?.trim());
}

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID!.trim();
  const secret = process.env.YOOKASSA_SECRET_KEY!.trim();
  return `Basic ${Buffer.from(`${shopId}:${secret}`).toString('base64')}`;
}

function idempotenceKey(): string {
  return crypto.randomUUID();
}

async function yookassaRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    'Content-Type': 'application/json',
  };
  if (body !== undefined) {
    headers['Idempotence-Key'] = idempotenceKey();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T & { description?: string; type?: string };

  if (!res.ok) {
    const message =
      typeof data === 'object' && data && 'description' in data && data.description
        ? data.description
        : `YooKassa HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export function formatRubAmount(rub: number): string {
  return `${rub.toFixed(2)}`;
}

export async function createYooPayment(params: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<YooPayment> {
  return yookassaRequest<YooPayment>('POST', '/payments', {
    amount: {
      value: formatRubAmount(params.amountRub),
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: params.returnUrl,
    },
    description: params.description,
    metadata: params.metadata,
  });
}

export async function getYooPayment(paymentId: string): Promise<YooPayment> {
  return yookassaRequest<YooPayment>('GET', `/payments/${paymentId}`);
}

export interface YooWebhookNotification {
  type: 'notification';
  event: string;
  object: YooPayment;
}

export function parseYooWebhook(body: unknown): YooWebhookNotification | null {
  if (!body || typeof body !== 'object') return null;
  const payload = body as Partial<YooWebhookNotification>;
  if (payload.type !== 'notification' || !payload.event || !payload.object?.id) {
    return null;
  }
  return payload as YooWebhookNotification;
}
