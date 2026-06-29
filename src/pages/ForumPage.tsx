import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell } from '../components/Layout';
import type { ForumCategory } from '../types/auth';
import {
  FORUM_CATEGORY_CONFIG,
  forumCategoryPath,
  forumTopicPath,
  type ForumCategorySlug,
} from '../../shared/forumConfig';

import { formatSiteRelativeOrTime } from '../utils/formatDate';

export function ForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<ForumCategory[]>('/forum/categories')
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Форум" subtitle="Новости сервера, общение и обсуждения" wide>
      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : (
        <div className="forum-index card">
          <div className="forum-index__head forum-index__row forum-index__row--head">
            <span>Раздел</span>
            <span>Тем</span>
            <span>Сообщ.</span>
            <span>Последнее</span>
          </div>

          {categories.map((cat) => {
            const config = FORUM_CATEGORY_CONFIG[cat.slug as ForumCategorySlug];
            const icon = config?.icon ?? '📁';
            return (
              <div key={cat.id} className="forum-index__row">
                <div className="forum-index__category">
                  <Link to={forumCategoryPath(cat.slug)} className="forum-index__category-link">
                    <span className="forum-index__icon" aria-hidden="true">
                      {icon}
                    </span>
                    <span>
                      <strong>{cat.name}</strong>
                      <span className="forum-index__desc">{cat.description}</span>
                    </span>
                  </Link>
                </div>
                <span className="forum-index__stat">{cat.topic_count}</span>
                <span className="forum-index__stat">{cat.post_count ?? 0}</span>
                <div className="forum-index__last">
                  {cat.last_topic_id ? (
                    <>
                      <Link to={forumTopicPath(cat.slug, cat.last_topic_id)} className="forum-index__last-topic">
                        {cat.last_topic_title}
                      </Link>
                      <span className="forum-index__last-meta">
                        {cat.last_post_author ?? '—'} · {formatSiteRelativeOrTime(cat.last_post_at)}
                      </span>
                    </>
                  ) : (
                    <span className="muted">Нет тем</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
