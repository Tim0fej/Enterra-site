import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { isStaffRole } from '../auth.js';
import { staffCanAccessAssignedTicket } from './systemAccount.js';
import { UPLOADS_DIR } from '../paths.js';
import type { Attachment } from '../../shared/attachments.js';
import { MAX_ATTACHMENTS_PER_MESSAGE } from '../../shared/attachments.js';

export { UPLOADS_DIR };

interface AttachmentRow {
  id: number;
  stored_name: string;
  original_name: string;
  mime_type: string;
  size: number;
  user_id: number;
  ticket_message_id: number | null;
  forum_post_id: number | null;
}

export function parseAttachmentIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => Number(item))
    .filter((id) => Number.isInteger(id) && id > 0)
    .slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
}

export function mapAttachment(row: AttachmentRow): Attachment {
  return {
    id: row.id,
    url: `/api/uploads/${row.id}`,
    mimeType: row.mime_type,
    originalName: row.original_name,
    size: row.size,
  };
}

export function insertAttachment(
  userId: number,
  storedName: string,
  originalName: string,
  mimeType: string,
  size: number,
): Attachment {
  const result = db
    .prepare(`
      INSERT INTO attachments (stored_name, original_name, mime_type, size, user_id)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(storedName, originalName, mimeType, size, userId);

  return mapAttachment({
    id: Number(result.lastInsertRowid),
    stored_name: storedName,
    original_name: originalName,
    mime_type: mimeType,
    size,
    user_id: userId,
    ticket_message_id: null,
    forum_post_id: null,
  });
}

function assertUnlinkedAttachments(userId: number, attachmentIds: number[]) {
  if (attachmentIds.length === 0) return;

  const placeholders = attachmentIds.map(() => '?').join(',');
  const rows = db
    .prepare(`
      SELECT id FROM attachments
      WHERE id IN (${placeholders})
        AND user_id = ?
        AND ticket_message_id IS NULL
        AND forum_post_id IS NULL
    `)
    .all(...attachmentIds, userId) as { id: number }[];

  if (rows.length !== attachmentIds.length) {
    throw new Error('Некорректные вложения');
  }
}

export function linkAttachmentsToTicketMessage(
  userId: number,
  messageId: number,
  attachmentIds: number[],
) {
  assertUnlinkedAttachments(userId, attachmentIds);
  const update = db.prepare('UPDATE attachments SET ticket_message_id = ? WHERE id = ?');
  for (const attachmentId of attachmentIds) {
    update.run(messageId, attachmentId);
  }
}

export function linkAttachmentsToForumPost(userId: number, postId: number, attachmentIds: number[]) {
  assertUnlinkedAttachments(userId, attachmentIds);
  const update = db.prepare('UPDATE attachments SET forum_post_id = ? WHERE id = ?');
  for (const attachmentId of attachmentIds) {
    update.run(postId, attachmentId);
  }
}

export function getAttachmentsForTicketMessages(messageIds: number[]) {
  const map = new Map<number, Attachment[]>();
  if (messageIds.length === 0) return map;

  const placeholders = messageIds.map(() => '?').join(',');
  const rows = db
    .prepare(`
      SELECT id, stored_name, original_name, mime_type, size, ticket_message_id, forum_post_id
      FROM attachments
      WHERE ticket_message_id IN (${placeholders})
      ORDER BY id ASC
    `)
    .all(...messageIds) as Array<AttachmentRow & { ticket_message_id: number }>;

  for (const row of rows) {
    const list = map.get(row.ticket_message_id) ?? [];
    list.push(mapAttachment(row));
    map.set(row.ticket_message_id, list);
  }

  return map;
}

export function getAttachmentsForForumPosts(postIds: number[]) {
  const map = new Map<number, Attachment[]>();
  if (postIds.length === 0) return map;

  const placeholders = postIds.map(() => '?').join(',');
  const rows = db
    .prepare(`
      SELECT id, stored_name, original_name, mime_type, size, ticket_message_id, forum_post_id
      FROM attachments
      WHERE forum_post_id IN (${placeholders})
      ORDER BY id ASC
    `)
    .all(...postIds) as Array<AttachmentRow & { forum_post_id: number }>;

  for (const row of rows) {
    const list = map.get(row.forum_post_id) ?? [];
    list.push(mapAttachment(row));
    map.set(row.forum_post_id, list);
  }

  return map;
}

export function getAttachmentById(id: number) {
  return db
    .prepare(`
      SELECT id, stored_name, original_name, mime_type, size, user_id, ticket_message_id, forum_post_id
      FROM attachments WHERE id = ?
    `)
    .get(id) as AttachmentRow | undefined;
}

export function canAccessAttachment(
  attachment: AttachmentRow,
  user?: { id: number; role: string },
): boolean {
  if (attachment.forum_post_id) {
    return true;
  }

  if (attachment.ticket_message_id) {
    if (!user) return false;

    const ticket = db
      .prepare(`
        SELECT t.user_id, t.assigned_to
        FROM ticket_messages m
        JOIN tickets t ON t.id = m.ticket_id
        WHERE m.id = ?
      `)
      .get(attachment.ticket_message_id) as
      | { user_id: number; assigned_to: number | null }
      | undefined;

    if (!ticket) return false;
    if (ticket.user_id === user.id) return true;
    if (!isStaffRole(user.role as 'user' | 'admin' | 'moderator')) return false;
    return staffCanAccessAssignedTicket(ticket.assigned_to, user.id);
  }

  return Boolean(user && attachment.user_id === user.id);
}

export function getAttachmentFilePath(storedName: string) {
  if (!/^[0-9a-f-]{36}(\.[a-z0-9]{1,16})?$/i.test(storedName)) {
    throw new Error('Invalid attachment path');
  }
  const root = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(root, storedName);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Invalid attachment path');
  }
  return resolved;
}

const PENDING_UPLOAD_LIMIT = 20;

export function countPendingUploads(userId: number): number {
  const row = db
    .prepare(`
      SELECT COUNT(*) as count FROM attachments
      WHERE user_id = ?
        AND ticket_message_id IS NULL
        AND forum_post_id IS NULL
        AND created_at > datetime('now', '-24 hours')
    `)
    .get(userId) as { count: number };
  return row.count;
}

export function assertPendingUploadQuota(userId: number) {
  if (countPendingUploads(userId) >= PENDING_UPLOAD_LIMIT) {
    throw new Error('Слишком много неиспользованных загрузок. Подождите или удалите старые файлы.');
  }
}

export function purgeOrphanAttachments(maxAgeHours = 48): number {
  const rows = db
    .prepare(`
      SELECT id, stored_name FROM attachments
      WHERE ticket_message_id IS NULL
        AND forum_post_id IS NULL
        AND created_at < datetime('now', '-' || ? || ' hours')
    `)
    .all(maxAgeHours) as Array<{ id: number; stored_name: string }>;

  let removed = 0;
  for (const row of rows) {
    try {
      const filePath = getAttachmentFilePath(row.stored_name);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // skip invalid paths
    }
    db.prepare('DELETE FROM attachments WHERE id = ?').run(row.id);
    removed += 1;
  }
  return removed;
}
