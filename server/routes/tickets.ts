import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware, isStaffRole, optionalAuth, staffMiddleware, type AuthRequest } from '../auth.js';
import {
  getAttachmentsForTicketMessages,
  linkAttachmentsToTicketMessage,
  parseAttachmentIds,
} from '../lib/attachments.js';
import {
  isSystemAccount,
  isSystemAccountId,
  staffCanAccessAssignedTicket,
} from '../lib/systemAccount.js';
import { validateUserContent, validateTitle } from '../lib/spamGuard.js';
import { publicFormBotGuard } from '../middleware/botGuard.js';
import { sqlExcludeSystemAccount, SYSTEM_ACCOUNT_ID_SUBQUERY } from '../../shared/systemAccount.js';
import { normalizeEmail, validateEmail } from '../../shared/accountValidation.js';
import { validateGuestName } from '../../shared/guestTicketConfig.js';
import {
  generateGuestTicketToken,
  getGuestTicketUserId,
  guestSpamUserId,
  parseGuestTicketAccessHeader,
} from '../lib/guestTickets.js';

const router = Router();

const TICKET_LIST_QUERY = `
  SELECT
    t.id,
    t.title,
    t.status,
    t.type,
    t.assigned_to,
    t.created_at,
    t.updated_at,
    t.is_guest,
    t.guest_name,
    t.guest_email,
    u.username AS author,
    a.username AS assignee,
    (
      SELECT m.content
      FROM ticket_messages m
      WHERE m.ticket_id = t.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message
  FROM tickets t
  JOIN users u ON u.id = t.user_id
  LEFT JOIN users a ON a.id = t.assigned_to AND ${sqlExcludeSystemAccount('a')}
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
    is_guest: Boolean(row.is_guest),
    guest_name: (row.guest_name as string | null) ?? null,
  };

  if (isStaff) {
    const assignedTo = row.assigned_to as number | null;
    const visibleAssignee = isSystemAccountId(assignedTo) ? null : assignedTo;
    return {
      ...base,
      author: (row.is_guest ? row.guest_name : row.author) as string,
      guest_email: (row.guest_email as string | null) ?? null,
      assigned_to: visibleAssignee,
      assignee: (row.assignee as string | null) ?? null,
    };
  }

  return base;
}

type TicketAccessRow = {
  id: number;
  user_id: number;
  assigned_to: number | null;
  status: string;
  is_guest: number;
  guest_token: string | null;
  guest_name: string | null;
  guest_email: string | null;
};

function guestTokenMatches(ticket: TicketAccessRow, token: string | null | undefined): boolean {
  return Boolean(ticket.is_guest && ticket.guest_token && token && token === ticket.guest_token);
}

function canAccessTicket(ticket: TicketAccessRow, req: AuthRequest, guestToken?: string | null): boolean {
  const isStaff = req.user ? isStaffRole(req.user.role) : false;

  if (req.user) {
    if (ticket.user_id === req.user.id) return true;
    if (isStaff) {
      return staffCanAccessAssignedTicket(ticket.assigned_to, req.user.id);
    }
  }

  return guestTokenMatches(ticket, guestToken);
}

function resolveGuestToken(req: AuthRequest, ticketId: number): string | null {
  const entries = parseGuestTicketAccessHeader(req.get('X-Guest-Ticket-Access') ?? undefined);
  return entries.find((entry) => entry.id === ticketId)?.token ?? null;
}

function decorateGuestMessageAuthor(
  message: Record<string, unknown>,
  ticket: TicketAccessRow,
  guestUserId: number,
): Record<string, unknown> {
  if (ticket.is_guest && message.user_id === guestUserId && !message.is_staff) {
    return { ...message, author: ticket.guest_name ?? 'Гость' };
  }
  return message;
}

function enrichTicketMessages(messages: Array<{ id: number } & Record<string, unknown>>) {
  const attachmentMap = getAttachmentsForTicketMessages(messages.map((m) => m.id));
  return messages.map((message) => ({
    ...message,
    attachments: attachmentMap.get(message.id) ?? [],
  }));
}

router.get('/staff', authMiddleware, staffMiddleware, (_req, res) => {
  const staff = db
    .prepare(`
      SELECT id, username, role
      FROM users
      WHERE role IN ('moderator', 'admin')
        AND ${sqlExcludeSystemAccount('users')}
      ORDER BY username COLLATE NOCASE ASC
    `)
    .all();

  res.json(staff);
});

router.get('/', optionalAuth, (req: AuthRequest, res) => {
  if (req.user) {
    const isStaff = isStaffRole(req.user.role);

    const rows = isStaff
      ? db
          .prepare(`
            ${TICKET_LIST_QUERY}
            WHERE t.assigned_to IS NULL
              OR t.assigned_to = ?
              OR t.assigned_to IN ${SYSTEM_ACCOUNT_ID_SUBQUERY}
            ORDER BY
              CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
              t.updated_at DESC
          `)
          .all(req.user.id)
      : db
          .prepare(`
            ${TICKET_LIST_QUERY}
            WHERE t.user_id = ? AND t.is_guest = 0
            ORDER BY t.updated_at DESC
          `)
          .all(req.user.id);

    res.json(rows.map((row) => mapTicketListRow(row as Record<string, unknown>, isStaff)));
    return;
  }

  const guestAccess = parseGuestTicketAccessHeader(req.get('X-Guest-Ticket-Access') ?? undefined);
  if (guestAccess.length === 0) {
    res.json([]);
    return;
  }

  const rows = guestAccess.flatMap(({ id, token }) => {
    const row = db
      .prepare(`
        ${TICKET_LIST_QUERY}
        WHERE t.id = ? AND t.is_guest = 1 AND t.guest_token = ?
      `)
      .get(id, token) as Record<string, unknown> | undefined;
    return row ? [row] : [];
  });

  rows.sort(
    (a, b) =>
      new Date(String(b.updated_at)).getTime() - new Date(String(a.updated_at)).getTime(),
  );

  res.json(rows.map((row) => mapTicketListRow(row, false)));
});

router.post('/guest', ...publicFormBotGuard, (req, res) => {
  const { guestName, guestEmail, content, attachmentIds: rawAttachmentIds } = req.body as {
    guestName?: string;
    guestEmail?: string;
    content?: string;
    attachmentIds?: unknown;
  };

  const name = guestName?.trim() ?? '';
  const email = normalizeEmail(guestEmail ?? '');
  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  const nameError = validateGuestName(name);
  if (nameError) {
    res.status(400).json({ error: nameError });
    return;
  }

  const emailError = validateEmail(email);
  if (emailError) {
    res.status(400).json({ error: emailError });
    return;
  }

  if (!text && attachmentIds.length === 0) {
    res.status(400).json({ error: 'Введите сообщение' });
    return;
  }

  if (attachmentIds.length > 0) {
    res.status(400).json({ error: 'Вложения доступны после регистрации' });
    return;
  }

  if (text) {
    const spamError = validateUserContent(text, guestSpamUserId(email));
    if (spamError) {
      res.status(400).json({ error: spamError });
      return;
    }
  }

  const guestUserId = getGuestTicketUserId();
  const guestToken = generateGuestTicketToken();
  const ticketTitle = `Обращение от ${name}`;

  try {
    const ticketId = db.transaction(() => {
      const ticket = db
        .prepare(`
          INSERT INTO tickets (user_id, title, type, is_guest, guest_token, guest_email, guest_name)
          VALUES (?, ?, 'general', 1, ?, ?, ?)
        `)
        .run(guestUserId, ticketTitle, guestToken, email, name);

      const id = Number(ticket.lastInsertRowid);

      db.prepare('INSERT INTO ticket_messages (ticket_id, user_id, content) VALUES (?, ?, ?)').run(
        id,
        guestUserId,
        text,
      );

      return id;
    })();

    res.status(201).json({ ticketId, guestToken });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось создать тикет' });
  }
});

router.post('/', authMiddleware, ...publicFormBotGuard, (req: AuthRequest, res) => {
  const { title, content, type, attachmentIds: rawAttachmentIds } = req.body as {
    title?: string;
    content?: string;
    type?: 'general' | 'support' | 'media' | 'vip';
    attachmentIds?: unknown;
  };

  const text = content?.trim() ?? '';
  const attachmentIds = parseAttachmentIds(rawAttachmentIds);

  if (!text && attachmentIds.length === 0) {
    res.status(400).json({ error: 'Введите сообщение или прикрепите файлы' });
    return;
  }

  if (text) {
    const spamError = validateUserContent(text, req.user!.id);
    if (spamError) {
      res.status(400).json({ error: spamError });
      return;
    }
  }

  const ticketType = type && ['general', 'support', 'media', 'vip'].includes(type) ? type : 'general';
  const ticketTitle = title?.trim() || 'Обращение в поддержку';

  const titleError = validateTitle(ticketTitle);
  if (titleError) {
    res.status(400).json({ error: titleError });
    return;
  }

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

router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  const ticket = db
    .prepare(`
      SELECT t.*, u.username AS author, a.username AS assignee
      FROM tickets t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN users a ON a.id = t.assigned_to AND ${sqlExcludeSystemAccount('a')}
      WHERE t.id = ?
    `)
    .get(req.params.id) as
    | ({
        id: number;
        user_id: number;
        title: string;
        status: string;
        type: string;
        assigned_to: number | null;
        author: string;
        assignee: string | null;
        is_guest: number;
        guest_token: string | null;
        guest_name: string | null;
        guest_email: string | null;
      })
    | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  const guestToken = resolveGuestToken(req, ticket.id);
  if (!canAccessTicket(ticket, req, guestToken)) {
    res.status(403).json({ error: 'Нет доступа к этому тикету' });
    return;
  }

  const isStaff = req.user ? isStaffRole(req.user.role) : false;
  const guestUserId = getGuestTicketUserId();

  const messages = db
    .prepare(`
      SELECT m.*, u.username AS author, u.role
      FROM ticket_messages m
      JOIN users u ON u.id = m.user_id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
    `)
    .all(ticket.id) as Array<{ id: number } & Record<string, unknown>>;

  const { author, assignee, assigned_to, guest_token: _guestToken, guest_email, ...rest } = ticket;
  const visibleAssignedTo = isSystemAccountId(assigned_to) ? null : assigned_to;

  res.json({
    ticket: isStaff
      ? {
          ...rest,
          author: ticket.is_guest ? (ticket.guest_name ?? author) : author,
          guest_email: ticket.is_guest ? guest_email : null,
          assignee,
          assigned_to: visibleAssignedTo,
        }
      : {
          ...rest,
          guest_name: ticket.is_guest ? ticket.guest_name : null,
        },
    messages: enrichTicketMessages(
      messages.map((message) =>
        decorateGuestMessageAuthor(message, ticket, guestUserId),
      ) as Array<{ id: number } & Record<string, unknown>>,
    ),
  });
});

router.post('/:id/reply', optionalAuth, ...publicFormBotGuard, (req: AuthRequest, res) => {
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
    .get(req.params.id) as TicketAccessRow | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  const guestToken = resolveGuestToken(req, ticket.id);
  const isStaff = req.user ? isStaffRole(req.user.role) : false;
  const isGuestAuthor = guestTokenMatches(ticket, guestToken);

  if (!canAccessTicket(ticket, req, guestToken)) {
    res.status(403).json({ error: 'Нет доступа' });
    return;
  }

  if (isStaff && ticket.user_id !== req.user!.id && !staffCanAccessAssignedTicket(ticket.assigned_to, req.user!.id)) {
    res.status(403).json({ error: 'Диалог ведёт другой модератор' });
    return;
  }

  if (isGuestAuthor && attachmentIds.length > 0) {
    res.status(400).json({ error: 'Вложения доступны после регистрации' });
    return;
  }

  if (text) {
    const spamUserId = isGuestAuthor
      ? guestSpamUserId(ticket.guest_email ?? '')
      : req.user!.id;
    const spamError = validateUserContent(text, spamUserId);
    if (spamError) {
      res.status(400).json({ error: spamError });
      return;
    }
  }

  if (ticket.status === 'closed' && !isStaff) {
    res.status(403).json({ error: 'Диалог закрыт' });
    return;
  }

  const authorUserId = isGuestAuthor ? getGuestTicketUserId() : req.user!.id;

  try {
    const message = db
      .prepare(
        'INSERT INTO ticket_messages (ticket_id, user_id, content, is_staff) VALUES (?, ?, ?, ?)',
      )
      .run(ticket.id, authorUserId, text, isStaff ? 1 : 0);

    if (!isGuestAuthor) {
      linkAttachmentsToTicketMessage(req.user!.id, Number(message.lastInsertRowid), attachmentIds);
    }
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Не удалось отправить' });
    return;
  }

  if (isStaff && req.user && ticket.user_id !== req.user.id && !isSystemAccountId(req.user.id)) {
    db.prepare(`
      UPDATE tickets
      SET updated_at = datetime('now'),
          assigned_to = ?,
          status = CASE WHEN status = 'closed' THEN status ELSE 'in_progress' END
      WHERE id = ?
    `).run(req.user!.id, ticket.id);
  } else {
    db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(ticket.id);

    if (ticket.status === 'open' && isStaff) {
      db.prepare("UPDATE tickets SET status = 'in_progress' WHERE id = ?").run(ticket.id);
    }
  }

  res.status(201).json({ ok: true });
});

router.patch('/:id/assign', authMiddleware, staffMiddleware, (req: AuthRequest, res) => {
  const { assigneeId } = req.body as { assigneeId?: number | null };

  const ticket = db
    .prepare('SELECT id, assigned_to, status FROM tickets WHERE id = ?')
    .get(req.params.id) as { id: number; assigned_to: number | null; status: string } | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  if (assigneeId === undefined) {
    res.status(400).json({ error: 'Укажите модератора или null для возврата в очередь' });
    return;
  }

  if (assigneeId === null) {
    if (ticket.assigned_to !== req.user!.id) {
      res.status(403).json({ error: 'Только ответственный может вернуть диалог в очередь' });
      return;
    }

    db.prepare(`
      UPDATE tickets
      SET assigned_to = NULL,
          status = CASE WHEN status = 'closed' THEN status ELSE 'open' END,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(ticket.id);

    res.json({ ok: true });
    return;
  }

  if (!Number.isInteger(assigneeId) || assigneeId <= 0) {
    res.status(400).json({ error: 'Некорректный модератор' });
    return;
  }

  const assignee = db
    .prepare(`
      SELECT id, email, username FROM users
      WHERE id = ? AND role IN ('moderator', 'admin')
    `)
    .get(assigneeId) as { id: number; email: string; username: string } | undefined;

  if (!assignee || isSystemAccount(assignee)) {
    res.status(400).json({ error: 'Модератор не найден' });
    return;
  }

  const isAssignee = ticket.assigned_to === req.user!.id;
  const isUnassigned = ticket.assigned_to == null || isSystemAccountId(ticket.assigned_to);
  const isAdmin = req.user!.role === 'admin';

  if (!isUnassigned && !isAssignee && !isAdmin) {
    res.status(403).json({ error: 'Диалог ведёт другой модератор' });
    return;
  }

  db.prepare(`
    UPDATE tickets
    SET assigned_to = ?,
        status = CASE WHEN status = 'closed' THEN status ELSE 'in_progress' END,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(assigneeId, ticket.id);

  res.json({ ok: true });
});

router.patch('/:id/status', authMiddleware, staffMiddleware, (req: AuthRequest, res) => {
  const { status } = req.body as { status?: string };

  if (!status || !['open', 'in_progress', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Некорректный статус' });
    return;
  }

  const ticket = db
    .prepare('SELECT id, assigned_to FROM tickets WHERE id = ?')
    .get(req.params.id) as { id: number; assigned_to: number | null } | undefined;

  if (!ticket) {
    res.status(404).json({ error: 'Тикет не найден' });
    return;
  }

  if (!staffCanAccessAssignedTicket(ticket.assigned_to, req.user!.id)) {
    res.status(403).json({ error: 'Диалог ведёт другой модератор' });
    return;
  }

  db.prepare("UPDATE tickets SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    ticket.id,
  );

  res.json({ ok: true });
});

export default router;
