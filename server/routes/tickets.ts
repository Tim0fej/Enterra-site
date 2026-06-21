import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, isStaffRole, staffMiddleware, type AuthRequest } from '../auth.js';
import {
  getAttachmentsForTicketMessages,
  linkAttachmentsToTicketMessage,
  parseAttachmentIds,
} from '../lib/attachments.js';

const router = Router();

const TICKET_LIST_QUERY = `
  SELECT
    t.id,
    t.title,
    t.status,
    t.type,
    t.created_at,
    t.updated_at,
    u.username AS author,
    (
      SELECT m.content
      FROM ticket_messages m
      WHERE m.ticket_id = t.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message
  FROM tickets t
  JOIN users u ON u.id = t.user_id
`;

function mapTicketListRow(row: Record<string, unknown>, isStaff: boolean) {
  const base = {
    id: row.id as number,
    title: row.title as string,
    status: row.status as string,
    type: row.type as string,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    last_message: (row.last_message as string | null) ?? null,
  };

  if (isStaff) {
    return { ...base, author: row.author as string };
  }

  return base;
}

function enrichTicketMessages(messages: Array<{ id: number } & Record<string, unknown>>) {
  const attachmentMap = getAttachmentsForTicketMessages(messages.map((m) => m.id));
  return messages.map((message) => ({
    ...message,
    attachments: attachmentMap.get(message.id) ?? [],
  }));
}

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  const isStaff = isStaffRole(req.user!.role);

  const rows = isStaff
    ? db
        .prepare(`
          ${TICKET_LIST_QUERY}
          ORDER BY
            CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
            t.updated_at DESC
        `)
        .all()
    : db
        .prepare(`
          ${TICKET_LIST_QUERY}
          WHERE t.user_id = ?
          ORDER BY t.updated_at DESC
        `)
        .all(req.user!.id);

  res.json(rows.map((row) => mapTicketListRow(row as Record<string, unknown>, isStaff)));
});

router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { title, content, type, attachmentIds: rawAttachmentIds } = req.body as {
    title?: string;
    content?: string;
    type?: 'general' | 'support' | 'media';
    attachmentIds?: unknown;
  };

  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  if (!text && attachmentIds.length === 0) {
    res.status(400).json({ error: 'Введите сообщение или прикрепите файлы' });
    return;
  }

  const ticketType = type && ['general', 'support', 'media'].includes(type) ? type : 'general';
  const ticketTitle = title?.trim() || 'Обращение в поддержку';

  try {
    const ticketId = db.transaction(() => {
      const ticket = db
        .prepare('INSERT INTO tickets (user_id, title, type) VALUES (?, ?, ?)')
        .run(req.user!.id, ticketTitle, ticketType);

      const id = Number(ticket.lastInsertRowid);

      const message = db
        .prepare('INSERT INTO ticket_messages (ticket_id, user_id, content) VALUES (?, ?, ?)')
        .run(id, req.user!.id, text);

      linkAttachmentsToTicketMessage(req.user!.id, Number(message.lastInsertRowid), attachmentIds);

      return id;
    })();

    res.status(201).json({ ticketId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось создать тикет' });
  }
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  const ticket = db
    .prepare(`
      SELECT t.*, u.username AS author
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      WHERE t.id = ?
    `)
    .get(req.params.id) as
    | {
        id: number;
        user_id: number;
        title: string;
        status: string;
        type: string;
        author: string;
      }
    | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  if (ticket.user_id !== req.user!.id && !isStaffRole(req.user!.role)) {
    res.status(403).json({ error: 'Нет доступа к этому тикету' });
    return;
  }

  const messages = db
    .prepare(`
      SELECT m.*, u.username AS author, u.role
      FROM ticket_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
    `)
    .all(ticket.id) as Array<{ id: number } & Record<string, unknown>>;

  const isStaff = isStaffRole(req.user!.role);
  const { author, ...rest } = ticket;

  res.json({
    ticket: isStaff ? { ...rest, author } : rest,
    messages: enrichTicketMessages(messages),
  });
});

router.post('/:id/reply', authMiddleware, (req: AuthRequest, res) => {
  const { content, attachmentIds: rawAttachmentIds } = req.body as {
    content?: string;
    attachmentIds?: unknown;
  };

  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  if (!text && attachmentIds.length === 0) {
    res.status(400).json({ error: 'Введите текст или прикрепите файлы' });
    return;
  }

  const ticket = db
    .prepare('SELECT * FROM tickets WHERE id = ?')
    .get(req.params.id) as { id: number; user_id: number; status: string } | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  const isStaff = isStaffRole(req.user!.role);
  if (ticket.user_id !== req.user!.id && !isStaff) {
    res.status(403).json({ error: 'Нет доступа' });
    return;
  }

  if (ticket.status === 'closed' && !isStaff) {
    res.status(403).json({ error: 'Диалог закрыт' });
    return;
  }

  try {
    const message = db
      .prepare(
        'INSERT INTO ticket_messages (ticket_id, user_id, content, is_staff) VALUES (?, ?, ?, ?)',
      )
      .run(ticket.id, req.user!.id, text, isStaff ? 1 : 0);

    linkAttachmentsToTicketMessage(req.user!.id, Number(message.lastInsertRowid), attachmentIds);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось отправить' });
    return;
  }

  db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(ticket.id);

  if (ticket.status === 'open' && isStaff) {
    db.prepare("UPDATE tickets SET status = 'in_progress' WHERE id = ?").run(ticket.id);
  }

  res.status(201).json({ ok: true });
});

router.patch('/:id/status', authMiddleware, staffMiddleware, (req: AuthRequest, res) => {
  const { status } = req.body as { status?: string };

  if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Некорректный статус' });
    return;
  }

  const result = db
    .prepare("UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .run(status, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  res.json({ ok: true });
});

export default router;
