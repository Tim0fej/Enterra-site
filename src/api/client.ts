const TOKEN_KEY = 'enterra_token';

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

  const res = await fetch(`/api${path}`, { ...options, headers });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const fallback =
      res.status === 404
        ? 'Эндпоинт не найден — перезапустите сайт (npm start / start-website.bat)'
        : 'Ошибка запроса';
    throw new ApiError((data as { error?: string }).error ?? fallback, res.status);
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
