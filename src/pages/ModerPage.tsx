import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { useLayoutToast } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { Ticket } from '../types/auth';
import { isAdmin } from '../utils/roles';

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
  const [data, setData] = useState<ModerOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    void api<ModerOverview>('/admin/moder/overview')
      .then(setData)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Ошибка загрузки');
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
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const deleteTopic = async (topicId: number) => {
    if (!confirm('Удалить тему и все сообщения?')) return;
    try {
      await api(`/forum/topics/${topicId}`, { method: 'DELETE' });
      showToast('Тема удалена');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  if (loading) {
    return (
      <PageShell title="Панель модератора">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Панель модератора">
        <div className="alert alert--error">{error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Панель модератора" subtitle="Тикеты и модерация форума">
      {user && isAdmin(user.role) && (
        <div className="staff-nav">
          <Link to="/admin" className="link-btn">← Админ-панель</Link>
        </div>
      )}

      <section className="staff-section">
        <h2 className="staff-section__title">Открытые тикеты</h2>
        {!data?.openTickets.length ? (
          <div className="card empty-state">
            <p>Нет открытых тикетов</p>
          </div>
        ) : (
          <div className="ticket-list">
            {data.openTickets.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="ticket-item card">
                <div>
                  <h3>#{ticket.id} — {ticket.title}</h3>
                  <p className="topic-meta">
                    {ticket.author} · {new Date(ticket.updated_at).toLocaleString('ru')}
                  </p>
                </div>
                <span className={`badge badge--${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="staff-section">
        <h2 className="staff-section__title">Последние темы форума</h2>
        {!data?.recentTopics.length ? (
          <div className="card empty-state">
            <p>Тем пока нет</p>
          </div>
        ) : (
          <div className="moder-topic-list">
            {data.recentTopics.map((topic) => (
              <div key={topic.id} className="card moder-topic">
                <div className="moder-topic__info">
                  <Link to={`/forum/topic/${topic.id}`} className="moder-topic__title">
                    {topic.pinned ? '📌 ' : ''}{topic.locked ? '🔒 ' : ''}{topic.title}
                  </Link>
                  <p className="topic-meta">
                    {topic.category_name} · {topic.author} · {topic.post_count} сообщ. · {new Date(topic.updated_at).toLocaleString('ru')}
                  </p>
                </div>
                <div className="moder-topic__actions">
                  <button type="button" className="link-btn" onClick={() => void toggleTopic(topic.id, 'pinned', !topic.pinned)}>
                    {topic.pinned ? 'Открепить' : 'Закрепить'}
                  </button>
                  <span className="moder-topic__sep">·</span>
                  <button type="button" className="link-btn" onClick={() => void toggleTopic(topic.id, 'locked', !topic.locked)}>
                    {topic.locked ? 'Открыть' : 'Закрыть'}
                  </button>
                  <span className="moder-topic__sep">·</span>
                  <button type="button" className="link-btn link-btn--danger" onClick={() => void deleteTopic(topic.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
