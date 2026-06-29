const WIDGET_ALERT_TYPES = '1,4,13,15,11,16,14,2,3,5,12';

export interface WidgetDonationItem {
  externalId: string;
  username: string;
  message?: string;
  amountRub: number | null;
  createdAt?: string;
}

function resolveDonationUsername(donorName: string, message?: string | null): string {
  const fromMessage = message?.match(/enterra\s*:\s*([A-Za-z0-9_]{3,16})/i)?.[1];
  if (fromMessage) return fromMessage;
  return donorName.trim();
}

function parseWidgetResponse(body: string): Array<{
  id?: number | string;
  username?: string;
  name?: string;
  amount?: number | string;
  currency?: string;
  message?: string;
  created_at?: string;
}> {
  const trimmed = body.trim();
  if (trimmed.startsWith('{') && trimmed.includes('"token"')) {
    throw new Error('Неверный секретный токен DonationAlerts');
  }

  if (trimmed.includes('<!DOCTYPE html') || trimmed.includes("token = ''")) {
    throw new Error('Секретный токен DonationAlerts не принят — проверьте токен в настройках');
  }

  const jsonText = trimmed.startsWith('(') ? trimmed.slice(1, -1) : trimmed;
  const payload = JSON.parse(jsonText) as {
    status?: string;
    message?: string;
    alerts?: Array<{
      id?: number | string;
      username?: string;
      name?: string;
      amount?: number | string;
      message?: string;
      created_at?: string;
    }>;
  };

  if (payload.status === 'error') {
    throw new Error(payload.message ?? 'DonationAlerts widget API error');
  }

  return payload.alerts ?? [];
}

export async function fetchDonationAlertsWidgetDonations(): Promise<WidgetDonationItem[]> {
  const token = process.env.DONATION_ALERTS_WIDGET_TOKEN?.trim();
  if (!token) return [];

  const url = new URL('https://www.donationalerts.com/api/getwidgetdata');
  url.searchParams.set('token', token);
  url.searchParams.set('alert_type', WIDGET_ALERT_TYPES);

  const response = await fetch(url, {
    headers: { Accept: 'application/json, text/plain, */*' },
    signal: AbortSignal.timeout(15_000),
  });

  const body = await response.text();
  if (!response.ok && !body.trim().startsWith('(')) {
    throw new Error(`DonationAlerts widget HTTP ${response.status}`);
  }

  const items: WidgetDonationItem[] = [];
  for (const alert of parseWidgetResponse(body)) {
    const donorName = (alert.username ?? alert.name ?? '').trim();
    const username = resolveDonationUsername(donorName, alert.message);
    if (!username) continue;

    const amount =
      typeof alert.amount === 'number'
        ? alert.amount
        : Number.parseFloat(String(alert.amount ?? ''));

    items.push({
      externalId: String(alert.id ?? `${username}-${alert.created_at ?? items.length}`),
      username,
      message: alert.message,
      amountRub: Number.isFinite(amount) && amount > 0 ? amount : null,
      createdAt: alert.created_at,
    });
  }

  return items;
}
