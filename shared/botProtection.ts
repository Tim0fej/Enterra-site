/** Скрытое поле-ловушка для ботов (должно оставаться пустым). */
export const HONEYPOT_FIELD = 'website';

/** Метка времени открытия формы (мс). */
export const FORM_LOADED_AT_FIELD = 'formLoadedAt';

/** Токен Cloudflare Turnstile. */
export const TURNSTILE_FIELD = 'turnstileToken';

/** Минимум мс от открытия формы до отправки. */
export const FORM_MIN_SUBMIT_MS = 1500;

/** Максимальный возраст формы (2 ч). */
export const FORM_MAX_AGE_MS = 2 * 60 * 60 * 1000;
