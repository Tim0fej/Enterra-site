import fs from 'fs';
import { db } from '../db.js';
import { TICKET_INACTIVITY_HOURS } from '../../shared/ticketConfig.js';
import { getAttachmentFilePath } from './attachments.js';

export { TICKET_INACTIVITY_HOURS };

function getAttachmentFilesForTicket(ticketId: number): string[] {
  const rows = db
    .prepare(`
      SELECT a.stored_name
      FROM attachments a
      JOIN ticket_messages m ON m.id = a.ticket_message_id
      WHERE m.ticket_id = ?
    `)
    .all(ticketId) as { stored_name: string }[];

  return rows.map((row) => row.stored_name);
}

export function deleteTicketById(ticketId: number): boolean {
  const exists = db.prepare('SELECT id FROM tickets WHERE id = ?').get(ticketId) as
    | { id: number }
    | undefined;

  if (!exists) {
    return false;
  }

  const files = getAttachmentFilesForTicket(ticketId);

  db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId);

  for (const storedName of files) {
    try {
      fs.unlinkSync(getAttachmentFilePath(storedName));
    } catch {
      // file may already be missing
    }
  }

  return true;
}

export function purgeInactiveTickets(): number {
  const rows = db
    .prepare(`
      SELECT t.id
      FROM tickets t
      WHERE datetime(
        COALESCE(
          (SELECT MAX(m.created_at) FROM ticket_messages m WHERE m.ticket_id = t.id),
          t.created_at
        )
      ) <= datetime('now', ?)
    `)
    .all(`-${TICKET_INACTIVITY_HOURS} hours`) as { id: number }[];

  let removed = 0;
  for (const row of rows) {
    if (deleteTicketById(row.id)) {
      removed += 1;
    }
  }

  return removed;
}
