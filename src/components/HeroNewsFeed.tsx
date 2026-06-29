import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { forumCategoryPath, forumTopicPath } from '../../shared/forumConfig';
import { SERVER_DAILY_RESTART_SHORT } from '../../shared/serverSchedule';
import type { ForumTopic } from '../types/auth';
import { formatSiteRelativeOrTime } from '../utils/formatDate';

const NEWS_LIMIT = 3;

function preview(text: string | null | undefined, max = 52) {
  if (!text) return null;
  const oneLine = text.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  if (!oneLine) return null;
  return oneLine.length > max ? `${oneLine.slice(0, max)}…` : oneLine;
}

function NewsSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <li key={i} className="hero-news__skeleton" aria-hidden="true" />
      ))}
    </>
  );
}

export function HeroNewsFeed() {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<{ topics: ForumTopic[] }>('/forum/categories/news/topics')
      .then((data) => setTopics(data.topics.slice(0, NEWS_LIMIT)))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <aside className="hero-news" aria-label="Последние новости">
      <div className="hero-news__head">
        <h2 className="hero-news__title">
          <span className="hero-news__title-icon" aria-hidden>
            📢
          </span>
          Новости
        </h2>
        <Link to={forumCategoryPath('news')} className="hero-news__all">
          Все
        </Link>
      </div>

      <ul className="hero-news__list">
        {loading ? (
          <NewsSkeleton />
        ) : topics.length === 0 ? (
          <li className="hero-news__empty-wrap">
            <p className="hero-news__empty muted">Пока нет публикаций</p>
          </li>
        ) : (
          topics.map((topic) => {
            const excerpt = preview(topic.last_message);
            const when = formatSiteRelativeOrTime(topic.last_post_at ?? topic.created_at);

            return (
              <li key={topic.id}>
                <Link to={forumTopicPath('news', topic.id)} className="hero-news__item">
                  <span className="hero-news__dot" aria-hidden />
                  <span className="hero-news__content">
                    <span className="hero-news__item-title">{topic.title}</span>
                    {excerpt ? <span className="hero-news__item-excerpt">{excerpt}</span> : null}
                    <span className="hero-news__item-meta">{when}</span>
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <p className="hero-news__footnote muted">{SERVER_DAILY_RESTART_SHORT}</p>
    </aside>
  );
}
