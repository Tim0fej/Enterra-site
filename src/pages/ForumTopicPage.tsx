import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { ForumPost } from '../types/auth';
import { isStaff, roleBadgeClass, ROLE_LABELS } from '../utils/roles';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import { MessageAttachments } from '../components/MessageAttachments';
import type { Attachment } from '../../shared/attachments';

interface TopicData {
  id: number;
  title: string;
  author: string;
  pinned: number;
  locked: number;
  category_slug: string;
  category_name: string;
}

export function ForumTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) return;
    void api<{ topic: TopicData; posts: ForumPost[] }>(`/forum/topics/${id}`)
      .then((data) => {
        setTopic(data.topic);
        setPosts(data.posts);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    setError('');
    try {
      await api(`/forum/topics/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: reply,
          attachmentIds: attachmentIds(replyAttachments),
        }),
      });
      setReply('');
      setReplyAttachments([]);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const toggleTopic = async (field: 'pinned' | 'locked') => {
    if (!id || !topic) return;
    const value = field === 'pinned' ? !topic.pinned : !topic.locked;
    try {
      await api(`/forum/topics/${id}/${field === 'pinned' ? 'pin' : 'lock'}`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: value }),
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Удалить сообщение?')) return;
    try {
      await api(`/forum/posts/${postId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка');
    }
  };

  if (loading) {
    return (
      <PageShell title="Тема">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  if (!topic) {
    return (
      <PageShell title="Тема не найдена" backTo={{ to: '/forum', label: 'Форум' }} />
    );
  }

  const staff = user && isStaff(user.role);
  const canReply = user && (!topic.locked || staff);

  return (
    <PageShell
      title={topic.title}
      subtitle={`${topic.category_name} · автор: ${topic.author}`}
      backTo={{ to: `/forum/${topic.category_slug}`, label: topic.category_name }}
    >
      {staff && (
        <p className="page-toolbar">
          <button type="button" className="link-btn" onClick={() => void toggleTopic('pinned')}>
            {topic.pinned ? 'Открепить' : 'Закрепить'}
          </button>
          <span className="moder-topic__sep"> · </span>
          <button type="button" className="link-btn" onClick={() => void toggleTopic('locked')}>
            {topic.locked ? 'Открыть' : 'Закрыть'}
          </button>
        </p>
      )}

      <div className="post-list">
        {posts.map((post, i) => (
          <article key={post.id} className="post card">
            <header className="post__header">
              <strong className={isStaff(post.role) ? 'admin-name' : ''}>
                {post.author}
                {post.role !== 'user' && (
                  <span className={roleBadgeClass(post.role)}>{ROLE_LABELS[post.role]}</span>
                )}
              </strong>
              <div className="post__header-actions">
                <time>{new Date(post.created_at).toLocaleString('ru')}</time>
                {staff && i > 0 && (
                  <button type="button" className="link-btn link-btn--danger" onClick={() => void deletePost(post.id)}>
                    удалить
                  </button>
                )}
              </div>
            </header>
            <div className="post__content">
              {post.content ? <p>{post.content}</p> : null}
              <MessageAttachments attachments={post.attachments} />
            </div>
            {i === 0 && topic.locked ? <p className="muted">🔒 Тема закрыта</p> : null}
          </article>
        ))}
      </div>

      {canReply ? (
        <form className="form card" onSubmit={(e) => void handleReply(e)}>
          {error && <div className="alert alert--error">{error}</div>}
          <label className="field">
            <span>Ответ</span>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
          </label>
          <AttachmentInput
            attachments={replyAttachments}
            onChange={setReplyAttachments}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!reply.trim() && replyAttachments.length === 0}
          >
            Ответить
          </button>
        </form>
      ) : !user ? (
        <p className="muted">
          <Link to="/login">Войди</Link>, чтобы ответить
        </p>
      ) : topic.locked ? (
        <p className="muted">🔒 Тема закрыта для ответов</p>
      ) : null}
    </PageShell>
  );
}
