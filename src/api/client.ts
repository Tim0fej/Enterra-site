import { buildGuestAccessHeader, GUEST_TICKET_ACCESS_HEADER } from '../utils/guestTickets';

const TOKEN_KEY = 'enterra_token';

type SessionListener = () => void;
const sessionListeners = new Set<SessionListener>();

export function onSessionRevoked(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

function notifySessionRevoked() {
  for (const listener of sessionListeners) {
    listener();
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_FETCH_TIMEOUT_MS = 20_000;

function waitForRateLimit(res: Response): Promise<void> {
  const resetHeader = res.headers.get('RateLimit-Reset');
  if (resetHeader) {
    const resetMs = Number.parseInt(resetHeader, 10) * 1000 - Date.now();
    if (Number.isFinite(resetMs) && resetMs > 0) {
      return new Promise((resolve) => setTimeout(resolve, Math.min(resetMs + 250, 8000)));
    }
  }
  const retryAfter = res.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds) && seconds > 0) {
      return new Promise((resolve) => setTimeout(resolve, Math.min(seconds * 1000, 8000)));
    }
  }
  return new Promise((resolve) => setTimeout(resolve, 2000));
}

async function fetchApi(path: string, options: RequestInit, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`/api${path}`, {
      credentials: 'include',
      ...options,
      signal: options.signal ?? controller.signal,
    });
    if (res.status === 429 && attempt < 1) {
      await waitForRateLimit(res);
      return fetchApi(path, options, attempt + 1);
    }
    return res;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Сервер не отвечает. Обновите страницу.', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  if (!token) {
    const guestAccess = buildGuestAccessHeader();
    if (guestAccess) {
      headers[GUEST_TICKET_ACCESS_HEADER] = guestAccess;
    }
  }

  const res = await fetchApi(path, { ...options, headers });

  if (res.status === 204) {
    if (!res.ok) {
      throw new ApiError('Ошибка запроса', res.status);
    }
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (res.ok) {
        return undefined as T;
      }
    }
  }

  if (!res.ok) {
    const payload = data as { error?: string; code?: string };
    if (res.status === 401 && payload.code === 'SESSION_REVOKED') {
      clearToken();
      notifySessionRevoked();
    }
    const fallback =
      res.status === 429
        ? 'Слишком много запросов. Подождите немного.'
        : res.status === 404
        ? 'Эндпоинт не найден — перезапустите сайт (npm start / start-website.bat)'
        : 'Ошибка запроса';
    throw new ApiError(payload.error ?? fallback, res.status);
  }

  return data as T;
}

export async function uploadAttachments(files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const data = await api<{ attachments: import('../../shared/attachments').Attachment[] }>(
    '/uploads',
    { method: 'POST', body: formData },
  );

  return data.attachments;
}
