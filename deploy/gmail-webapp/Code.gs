/**
 * Вставьте этот код на https://script.google.com
 * (вход: enterraverif@gmail.com)
 *
 * Развернуть → Новое развертывание → Веб-приложение
 * - Запуск от имени: я
 * - Доступ: все
 *
 * Скопируйте URL в GMAIL_WEBAPP_URL на сервере.
 */
const WEBAPP_SECRET = 'enterra-mail-secret-2026';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.secret !== WEBAPP_SECRET) {
      return json({ ok: false, error: 'forbidden' });
    }
    if (!data.to || !data.subject) {
      return json({ ok: false, error: 'missing fields' });
    }
    GmailApp.sendEmail(data.to, data.subject, data.text || '', {
      htmlBody: data.html || data.text || '',
      name: 'Enterra',
    });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
