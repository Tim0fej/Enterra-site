import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import type { Attachment } from '../../shared/attachments';

interface OutletContext {
  reloadTickets: () => void;
}

export function NewTicketPage() {
  const navigate = useNavigate();
  const { reloadTickets } = useOutletContext<OutletContext>();
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api<{ ticketId: number }>('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          content: message,
          attachmentIds: attachmentIds(attachments),
        }),
      });
      reloadTickets();
      navigate(`/tickets/${data.ticketId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-panel card">
      <header className="chat-panel__header">
        <div className="chat-panel__header-main">
          <Link to="/tickets" className="chat-panel__back link-btn">← Назад</Link>
          <div>
            <h2>Новый диалог</h2>
            <p className="muted">Опиши вопрос — администрация ответит в этом чате</p>
          </div>
        </div>
        <Link to="/tickets" className="link-btn chat-panel__cancel">Отмена</Link>
      </header>

      <form className="chat-panel__new-form" onSubmit={(e) => void handleSubmit(e)}>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="field">
          <span>Сообщение</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Опиши проблему или вопрос..."
            autoFocus
          />
        </label>
        <AttachmentInput attachments={attachments} onChange={setAttachments} disabled={loading} />
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading || (!message.trim() && attachments.length === 0)}
        >
          {loading ? 'Отправка...' : 'Начать диалог'}
        </button>
      </form>
    </div>
  );
}