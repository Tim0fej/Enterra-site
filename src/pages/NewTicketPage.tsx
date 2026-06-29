import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { useLayoutError } from '../components/Layout';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import { useAuth } from '../context/AuthContext';
import { onEnterToSend } from '../utils/chatComposer';
import { formatApiError } from '../utils/formatError';
import type { Attachment } from '../../shared/attachments';
import { FORM_LOADED_AT_FIELD } from '../../shared/botProtection';
import { useFormLoadedAt } from '../hooks/useBotFormFields';
import { saveGuestTicket } from '../utils/guestTickets';

interface OutletContext {
  reloadTickets: () => void;
}

export function NewTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useLayoutError();
  const { reloadTickets } = useOutletContext<OutletContext>();
  const formLoadedAt = useFormLoadedAt();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const canSend =
    !loading &&
    message.trim().length > 0 &&
    (user || (guestName.trim().length > 0 && guestEmail.trim().length > 0));

  const submit = async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      if (user) {
        const data = await api<{ ticketId: number }>('/tickets', {
          method: 'POST',
          body: JSON.stringify({
            content: message,
            attachmentIds: attachmentIds(attachments),
            [FORM_LOADED_AT_FIELD]: formLoadedAt,
          }),
        });
        reloadTickets();
        navigate(`/tickets/${data.ticketId}`);
        return;
      }

      const data = await api<{ ticketId: number; guestToken: string }>('/tickets/guest', {
        method: 'POST',
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim(),
          content: message,
          [FORM_LOADED_AT_FIELD]: formLoadedAt,
        }),
      });
      saveGuestTicket(data.ticketId, data.guestToken);
      reloadTickets();
      navigate(`/tickets/${data.ticketId}`);
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <div className="chat-panel card">
      <header className="chat-panel__header">
        <div className="chat-panel__header-main">
          <Link to="/tickets" className="chat-panel__back link-btn">
            ← Назад
          </Link>
          <div>
            <h2>Новый диалог</h2>
            {!user ? <p className="muted chat-panel__hint">Без регистрации — укажи имя и email</p> : null}
          </div>
        </div>
        <Link to="/tickets" className="link-btn chat-panel__cancel">
          Отмена
        </Link>
      </header>

      <form className="chat-panel__new-form" onSubmit={(e) => void handleSubmit(e)}>
        {!user ? (
          <div className="chat-panel__guest-fields">
            <label className="field">
              <span>Имя или ник</span>
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Как к тебе обращаться"
                maxLength={40}
                autoFocus
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Для ответа от поддержки"
                maxLength={120}
              />
            </label>
          </div>
        ) : null}

        <textarea
          className="chat-panel__new-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => onEnterToSend(e, () => void submit(), !canSend)}
          placeholder="Опиши проблему или вопрос… Enter — отправить"
          autoFocus={Boolean(user)}
        />
        <div className="chat-panel__toolbar chat-panel__toolbar--new">
          {user ? (
            <AttachmentInput attachments={attachments} onChange={setAttachments} disabled={loading} />
          ) : (
            <p className="muted chat-panel__guest-note">Файлы можно прикрепить после регистрации</p>
          )}
          <button type="submit" className="btn btn--primary" disabled={!canSend}>
            {loading ? 'Отправка...' : 'Начать диалог'}
          </button>
        </div>
      </form>
    </div>
  );
}
