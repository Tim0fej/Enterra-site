import type { Request, Response } from 'express';
import {
  HTTP_ERROR_CONTENT,
  resolveHttpErrorContent,
  type HttpErrorCode,
} from '../../shared/httpErrors.js';

const TONE_COLORS = {
  accent: '#00c8ff',
  danger: '#f85149',
  warning: '#f0b429',
} as const;

export function wantsHtmlResponse(req: Request): boolean {
  if (req.path.startsWith('/api')) return false;

  const accept = req.headers.accept ?? '';
  if (accept.includes('application/json') && !accept.includes('text/html')) {
    return false;
  }

  return req.method === 'GET' || req.method === 'HEAD' || accept.includes('text/html');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderErrorPageHtml(
  status: number,
  content: {
    title: string;
    subtitle: string;
    text: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    reload?: boolean;
    tone?: 'accent' | 'danger' | 'warning';
  },
): string {
  const tone = content.tone ?? 'accent';
  const accent = TONE_COLORS[tone];
  const secondary =
    content.secondaryLabel && content.secondaryHref
      ? `<a class="ghost" href="${escapeHtml(content.secondaryHref)}">${escapeHtml(content.secondaryLabel)}</a>`
      : '';

  const primary = content.reload
    ? `<button type="button" class="primary" onclick="location.reload()">${escapeHtml(content.primaryLabel)}</button>`
    : `<a class="primary" href="${escapeHtml(content.primaryHref)}">${escapeHtml(content.primaryLabel)}</a>`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <meta name="theme-color" content="#05080f" />
  <title>${status} — ${escapeHtml(content.title)} · Enterra</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #05080f;
      color: #e8edf5;
      padding: 24px;
      line-height: 1.55;
    }
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(0, 200, 255, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 200, 255, 0.04) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 35%, black 15%, transparent 100%);
    }
    .shell {
      position: relative;
      width: min(460px, 100%);
      padding: 34px 26px 28px;
      border: 1px solid rgba(0, 200, 255, 0.18);
      border-radius: 18px;
      background: linear-gradient(160deg, rgba(12, 20, 36, 0.96) 0%, rgba(8, 14, 28, 0.98) 100%);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.35) inset,
        0 24px 48px rgba(0, 0, 0, 0.35),
        0 0 60px rgba(0, 102, 204, 0.08);
      text-align: center;
    }
    .brand {
      display: inline-flex;
      margin-bottom: 18px;
      opacity: 0.92;
    }
    .brand img { height: 28px; width: auto; display: block; }
    .code {
      font-family: "Courier New", monospace;
      font-size: clamp(2.4rem, 12vw, 3.4rem);
      font-weight: 700;
      color: ${accent};
      margin-bottom: 10px;
      letter-spacing: 0.04em;
    }
    h1 {
      font-size: 1.2rem;
      margin-bottom: 6px;
    }
    .subtitle {
      color: #9aa8bc;
      font-size: 0.92rem;
      margin-bottom: 14px;
    }
    .text {
      color: #9aa8bc;
      font-size: 0.95rem;
      margin-bottom: 22px;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }
    a, button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: opacity 0.15s ease;
    }
    a:hover, button:hover { opacity: 0.9; }
    .primary { background: #00c8ff; color: #05080f; }
    .ghost {
      background: transparent;
      color: #00c8ff;
      border: 1px solid rgba(0, 200, 255, 0.35);
    }
  </style>
</head>
<body>
  <main class="shell">
    <a class="brand" href="/" aria-label="Enterra — на главную">
      <img src="/logo.png" alt="Enterra" />
    </a>
    <div class="code" aria-hidden="true">${status}</div>
    <h1>${escapeHtml(content.title)}</h1>
    <p class="subtitle">${escapeHtml(content.subtitle)}</p>
    <p class="text">${escapeHtml(content.text)}</p>
    <div class="actions">
      ${primary}
      ${secondary}
    </div>
  </main>
</body>
</html>`;
}

export function sendHttpError(
  req: Request,
  res: Response,
  status: number,
  message?: string,
  options?: { code?: HttpErrorCode },
): void {
  if (res.headersSent) return;

  const content = options?.code
    ? { ...HTTP_ERROR_CONTENT[options.code], text: message?.trim() || HTTP_ERROR_CONTENT[options.code].text }
    : resolveHttpErrorContent(status, message);

  if (wantsHtmlResponse(req)) {
    res.status(status).type('html').send(renderErrorPageHtml(status, content));
    return;
  }

  res.status(status).json({ error: message?.trim() || content.text });
}
