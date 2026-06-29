import { GUEST_TICKET_ACCESS_HEADER } from '../../shared/guestTicketConfig';

const STORAGE_KEY = 'enterra_guest_tickets';

export interface StoredGuestTicket {
  id: number;
  token: string;
}

function readStore(): StoredGuestTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredGuestTicket[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item &&
        Number.isInteger(item.id) &&
        item.id > 0 &&
        typeof item.token === 'string' &&
        item.token.length >= 32,
    );
  } catch {
    return [];
  }
}

function writeStore(items: StoredGuestTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getGuestTickets(): StoredGuestTicket[] {
  return readStore();
}

export function saveGuestTicket(id: number, token: string) {
  const items = readStore().filter((item) => item.id !== id);
  items.unshift({ id, token });
  writeStore(items.slice(0, 20));
}

export function getGuestTokenForTicket(id: number): string | null {
  return readStore().find((item) => item.id === id)?.token ?? null;
}

export function buildGuestAccessHeader(): string {
  return readStore()
    .map((item) => `${item.id}:${item.token}`)
    .join(',');
}

export { GUEST_TICKET_ACCESS_HEADER };
