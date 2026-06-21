import path from 'path';
import { db } from '../db.js';
import { isStaffRole } from '../auth.js';
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
        SELECT t.user_id
        FROM ticket_messages m
        JOIN tickets t ON t.id = m.ticket_id
        WHERE m.id = ?
      `)
      .get(attachment.ticket_message_id) as { user_id: number } | undefined;

    if (!ticket) return false;
    return ticket.user_id === user.id || isStaffRole(user.role as 'user' | 'admin' | 'moderator');
  }

  return Boolean(user && attachment.user_id === user.id);
}

export function getAttachmentFilePath(storedName: string) {
  return path.join(UPLOADS_DIR, storedName);
}
