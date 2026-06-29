/** Реквизиты по умолчанию (переопределяются через LEGAL_* в .env) */
import { SUPPORT_EMAIL } from './supportConfig.js';

export const DEFAULT_LEGAL_REQUISITES = {
  sellerName: 'Зайцев Роман Иванович',
  sellerStatus: 'Самозанятый',
  inn: '180302091456',
  email: SUPPORT_EMAIL,
} as const;
