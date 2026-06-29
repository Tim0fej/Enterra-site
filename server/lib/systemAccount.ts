import { db } from '../db.js';
import {
  isSystemAccount,
  SYSTEM_ACCOUNT_EMAIL,
  SYSTEM_ACCOUNT_USERNAME,
} from '../../shared/systemAccount.js';

export { isSystemAccount };

export function getSystemAccountUserIds(): number[] {
  const rows = db
    .prepare(`
      SELECT id FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
    `)
    .all(SYSTEM_ACCOUNT_EMAIL, SYSTEM_ACCOUNT_USERNAME.toLowerCase()) as { id: number }[];

  return rows.map((row) => row.id);
}

export function isSystemAccountId(userId: number | null | undefined): boolean {
  if (userId == null) {
    return false;
  }
  return getSystemAccountUserIds().includes(userId);
}

export function staffCanAccessAssignedTicket(
  assignedTo: number | null,
  staffUserId: number,
): boolean {
  if (assignedTo == null || isSystemAccountId(assignedTo)) {
    return true;
  }
  return assignedTo === staffUserId;
}

export function clearSystemAccountTicketAssignments(): void {
  db.prepare(`
    UPDATE tickets SET assigned_to = NULL
    WHERE assigned_to IN (
      SELECT id FROM users
      WHERE LOWER(email) = ? OR LOWER(username) = ?
    )
  `).run(SYSTEM_ACCOUNT_EMAIL, SYSTEM_ACCOUNT_USERNAME.toLowerCase());
}
