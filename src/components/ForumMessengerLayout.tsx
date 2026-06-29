import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useLayoutError } from './Layout';
import { useAuth } from '../context/AuthContext';
import { formatSiteRelativeTime } from '../utils/formatDate';
import { usePolling } from '../hooks/usePolling';
import type { ForumCategory, ForumTopic } from '../types/auth';

function preview(text: string | null | undefined, max = 40) {
  if (!text) return 'Нет сообщений';
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

export function ForumMessengerLayout() {
  const { user } = useAuth();
  const { showApiError } = useLayoutError();
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const activeId = location.pathname.match(/^\/forum\/general\/topic\/(\d+)/)?.[1];
  const isChatOpen = Boolean(activeId) || location.pathname === '/forum/general/new';

  const loadTopics = useCallback(() => {
    setLoading(true);
    void api<{ category: ForumCategory; topics: ForumTopic[] }>('/forum/categories/general/topics')
      .then((data) => {
        setCategory(data.category);
        setTopics(data.topics);
      })
      .catch((err) => showApiError(err, 'Не удалось загрузить темы'))
      .finally(() => setLoading(false));
  }, [showApiError]);

  const loadTopicsSilent = useCallback(() => {
    void api<{ category: ForumCategory; topics: ForumTopic[] }>('/forum/categories/general/topics')
      .then((data) => {
        setCategory(data.category);
        setTopics(data.topics);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  usePolling(loadTopicsSilent, 8_000);

  return (
    <div className="messenger-page forum-messenger-page">
      <div className="messenger-page__head container">
        <div>
          <Link to="/forum" className="forum-back-link">
            ← Форум
          </Link>
          <h1 className="messenger-page__title">💬 {category?.name ?? 'Общение'}</h1>
          <p className="muted messenger-page__subtitle">
            {category?.description ?? 'Обсуждения, вопросы и знакомства'}
          </p>
        </div>
        {user ? (
          <Link to="/forum/general/new" className="btn btn--primary btn--small">
            + Новая тема
          </Link>
        ) : (
          <Link to="/login?next=%2Fforum%2Fgeneral" className="btn btn--ghost btn--small">
            Войти
          </Link>
        )}
      </div>

      <div className={`container messenger${isChatOpen ? ' messenger--chat-open' : ''}`}>
        <aside className="messenger__sidebar">
          {loading ? (
            <p className="muted messenger__empty">Загрузка...</p>
          ) : topics.length === 0 ? (
            <div className="messenger__empty card">
              <p>Тем пока нет</p>
              {user ? (
                <button type="button" className="btn btn--primary btn--small" onClick={() => navigate('/forum/general/new')}>
                  Начать обсуждение
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="messenger__list">
              {topics.map((topic) => {
                const active = activeId === String(topic.id);
                return (
                  <li key={topic.id}>
                    <div className={`messenger__item-shell${active ? ' messenger__item-shell--active' : ''}`}>
                      <Link
                        to={`/forum/general/topic/${topic.id}`}
                        className={`messenger__item${active ? ' messenger__item--active' : ''}`}
                      >
                        <div className="messenger__item-top">
                          <strong>
                            {topic.pinned ? '📌 ' : ''}
                            {topic.locked ? '🔒 ' : ''}
                            {topic.title}
                          </strong>
                          <time dateTime={topic.last_post_at ?? topic.created_at}>
                            {formatSiteRelativeTime(topic.last_post_at ?? topic.created_at)}
                          </time>
                        </div>
                        <span className="messenger__item-sub">
                          {topic.last_author ?? topic.author} · {topic.post_count} сообщ.
                        </span>
                        <div className="messenger__item-bottom">
                          <p className="messenger__item-preview">{preview(topic.last_message)}</p>
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
          <Outlet context={{ reloadTopics: loadTopics, categorySlug: 'general', showApiError }} />
        </main>
      </div>
    </div>
  );
}

export function ForumChatPlaceholder() {
  return (
    <div className="messenger__placeholder card">
      <p>Выбери тему слева или создай новую</p>
      <Link to="/forum/general/new" className="btn btn--primary">
        Новая тема
      </Link>
    </div>
  );
}

export interface ForumOutletContext {
  reloadTopics: () => void;
  categorySlug: string;
  showApiError: (err: unknown, fallback: string) => void;
}
