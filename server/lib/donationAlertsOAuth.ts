import { db } from '../db.js';

const SETTINGS_ID = 1;

export interface DonationAlertsSettings {
  clientId: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  updatedAt: string | null;
}

function readSettingsRow(): DonationAlertsSettings {
  const row = db
    .prepare(`
      SELECT client_id, access_token, refresh_token, expires_at, updated_at
      FROM donation_alerts_settings
      WHERE id = ?
    `)
    .get(SETTINGS_ID) as
    | {
        client_id: string | null;
        access_token: string | null;
        refresh_token: string | null;
        expires_at: string | null;
        updated_at: string | null;
      }
    | undefined;

  return {
    clientId: row?.client_id ?? null,
    accessToken: row?.access_token ?? null,
    refreshToken: row?.refresh_token ?? null,
    expiresAt: row?.expires_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

export function getDonationAlertsSettings(): DonationAlertsSettings {
  const settings = readSettingsRow();
  const envClientId = process.env.DONATION_ALERTS_CLIENT_ID?.trim();
  if (!settings.clientId && envClientId) {
    return { ...settings, clientId: envClientId };
  }
  return settings;
}

export function saveDonationAlertsClientId(clientId: string): void {
  const trimmed = clientId.trim();
  if (!trimmed) return;

  db.prepare(`
    INSERT INTO donation_alerts_settings (id, client_id, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      client_id = excluded.client_id,
      updated_at = datetime('now')
  `).run(SETTINGS_ID, trimmed);
}

export function saveDonationAlertsTokens(params: {
  accessToken: string;
  refreshToken: string;
  expiresInSec: number;
}): void {
  const expiresAt = new Date(Date.now() + params.expiresInSec * 1000).toISOString();

  db.prepare(`
    INSERT INTO donation_alerts_settings (id, access_token, refresh_token, expires_at, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      updated_at = datetime('now')
  `).run(SETTINGS_ID, params.accessToken, params.refreshToken, expiresAt);
}

export function isDonationAlertsConfigured(): boolean {
  const envToken = process.env.DONATION_ALERTS_ACCESS_TOKEN?.trim();
  if (envToken) return true;

  const settings = readSettingsRow();
  return Boolean(settings.accessToken);
}

function getOAuthConfig(): { clientId: string; clientSecret: string; redirectUri: string } | null {
  const settings = readSettingsRow();
  const clientId =
    settings.clientId?.trim() ||
    process.env.DONATION_ALERTS_CLIENT_ID?.trim() ||
    '';
  const clientSecret =
    process.env.DONATION_ALERTS_CLIENT_SECRET?.trim() ||
    process.env.DONATION_ALERTS_ACCESS_TOKEN?.trim() ||
    '';
  const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');

  if (!clientId || !clientSecret || !siteUrl) return null;

  const redirectUri =
    process.env.DONATION_ALERTS_REDIRECT_URI?.trim() || `${siteUrl}/`;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function buildDonationAlertsAuthorizeUrl(): string | null {
  const config = getOAuthConfig();
  if (!config) return null;

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'oauth-donation-index oauth-user-show',
    redirect_uri: config.redirectUri,
  });

  return `https://www.donationalerts.com/oauth/authorize?${params.toString()}`;
}

async function requestDonationAlertsTokens(body: URLSearchParams): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const config = getOAuthConfig();
  if (!config) {
    throw new Error('DonationAlerts OAuth не настроен (client_id / client_secret / SITE_URL)');
  }

  body.set('client_id', config.clientId);
  body.set('client_secret', config.clientSecret);

  const response = await fetch('https://www.donationalerts.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
    message?: string;
  };

  if (!response.ok || !payload.access_token || !payload.refresh_token) {
    throw new Error(
      payload.error_description ??
        payload.message ??
        payload.error ??
        `DonationAlerts OAuth HTTP ${response.status}`,
    );
  }

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_in: Number(payload.expires_in) || 3600,
  };
}

export async function exchangeDonationAlertsCode(code: string): Promise<void> {
  const config = getOAuthConfig();
  if (!config) {
    throw new Error('DonationAlerts OAuth не настроен');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code.trim(),
    redirect_uri: config.redirectUri,
  });

  const tokens = await requestDonationAlertsTokens(body);
  saveDonationAlertsTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresInSec: tokens.expires_in,
  });
}

async function refreshDonationAlertsAccessToken(): Promise<string | null> {
  const settings = readSettingsRow();
  if (!settings.refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: settings.refreshToken,
  });

  const tokens = await requestDonationAlertsTokens(body);
  saveDonationAlertsTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresInSec: tokens.expires_in,
  });

  return tokens.access_token;
}

export async function getDonationAlertsAccessToken(): Promise<string | null> {
  const envToken = process.env.DONATION_ALERTS_ACCESS_TOKEN?.trim();
  if (envToken) {
    const valid = await syncDonationAlertsAccessTokenFromEnv();
    if (valid) return envToken;
  }

  const settings = readSettingsRow();
  if (!settings.accessToken) return null;

  if (settings.expiresAt) {
    const expiresMs = Date.parse(settings.expiresAt);
    if (Number.isFinite(expiresMs) && expiresMs > Date.now() + 60_000) {
      return settings.accessToken;
    }
  }

  try {
    return await refreshDonationAlertsAccessToken();
  } catch (err) {
    console.error(
      'DonationAlerts token refresh:',
      err instanceof Error ? err.message : err,
    );
    return settings.accessToken;
  }
}

export async function syncDonationAlertsAccessTokenFromEnv(): Promise<boolean> {
  const envToken = process.env.DONATION_ALERTS_ACCESS_TOKEN?.trim();
  if (!envToken) return false;

  const response = await fetch('https://www.donationalerts.com/api/v1/alerts/donations', {
    headers: {
      Authorization: `Bearer ${envToken}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  });

  return response.ok;
}
