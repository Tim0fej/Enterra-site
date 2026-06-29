/** DonationAlerts — запасной канал (если EasyDonate выключен) */
export const DONATION_ALERTS_URL = 'https://www.donationalerts.com/r/enterraserver';

/** Публичная почта поддержки, рекламы, возвратов и обращений */
export const SUPPORT_EMAIL = 'enterrasupport@gmail.com';

/** Ссылка на DonationAlerts с подсказкой в сообщении для привязки к нику на сайте */
export function donationAlertsUrlForUsername(username?: string | null): string {
  if (!username?.trim()) return DONATION_ALERTS_URL;
  const message = `Enterra: ${username.trim()}`;
  return `${DONATION_ALERTS_URL}?message=${encodeURIComponent(message)}`;
}

/** Магазин Enterra на EasyDonate */
export const EASYDONATE_SHOP_URL = 'https://enterra.easydonate.ru';
