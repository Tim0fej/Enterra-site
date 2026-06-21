import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types/auth';
import { isStaff } from '../utils/roles';

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  closed: 'Закрыт',
};

const TYPE_LABELS: Record<Ticket['type'], string> = {
  general: 'Поддержка',
  support: 'Донат',
  media: 'YouTube / Twitch / TikTok',
};

function preview(text: string | null | undefined, max = 34) {
  if (!text) return 'Нет сообщений';
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export function TicketMessengerLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const staff = user && isStaff(user.role);

  const activeId = location.pathname.match(/^\/tickets\/(\d+)/)?.[1];
  const isChatOpen = Boolean(activeId) || location.pathname === '/tickets/new';

  const loadTickets = () => {
    void api<Ticket[]>('/tickets')
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(loadTickets, [location.pathname]);

  return (
    <div className="messenger-page">
      <div className="messenger-page__head container">
        <div>
          <h1 className="messenger-page__title">Поддержка</h1>
          <p className="muted">
            {staff ? 'Все диалоги с игроками' : 'Только твои обращения — другие пользователи их не видят'}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn--primary btn--small">
          + Новый диалог
        </Link>
      </div>

      <div className={`container messenger${isChatOpen ? ' messenger--chat-open' : ''}`}>
        <aside className="messenger__sidebar">
          {loading ? (
            <p className="muted messenger__empty">Загрузка...</p>
          ) : tickets.length === 0 ? (
            <div className="messenger__empty card">
              <p>Диалогов пока нет</p>
              <button type="button" className="btn btn--primary btn--small" onClick={() => navigate('/tickets/new')}>
                Написать
              </button>
            </div>
          ) : (
            <ul className="messenger__list">
              {tickets.map((ticket) => {
                const active = activeId === String(ticket.id);
                return (
                  <li key={ticket.id}>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className={`messenger__item${active ? ' messenger__item--active' : ''}`}
                    >
                      <div className="messenger__item-top">
                        <strong>{staff && ticket.author ? ticket.author : ticket.title}</strong>
                        <time>{new Date(ticket.updated_at).toLocaleDateString('ru')}</time>
                      </div>
                      {staff && (
                        <span className="messenger__item-sub">{ticket.title}</span>
                      )}
                      <div className="messenger__item-bottom">
                        <p className="messenger__item-preview">{preview(ticket.last_message)}</p>
                        <div className="messenger__item-badges">
                          <span className={`badge badge--${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
                          {ticket.type !== 'general' && (
                            <span className="badge badge--type">{TYPE_LABELS[ticket.type]}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="messenger__main">
          <Outlet context={{ reloadTickets: loadTickets }} />
        </main>
      </div>
    </div>
  );
}

export function TicketChatPlaceholder() {
  return (
    <div className="messenger__placeholder card">
      <p>Выбери диалог слева или создай новое обращение</p>
      <Link to="/tickets/new" className="btn btn--primary">
        Написать в поддержку
      </Link>
    </div>
  );
}
