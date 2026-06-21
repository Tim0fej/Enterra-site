import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { ForumCategory, ForumTopic } from '../types/auth';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import type { Attachment } from '../../shared/attachments';

export function ForumCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    if (!slug) return;
    setLoading(true);
    void api<{ category: ForumCategory; topics: ForumTopic[] }>(`/forum/categories/${slug}/topics`)
      .then((data) => {
        setCategory(data.category);
        setTopics(data.topics);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [slug]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    try {
      const data = await api<{ topicId: number }>('/forum/topics', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: slug,
          title,
          content,
          attachmentIds: attachmentIds(attachments),
        }),
      });
      navigate(`/forum/topic/${data.topicId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  return (
    <PageShell
      title={category?.name ?? 'Категория'}
      subtitle={category?.description}
      backTo={{ to: '/forum', label: 'Форум' }}
    >
      {user ? (
        <button type="button" className="btn btn--primary btn--small section-action" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новая тема'}
        </button>
      ) : (
        <p className="muted section-action">
          <Link to="/login">Войди</Link>, чтобы создать тему
        </p>
      )}

      {showForm && user && (
        <form className="form card" onSubmit={(e) => void handleCreate(e)}>
          {error && <div className="alert alert--error">{error}</div>}
          <label className="field">
            <span>Заголовок</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="field">
            <span>Сообщение</span>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
          </label>
          <AttachmentInput attachments={attachments} onChange={setAttachments} />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!title.trim() || (!content.trim() && attachments.length === 0)}
          >
            Опубликовать
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : topics.length === 0 ? (
        <p className="muted">Пока нет тем. Будь первым!</p>
      ) : (
        <div className="topic-list">
          {topics.map((topic) => (
            <Link key={topic.id} to={`/forum/topic/${topic.id}`} className="topic-item card">
              <div>
                <h3>
                  {topic.pinned ? '📌 ' : ''}
                  {topic.locked ? '🔒 ' : ''}
                  {topic.title}
                </h3>
                <p className="topic-meta">
                  {topic.author} · {topic.post_count} сообщ. · {new Date(topic.created_at).toLocaleDateString('ru')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
