import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLayoutError } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types/auth';
import { isStaff } from '../utils/roles';
import { formatApiError } from '../utils/formatError';
import { formatSiteRelativeTime } from '../utils/formatDate';
import { usePolling } from '../hooks/usePolling';
import { TICKET_INACTIVITY_HINT } from '../../shared/ticketConfig';

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  closed: 'Закрыт',
};

const TYPE_LABELS: Record<Ticket['type'], string> = {
  general: 'Поддержка',
  support: 'Донат',
  media: 'YouTube / Twitch / TikTok',
  vip: 'VIP',
};

function preview(text: string | null | undefined, max = 34) {
  if (!text) return 'Нет сообщений';
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export function TicketMessengerLayout() {
  const { user } = useAuth();
  const { showError } = useLayoutError();
  const location = useLocation();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const staff = user && isStaff(user.role);

  const activeId = location.pathname.match(/^\/tickets\/(\d+)/)?.[1];
  const isChatOpen = Boolean(activeId) || location.pathname === '/tickets/new';

  const loadTickets = useCallback(() => {
    setLoadFailed(false);
    void api<Ticket[]>('/tickets')
      .then(setTickets)
      .catch((err) => {
        setTickets([]);
        setLoadFailed(true);
        showError(formatApiError(err, 'Не удалось загрузить диалоги'));
      })
      .finally(() => setLoading(false));
  }, [showError]);

  const loadTicketsSilent = useCallback(() => {
    void api<Ticket[]>('/tickets')
      .then(setTickets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  usePolling(loadTicketsSilent, 8_000);

  return (
    <div className="messenger-page">
      <div className="messenger-page__head container">
        <div>
          <h1 className="messenger-page__title">Поддержка</h1>
          <p className="muted messenger-page__subtitle">
            {staff
              ? 'Новые обращения и диалоги, закреплённые за вами'
              : user
                ? 'Только твои обращения — другие пользователи их не видят'
                : 'Без регистрации — диалог сохранится в этом браузере. Не очищай cookies и не теряй вкладку'}
            {' · '}
            {TICKET_INACTIVITY_HINT}
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
          ) : loadFailed ? (
            <div className="messenger__empty card">
              <p className="muted">Не удалось загрузить список</p>
              <button type="button" className="btn btn--ghost btn--small" onClick={loadTickets}>
                Повторить
              </button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="messenger__empty card">
              <p>{user ? 'Диалогов пока нет' : 'Напиши в поддержку — регистрация не нужна'}</p>
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
                    <div className={`messenger__item-shell${active ? ' messenger__item-shell--active' : ''}`}>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className={`messenger__item${active ? ' messenger__item--active' : ''}`}
                      >
                        <div className="messenger__item-top">
                          <strong>{staff && ticket.author ? ticket.author : ticket.title}</strong>
                          <time dateTime={ticket.updated_at}>{formatSiteRelativeTime(ticket.updated_at)}</time>
                        </div>
                        {staff && (
                          <span className="messenger__item-sub">{ticket.title}</span>
                        )}
                        <div className="messenger__item-bottom">
                          <p className="messenger__item-preview">{preview(ticket.last_message)}</p>
                          <div className="messenger__item-badges">
                            {staff && (
                              <span className={`badge badge--assign${ticket.assigned_to ? '' : ' badge--assign-free'}`}>
                                {ticket.assigned_to
                                  ? ticket.assigned_to === user?.id
                                    ? 'Ваш'
                                    : ticket.assignee ?? 'Занят'
                                  : 'Свободный'}
                              </span>
                            )}
                            <span className={`badge badge--${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
                            {ticket.type !== 'general' && (
                              <span className="badge badge--type">{TYPE_LABELS[ticket.type]}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
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
