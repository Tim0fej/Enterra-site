import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell, useLayoutError, useLayoutToast } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types/auth';
import { isAdmin } from '../utils/roles';
import { formatApiError } from '../utils/formatError';
import { ADMIN_GUIDE_TITLE } from '../../shared/staffGuide';
import { StaffModerationPanel } from '../components/StaffModerationPanel';
import { formatSiteDateTime } from '../utils/formatDate';

interface ModerTopic {
  id: number;
  title: string;
  author: string;
  pinned: number;
  locked: number;
  category_name: string;
  category_slug: string;
  post_count: number;
  updated_at: string;
}

interface ModerOverview {
  openTickets: Ticket[];
  recentTopics: ModerTopic[];
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  closed: 'Закрыт',
};

export function ModerPage() {
  const { user } = useAuth();
  const { showToast } = useLayoutToast();
  const { showError } = useLayoutError();
  const [data, setData] = useState<ModerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadFailed(false);
    void api<ModerOverview>('/admin/moder/overview')
      .then(setData)
      .catch((err) => {
        setData(null);
        setLoadFailed(true);
        showError(formatApiError(err, 'Ошибка загрузки'));
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleTopic = async (topicId: number, field: 'pinned' | 'locked', value: boolean) => {
    try {
      await api(`/forum/topics/${topicId}/${field === 'pinned' ? 'pin' : 'lock'}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      showToast(field === 'pinned' ? (value ? 'Тема закреплена' : 'Тема откреплена') : value ? 'Тема закрыта' : 'Тема открыта');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  const deleteTopic = async (topicId: number) => {
    if (!confirm('Удалить тему и все сообщения?')) return;
    try {
      await api(`/forum/topics/${topicId}`, { method: 'DELETE' });
      showToast('Тема удалена');
      load();
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    }
  };

  if (loading) {
    return (
      <PageShell title="Панель модератора">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  if (loadFailed || !data) {
    return (
      <PageShell title="Панель модератора">
        <div className="card empty-state">
          <p className="muted">Не удалось загрузить данные</p>
          <button type="button" className="btn btn--primary btn--small" onClick={load}>
            Повторить
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Панель модератора" subtitle="Тикеты, форум, покупки и наказания на сервере" wide>
      <div className="staff-nav">
        <Link to="/staff-guide" className="link-btn">{ADMIN_GUIDE_TITLE}</Link>
        {user && isAdmin(user.role) && (
          <Link to="/admin" className="link-btn">← Админ-панель</Link>
        )}
      </div>

      <section className="staff-section">
        <h2 className="staff-section__title">Открытые тикеты</h2>
        {data.openTickets.length ? (
          <div className="ticket-list">
            {data.openTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="ticket-item card">
                <div>
                  <h3>
                    #{ticket.id} — {ticket.title}
                  </h3>
                  <p className="topic-meta">
                    {ticket.author}
                    {ticket.assignee ? ` · ${ticket.assignee}` : ' · свободный'}
                    {' · '}
                    {formatSiteDateTime(ticket.updated_at)}
                  </p>
                </div>
                <span className={`badge badge--${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <p>Нет открытых тикетов</p>
          </div>
        )}
      </section>

      <section className="staff-section">
        <h2 className="staff-section__title">Последние темы форума</h2>
        {data.recentTopics.length ? (
          <div className="moder-topic-list">
            {data.recentTopics.map((topic) => (
              <div key={topic.id} className="card moder-topic">
                <div className="moder-topic__info">
                  <Link to={`/forum/topic/${topic.id}`} className="moder-topic__title">
                    {topic.pinned ? '📌 ' : ''}
                    {topic.locked ? '🔒 ' : ''}
                    {topic.title}
                  </Link>
                  <p className="topic-meta">
                    {topic.category_name} · {topic.author} · {topic.post_count} сообщ. ·{' '}
                    {formatSiteDateTime(topic.updated_at)}
                  </p>
                </div>
                <div className="moder-topic__actions">
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => void toggleTopic(topic.id, 'pinned', !topic.pinned)}
                  >
                    {topic.pinned ? 'Открепить' : 'Закрепить'}
                  </button>
                  <span className="moder-topic__sep">·</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => void toggleTopic(topic.id, 'locked', !topic.locked)}
                  >
                    {topic.locked ? 'Открыть' : 'Закрыть'}
                  </button>
                  <span className="moder-topic__sep">·</span>
                  <button
                    type="button"
                    className="link-btn link-btn--danger"
                    onClick={() => void deleteTopic(topic.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card empty-state">
            <p>Тем пока нет</p>
          </div>
        )}
      </section>

      <StaffModerationPanel />
    </PageShell>
  );
}