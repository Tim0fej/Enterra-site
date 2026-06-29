export const GUEST_TICKET_USER_EMAIL = 'guest@enterra.local';
export const GUEST_TICKET_USER_USERNAME = 'Guest';

/** Список id:token,id:token — доступ к гостевым тикетам без входа. */
export const GUEST_TICKET_ACCESS_HEADER = 'X-Guest-Ticket-Access';

export function validateGuestName(name: string): string | null {
  const value = name.trim();
  if (!value) return 'Введите имя или ник';
  if (value.length < 2) return 'Имя слишком короткое';
  if (value.length > 40) return 'Имя слишком длинное';
  return null;
}
