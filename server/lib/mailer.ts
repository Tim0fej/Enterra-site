import nodemailer from 'nodemailer';

const SMTP_FROM = process.env.SMTP_FROM ?? 'enterraverif@gmail.com';
const SMTP_USER = process.env.SMTP_USER ?? SMTP_FROM;
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const GMAIL_WEBAPP_URL = process.env.GMAIL_WEBAPP_URL ?? '';
const GMAIL_WEBAPP_SECRET = process.env.GMAIL_WEBAPP_SECRET ?? '';
const BREVO_API_KEY = process.env.BREVO_API_KEY ?? '';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 12000,
    });
  }
  return transporter;
}

export function isMailConfigured(): boolean {
  return Boolean(
    (GMAIL_WEBAPP_URL && GMAIL_WEBAPP_SECRET) || BREVO_API_KEY || SMTP_PASS,
  );
}

function buildMessage(code: string) {
  const subject = `${code} — код подтверждения Enterra`;
  const text = [
    'Здравствуйте!',
    '',
    `Ваш код подтверждения: ${code}`,
    '',
    'Код действует 15 минут. Если вы не запрашивали его — проигнорируйте это письмо.',
    '',
    '— Enterra (enterra.tech)',
  ].join('\n');

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h2 style="color:#00a8cc">Enterra</h2>
      <p>Здравствуйте!</p>
      <p>Ваш код подтверждения:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:24px 0">${code}</p>
      <p style="color:#666;font-size:14px">Код действует 15 минут. Если вы не запрашивали его — проигнорируйте это письмо.</p>
      <p style="color:#999;font-size:12px;margin-top:32px">enterra.tech</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendViaGmailWebApp(to: string, subject: string, text: string, html: string): Promise<void> {
  const res = await fetch(GMAIL_WEBAPP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: GMAIL_WEBAPP_SECRET,
      to,
      subject,
      text,
      html,
    }),
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
  });

  const raw = await res.text();
  let data: { ok?: boolean; error?: string } = {};
  try {
    data = JSON.parse(raw) as { ok?: boolean; error?: string };
  } catch {
    throw new Error('Gmail WebApp вернул некорректный ответ — проверьте развёртывание Apps Script');
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Gmail WebApp HTTP ${res.status}`);
  }
}

async function sendViaBrevo(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Enterra', email: SMTP_FROM },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo API ${res.status}: ${body.slice(0, 200)}`);
  }
}

async function sendViaSmtp(to: string, subject: string, text: string, html: string): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP not configured');
  }
  await transport.sendMail({
    from: `"Enterra" <${SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  const { subject, text, html } = buildMessage(code);

  if (GMAIL_WEBAPP_URL && GMAIL_WEBAPP_SECRET) {
    await sendViaGmailWebApp(to, subject, text, html);
    return;
  }

  if (BREVO_API_KEY) {
    await sendViaBrevo(to, subject, html);
    return;
  }

  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[mail] dev fallback — code for ${to}: ${code}`);
      return;
    }
    throw new Error('Почта не настроена');
  }

  try {
    await sendViaSmtp(to, subject, text, html);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      throw new Error(
        'VDS блокирует SMTP. Настройте Gmail Web App (см. deploy/gmail-webapp) или BREVO_API_KEY',
      );
    }
    throw err;
  }
}
