import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell, useLayoutError } from '../components/Layout';
import { formatApiError } from '../utils/formatError';
import { useAuth } from '../context/AuthContext';
import type { ForumCategory, ForumTopic } from '../types/auth';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import type { Attachment } from '../../shared/attachments';
import {
  FORUM_CATEGORY_CONFIG,
  forumTopicPath,
  isForumMessengerCategory,
  isForumStaffOnlyCategory,
  type ForumCategorySlug,
} from '../../shared/forumConfig';
import { isStaff } from '../utils/roles';
import { FORM_LOADED_AT_FIELD } from '../../shared/botProtection';
import { useFormLoadedAt } from '../hooks/useBotFormFields';

import { formatSiteDate } from '../utils/formatDate';

export function ForumCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useLayoutError();
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const formLoadedAt = useFormLoadedAt();

  useEffect(() => {
    if (slug && isForumMessengerCategory(slug)) {
      navigate('/forum/general', { replace: true });
    }
  }, [slug, navigate]);

  const config = slug ? FORUM_CATEGORY_CONFIG[slug as ForumCategorySlug] : null;
  const staffOnly = slug ? isForumStaffOnlyCategory(slug) : false;
  const canCreate = user && (!staffOnly || isStaff(user.role));

  const load = () => {
    if (!slug || isForumMessengerCategory(slug)) return;
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
    if (!user || !slug) return;
    setSaving(true);
    try {
      const data = await api<{ topicId: number }>('/forum/topics', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: slug,
          title,
          content,
          attachmentIds: attachmentIds(attachments),
          [FORM_LOADED_AT_FIELD]: formLoadedAt,
        }),
      });
      navigate(forumTopicPath(slug, data.topicId));
    } catch (err) {
      showError(formatApiError(err, 'Ошибка'));
    } finally {
      setSaving(false);
    }
  };

  if (slug && isForumMessengerCategory(slug)) {
    return null;
  }

  return (
    <PageShell
      title={`${config?.icon ? `${config.icon} ` : ''}${category?.name ?? 'Категория'}`}
      subtitle={category?.description}
      backTo={{ to: '/forum', label: 'Форум' }}
      wide
    >
      <div className="forum-category-toolbar">
        {staffOnly && (
          <p className="forum-category-toolbar__note muted">
            Публиковать новости могут только модераторы и администраторы
          </p>
        )}
        {canCreate ? (
          <button
            type="button"
            className="btn btn--primary btn--small"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Отмена' : '+ Новая тема'}
          </button>
        ) : !user ? (
          <p className="muted">
            <Link to={`/login?next=${encodeURIComponent(`/forum/${slug}`)}`}>Войди</Link>, чтобы создать тему
          </p>
        ) : staffOnly ? (
          <p className="muted">Новости публикует команда сервера</p>
        ) : null}
      </div>

      {showForm && canCreate && (
        <form className="form card forum-new-topic" onSubmit={(e) => void handleCreate(e)}>
          <label className="field">
            <span>Заголовок</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
          </label>
          <label className="field">
            <span>Сообщение</span>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} />
          </label>
          <AttachmentInput attachments={attachments} onChange={setAttachments} />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || !title.trim() || (!content.trim() && attachments.length === 0)}
          >
            {saving ? 'Публикация…' : 'Опубликовать'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="muted">Загрузка...</p>
      ) : topics.length === 0 ? (
        <div className="card forum-category__empty">
          <p className="muted">Пока нет тем{canCreate ? ' — будь первым!' : ''}</p>
        </div>
      ) : (
        <div className="forum-topic-table card">
          <div className="forum-topic-table__head forum-topic-table__row">
            <span>Тема</span>
            <span>Автор</span>
            <span>Ответов</span>
            <span>Обновлено</span>
          </div>
          {topics.map((topic) => (
            <Link
              key={topic.id}
              to={forumTopicPath(slug!, topic.id)}
              className="forum-topic-table__row forum-topic-table__row--link"
            >
              <span className="forum-topic-table__title">
                {topic.pinned ? <span className="forum-topic-table__pin">📌</span> : null}
                {topic.locked ? <span className="forum-topic-table__pin">🔒</span> : null}
                {topic.title}
              </span>
              <span className="forum-topic-table__author">{topic.author}</span>
              <span className="forum-topic-table__stat">{Math.max(0, topic.post_count - 1)}</span>
              <span className="forum-topic-table__date">
                {formatSiteDate(topic.last_post_at ?? topic.created_at, { year: undefined })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
