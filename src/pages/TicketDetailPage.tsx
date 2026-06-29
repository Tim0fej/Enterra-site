import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useLayoutError } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { Ticket, TicketMessage, TicketStaffMember } from '../types/auth';
import { isStaff } from '../utils/roles';
import { SiteRoleBadge } from '../components/GroupBadge';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import { MessageAttachments } from '../components/MessageAttachments';
import { onEnterToSend, scrollChatToBottom } from '../utils/chatComposer';
import { ChatSendIcon } from '../components/ChatSendIcon';
import { formatApiError } from '../utils/formatError';
import { isSystemAccount } from '../../shared/systemAccount';
import type { Attachment } from '../../shared/attachments';
import { FORM_LOADED_AT_FIELD } from '../../shared/botProtection';
import { useFormLoadedAt } from '../hooks/useBotFormFields';
import { usePolling } from '../hooks/usePolling';
import { formatSiteDateTime } from '../utils/formatDate';

const STATUS_OPTIONS: Ticket['status'][] = ['open', 'in_progress', 'closed'];

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  closed: 'Закрыт',
};

interface OutletContext {
  reloadTickets: () => void;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useLayoutError();
  const { reloadTickets } = useOutletContext<OutletContext>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [staffMembers, setStaffMembers] = useState<TicketStaffMember[]>([]);
  const [transferTo, setTransferTo] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const formLoadedAt = useFormLoadedAt();

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setTicket(null);
    setMessages([]);

    void api<{ ticket: Ticket; messages: TicketMessage[] }>(`/tickets/${id}`)
      .then((data) => {
        if (cancelled) return;
        setTicket(data.ticket);
        setMessages(data.messages);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError && err.status === 403
            ? 'Нет доступа к этому диалогу'
            : 'Не удалось загрузить диалог';
        showError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reloadTicket = useCallback((silent = false) => {
    if (!id) return;
    void api<{ ticket: Ticket; messages: TicketMessage[] }>(`/tickets/${id}`)
      .then((data) => {
        setTicket(data.ticket);
        setMessages((prev) => {
          if (
            silent &&
            prev.length === data.messages.length &&
            prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id
          ) {
            return prev;
          }
          return data.messages;
        });
      })
      .catch((err) => {
        if (!silent) {
          showError(formatApiError(err, 'Не удалось обновить диалог'));
        }
      });
  }, [id, showError]);

  usePolling(() => reloadTicket(true), 5_000, Boolean(id) && Boolean(ticket));

  useEffect(() => {
    if (!user || !isStaff(user.role)) return;
    void api<TicketStaffMember[]>('/tickets/staff').then(setStaffMembers).catch(() => {});
  }, [user]);

  useEffect(() => {
    scrollChatToBottom(messagesRef.current);
  }, [messages]);

  const submitReply = async () => {
    if (!reply.trim() && replyAttachments.length === 0) return;
    setSending(true);
    try {
      await api(`/tickets/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: reply,
          attachmentIds: attachmentIds(replyAttachments),
          [FORM_LOADED_AT_FIELD]: formLoadedAt,
        }),
      });
      setReply('');
      setReplyAttachments([]);
      reloadTicket();
      reloadTickets();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReply();
  };

  const canSend = !sending && (reply.trim().length > 0 || replyAttachments.length > 0);

  const handleStatusChange = async (status: Ticket['status']) => {
    if (statusChanging) return;
    setStatusChanging(true);
    try {
      await api(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      reloadTicket();
      reloadTickets();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setStatusChanging(false);
    }
  };

  const handleAssign = async (assigneeId: number | null) => {
    if (assigning) return;
    setAssigning(true);
    try {
      await api(`/tickets/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId }),
      });
      if (assigneeId === null) {
        navigate('/tickets');
      } else {
        reloadTicket();
      }
      reloadTickets();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setAssigning(false);
    }
  };

  const handleTransferApply = async () => {
    if (!transferTo) return;
    if (transferTo === 'free') {
      await handleAssign(null);
    } else {
      await handleAssign(Number(transferTo));
    }
    setTransferTo('');
  };

  if (loading) {
    return <div className="messenger__placeholder card"><p className="muted">Загрузка...</p></div>;
  }

  if (!ticket) {
    return (
      <div className="messenger__placeholder card">
        <p className="muted">Диалог недоступен</p>
        <Link to="/tickets" className="link-btn">← К списку</Link>
      </div>
    );
  }

  const staff = isStaff(user?.role ?? 'user');
  const canReply = ticket.status !== 'closed' || staff;
  const isAssignee = staff && ticket.assigned_to === user?.id;
  const isUnassigned = staff && ticket.assigned_to == null;
  const transferOptions = staffMembers.filter(
    (member) => member.id !== user?.id && !isSystemAccount({ username: member.username }),
  );

  return (
    <div className="chat-panel card">
      <header className="chat-panel__header">
        <div className="chat-panel__header-main">
          <Link to="/tickets" className="chat-panel__back link-btn">← Назад</Link>
          <div>
            <h2>{ticket.title}</h2>
            <p className="muted chat-panel__meta">
              {staff && ticket.author ? `${ticket.author} · ` : ''}
              {STATUS_LABELS[ticket.status]}
              {staff && ticket.assignee ? ` · Ведёт ${ticket.assignee}` : staff && isUnassigned ? ' · Свободный' : ''}
            </p>
          </div>
        </div>
        {staff && (
          <div className="chat-panel__staff-bar">
            <div className="chat-panel__status">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`btn btn--small${ticket.status === s ? ' btn--primary' : ' btn--ghost'}`}
                  disabled={statusChanging}
                  onClick={() => void handleStatusChange(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {(isAssignee || (isUnassigned && transferOptions.length > 0)) && (
              <div className="chat-panel__transfer">
                <select
                  className="chat-panel__transfer-select"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  disabled={assigning}
                >
                  <option value="">Передать или освободить…</option>
                  {isAssignee && (
                    <option value="free">Свободный — в общую очередь</option>
                  )}
                  {transferOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.username}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn--small btn--ghost chat-panel__transfer-btn"
                  disabled={assigning || !transferTo}
                  onClick={() => void handleTransferApply()}
                >
                  {transferTo === 'free' ? 'Освободить' : 'Передать'}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="chat-panel__messages" ref={messagesRef}>
        {messages.map((msg) => {
          const mine = user
            ? !msg.is_staff && msg.author.toLowerCase() === user.username.toLowerCase()
            : !msg.is_staff;
          return (
            <div
              key={msg.id}
              className={`chat-bubble${mine ? ' chat-bubble--mine' : ' chat-bubble--other'}${msg.is_staff ? ' chat-bubble--staff' : ''}`}
            >
              <div className="chat-bubble__meta">
                <div className="chat-bubble__author">
                  <strong className={isStaff(msg.role) ? 'admin-name' : ''}>{msg.author}</strong>
                  <SiteRoleBadge role={msg.role} size="md" className="group-badge--inline" />
                </div>
                <time dateTime={msg.created_at}>
                  {formatSiteDateTime(msg.created_at, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
              <div className="chat-bubble__text">
                {msg.content ? <p>{msg.content}</p> : null}
                <MessageAttachments attachments={msg.attachments} />
              </div>
            </div>
          );
        })}
      </div>

      {canReply ? (
        <form className="chat-panel__composer" onSubmit={(e) => void handleReply(e)}>
          <div className="chat-panel__input-row">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => onEnterToSend(e, () => void submitReply(), !canSend)}
              rows={1}
              aria-label="Сообщение"
              placeholder="Напиши сообщение… Enter — отправить"
            />
            <button
              type="submit"
              className="btn btn--primary chat-panel__send"
              disabled={!canSend}
              aria-label="Отправить"
            >
              {sending ? '…' : <ChatSendIcon />}
            </button>
          </div>
          <div className="chat-panel__toolbar">
            {user ? (
              <AttachmentInput
                attachments={replyAttachments}
                onChange={setReplyAttachments}
                disabled={sending}
              />
            ) : null}
          </div>
        </form>
      ) : (
        <p className="chat-panel__closed muted">Диалог закрыт. Создай новый, если вопрос остался.</p>
      )}
    </div>
  );
}
