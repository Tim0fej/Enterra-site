import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Ticket, TicketMessage } from '../types/auth';
import { isStaff, ROLE_LABELS, roleBadgeClass } from '../utils/roles';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import { MessageAttachments } from '../components/MessageAttachments';
import type { Attachment } from '../../shared/attachments';

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
  const { reloadTickets } = useOutletContext<OutletContext>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (!id) return;
    void api<{ ticket: Ticket; messages: TicketMessage[] }>(`/tickets/${id}`)
      .then((data) => {
        setTicket(data.ticket);
        setMessages(data.messages);
      })
      .catch(() => navigate('/tickets'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() && replyAttachments.length === 0) return;
    setError('');
    setSending(true);
    try {
      await api(`/tickets/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: reply,
          attachmentIds: attachmentIds(replyAttachments),
        }),
      });
      setReply('');
      setReplyAttachments([]);
      load();
      reloadTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: Ticket['status']) => {
    try {
      await api(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
      reloadTickets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  if (loading) {
    return <div className="messenger__placeholder card"><p className="muted">Загрузка...</p></div>;
  }

  if (!ticket) {
    return (
      <div className="messenger__placeholder card">
        <p>Диалог не найден</p>
        <Link to="/tickets" className="link-btn">← К списку</Link>
      </div>
    );
  }

  const staff = isStaff(user?.role ?? 'user');
  const canReply = ticket.status !== 'closed' || staff;

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
            </p>
          </div>
        </div>
        {staff && (
          <div className="chat-panel__status">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className={`btn btn--small${ticket.status === s ? ' btn--primary' : ' btn--ghost'}`}
                onClick={() => void handleStatusChange(s)}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="chat-panel__messages">
        {messages.map((msg) => {
          const mine = msg.author.toLowerCase() === user?.username.toLowerCase();
          return (
            <div
              key={msg.id}
              className={`chat-bubble${mine ? ' chat-bubble--mine' : ' chat-bubble--other'}${msg.is_staff ? ' chat-bubble--staff' : ''}`}
            >
              <div className="chat-bubble__meta">
                <div className="chat-bubble__author">
                  <strong className={isStaff(msg.role) ? 'admin-name' : ''}>{msg.author}</strong>
                  {msg.is_staff ? (
                    <span className={roleBadgeClass(msg.role)}>{ROLE_LABELS[msg.role]}</span>
                  ) : null}
                </div>
                <time>{new Date(msg.created_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
              </div>
              <div className="chat-bubble__text">
                {msg.content ? <p>{msg.content}</p> : null}
                <MessageAttachments attachments={msg.attachments} />
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {canReply ? (
        <form className="chat-panel__composer" onSubmit={(e) => void handleReply(e)}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="chat-panel__input-row">
            <div className="chat-panel__input-main">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Напиши сообщение..."
              />
              <AttachmentInput
                attachments={replyAttachments}
                onChange={setReplyAttachments}
                disabled={sending}
              />
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={sending || (!reply.trim() && replyAttachments.length === 0)}
            >
              {sending ? '…' : '→'}
            </button>
          </div>
        </form>
      ) : (
        <p className="chat-panel__closed muted">Диалог закрыт. Создай новый, если вопрос остался.</p>
      )}
    </div>
  );
}
