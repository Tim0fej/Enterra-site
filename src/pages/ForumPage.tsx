import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell } from '../components/Layout';
import type { ForumCategory } from '../types/auth';

export function ForumPage() {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api<ForumCategory[]>('/forum/categories')
      .then(setCategories)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Форум" subtitle="Обсуждения, новости и помощь сообщества" wide>
      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : (
        <div className="forum-categories">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/forum/${cat.slug}`} className="forum-category card">
              <div>
                <h3>{cat.name}</h3>
                <p>{cat.description}</p>
              </div>
              <span className="badge">{cat.topic_count} тем</span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
