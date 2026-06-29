import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { PageShell, type LayoutContext } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { ForumPost } from '../types/auth';
import { isStaff } from '../utils/roles';
import { SiteRoleBadge } from '../components/GroupBadge';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import { MessageAttachments } from '../components/MessageAttachments';
import type { Attachment } from '../../shared/attachments';
import { onEnterToSend, scrollChatToBottom } from '../utils/chatComposer';
import { ChatSendIcon } from '../components/ChatSendIcon';
import type { ForumOutletContext } from '../components/ForumMessengerLayout';
import { forumCategoryPath, isForumMessengerCategory } from '../../shared/forumConfig';
import { FORM_LOADED_AT_FIELD } from '../../shared/botProtection';
import { useFormLoadedAt } from '../hooks/useBotFormFields';
import { usePolling } from '../hooks/usePolling';
import { FormattedMessage } from '../components/FormattedMessage';
import { ForumPostEditForm } from '../components/ForumPostEditForm';
import { formatSiteDateTime } from '../utils/formatDate';

interface TopicData {
  id: number;
  title: string;
  author: string;
  pinned: number;
  locked: number;
  category_slug: string;
  category_name: string;
}

function authorInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function formatPostTime(value: string): string {
  return formatSiteDateTime(value, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ForumTopicPage({ chatMode = false }: { chatMode?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ctx = useOutletContext<Partial<LayoutContext & ForumOutletContext>>();
  const reportError = (err: unknown, fallback: string) => {
    ctx.showApiError?.(err, fallback);
  };
  const [topic, setTopic] = useState<TopicData | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [reply, setReply] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const formLoadedAt = useFormLoadedAt();

  const load = useCallback((silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    void api<{ topic: TopicData; posts: ForumPost[] }>(`/forum/topics/${id}`)
      .then((data) => {
        if (!chatMode && isForumMessengerCategory(data.topic.category_slug)) {
          navigate(`/forum/general/topic/${data.topic.id}`, { replace: true });
          return;
        }
        setTopic(data.topic);
        setPosts((prev) => {
          if (
            silent &&
            prev.length === data.posts.length &&
            prev[prev.length - 1]?.id === data.posts[data.posts.length - 1]?.id
          ) {
            return prev;
          }
          return data.posts;
        });
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [id, chatMode, navigate]);

  useEffect(() => {
    load(false);
  }, [load]);

  usePolling(() => load(true), 5_000, Boolean(id));

  useEffect(() => {
    if (chatMode) {
      scrollChatToBottom(messagesRef.current);
    }
  }, [posts, chatMode]);

  const submitReply = async () => {
    if (!user || !id) return;
    if (chatMode) {
      if (!reply.trim() && replyAttachments.length === 0) return;
    } else if (!reply.trim()) {
      return;
    }
    setSending(true);
    try {
      await api(`/forum/topics/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: reply,
          [FORM_LOADED_AT_FIELD]: formLoadedAt,
          ...(chatMode ? { attachmentIds: attachmentIds(replyAttachments) } : {}),
        }),
      });
      setReply('');
      setReplyAttachments([]);
      load();
      if (chatMode) ctx.reloadTopics?.();
    } catch (err) {
      reportError(err, 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitReply();
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
      if (chatMode) ctx.reloadTopics?.();
    } catch (err) {
      reportError(err, 'Не удалось изменить тему');
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm('Удалить сообщение?')) return;
    try {
      await api(`/forum/posts/${postId}`, { method: 'DELETE' });
      load();
      if (chatMode) ctx.reloadTopics?.();
    } catch (err) {
      reportError(err, 'Не удалось удалить сообщение');
    }
  };

  const deleteTopic = async () => {
    if (!id || !confirm('Удалить тему целиком?')) return;
    try {
      await api(`/forum/topics/${id}`, { method: 'DELETE' });
      if (chatMode) ctx.reloadTopics?.();
      navigate(topic ? forumCategoryPath(topic.category_slug) : '/forum');
    } catch (err) {
      reportError(err, 'Не удалось удалить тему');
    }
  };

  const canEditPost = (post: ForumPost) =>
    Boolean(user && (isStaff(user.role) || user.username.toLowerCase() === post.author.toLowerCase()));

  const canEditTopicTitle = () =>
    Boolean(user && topic && (isStaff(user.role) || user.username.toLowerCase() === topic.author.toLowerCase()));

  const savePostEdit = async (postId: number, content: string, title?: string, isOp = false) => {
    if (!id) return;
    setEditSaving(true);
    try {
      await api(`/forum/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      });
      if (isOp && title && title !== topic?.title) {
        await api(`/forum/topics/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ title }),
        });
      }
      setEditingPostId(null);
      load();
      if (chatMode) ctx.reloadTopics?.();
    } catch (err) {
      reportError(err, 'Не удалось сохранить изменения');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
    if (chatMode) {
      return <p className="muted messenger__empty">Загрузка...</p>;
    }
    return (
      <PageShell title="Тема">
        <p className="muted">Загрузка...</p>
      </PageShell>
    );
  }

  if (!topic) {
    if (chatMode) {
      return (
        <div className="messenger__placeholder card">
          <p>Тема не найдена</p>
          <Link to="/forum/general" className="btn btn--ghost">
            К списку
          </Link>
        </div>
      );
    }
    return <PageShell title="Тема не найдена" backTo={{ to: '/forum', label: 'Форум' }} />;
  }

  const staff = user && isStaff(user.role);
  const canReply = user && (!topic.locked || staff);

  if (chatMode) {
    return (
      <div className="chat-panel card">
        <header className="chat-panel__header">
          <Link to="/forum/general" className="chat-panel__back">
            ← Темы
          </Link>
          <div className="chat-panel__header-main">
            <h2>
              {topic.pinned ? '📌 ' : ''}
              {topic.locked ? '🔒 ' : ''}
              {topic.title}
            </h2>
            <p className="chat-panel__meta muted">
              {topic.author} · {posts.length} сообщ.
            </p>
          </div>
          {staff && (
            <div className="chat-panel__staff-bar">
              <button type="button" className="link-btn" onClick={() => void toggleTopic('pinned')}>
                {topic.pinned ? 'Открепить' : 'Закрепить'}
              </button>
              <button type="button" className="link-btn" onClick={() => void toggleTopic('locked')}>
                {topic.locked ? 'Открыть' : 'Закрыть'}
              </button>
              <button type="button" className="link-btn link-btn--danger" onClick={() => void deleteTopic()}>
                Удалить
              </button>
            </div>
          )}
        </header>

        <div className="chat-panel__messages" ref={messagesRef}>
          {posts.map((post) => {
            const mine = user?.username === post.author;
            const staffPost = isStaff(post.role);
            const editing = editingPostId === post.id;
            return (
              <article
                key={post.id}
                className={`chat-bubble${mine ? ' chat-bubble--mine' : staffPost ? ' chat-bubble--staff' : ' chat-bubble--other'}`}
              >
                <div className="chat-bubble__meta">
                  <span className="chat-bubble__author">
                    <strong className={staffPost ? 'admin-name' : ''}>{post.author}</strong>
                    <SiteRoleBadge role={post.role} size="md" className="group-badge--inline" />
                  </span>
                  <time>{formatPostTime(post.created_at)}</time>
                  {canEditPost(post) && !editing ? (
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setEditingPostId(post.id)}
                    >
                      Изм.
                    </button>
                  ) : null}
                  {staff && !mine && !editing ? (
                    <button type="button" className="link-btn link-btn--danger" onClick={() => void deletePost(post.id)}>
                      ×
                    </button>
                  ) : null}
                </div>
                <div className="chat-bubble__text">
                  {editing ? (
                    <ForumPostEditForm
                      initialContent={post.content}
                      saving={editSaving}
                      onCancel={() => setEditingPostId(null)}
                      onSave={(content) => savePostEdit(post.id, content)}
                    />
                  ) : (
                    <>
                      {post.content ? <FormattedMessage text={post.content} className="chat-bubble__formatted" /> : null}
                      <MessageAttachments attachments={post.attachments} />
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {canReply ? (
          <form className="chat-panel__composer" onSubmit={(e) => void handleReply(e)}>
            <div className="chat-panel__input-row">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Напиши сообщение… Enter — отправить"
                onKeyDown={(e) => onEnterToSend(e, () => void submitReply(), sending)}
              />
              <button
                type="submit"
                className="btn btn--primary chat-panel__send"
                disabled={sending || (!reply.trim() && replyAttachments.length === 0)}
                aria-label="Отправить"
              >
                {sending ? '…' : <ChatSendIcon />}
              </button>
            </div>
            <div className="chat-panel__toolbar">
              <AttachmentInput attachments={replyAttachments} onChange={setReplyAttachments} />
            </div>
          </form>
        ) : !user ? (
          <p className="chat-panel__closed muted">
            <Link to={`/login?next=${encodeURIComponent(location.pathname)}`}>Войди</Link>, чтобы ответить
          </p>
        ) : (
          <p className="chat-panel__closed muted">🔒 Тема закрыта для ответов</p>
        )}
      </div>
    );
  }

  const opPost = posts[0];
  const comments = posts.slice(1);

  const renderPost = (post: ForumPost, index: number) => {
    const staffPost = isStaff(post.role);
    const isOp = index === 0;
    const editing = editingPostId === post.id;
    return (
      <article
        key={post.id}
        className={`forum-post card${staffPost ? ' forum-post--staff' : ''}${isOp ? ' forum-post--op' : ''}`}
      >
        <aside className="forum-post__side">
          <div className="forum-post__avatar" aria-hidden="true">
            {authorInitial(post.author)}
          </div>
          <strong className={`forum-post__name${staffPost ? ' admin-name' : ''}`}>{post.author}</strong>
          <SiteRoleBadge role={post.role} size="md" className="group-badge--inline" />
          {isOp && topic.pinned ? <span className="forum-post__tag">📌 Закреплено</span> : null}
          {isOp && topic.locked ? <span className="forum-post__tag">🔒 Закрыто</span> : null}
        </aside>
        <div className="forum-post__body">
          <header className="forum-post__head">
            <time>{formatPostTime(post.created_at)}</time>
            <div className="forum-post__head-actions">
              {canEditPost(post) && !editing ? (
                <button type="button" className="link-btn" onClick={() => setEditingPostId(post.id)}>
                  Редактировать
                </button>
              ) : null}
              {staff && !isOp && !editing ? (
                <button type="button" className="link-btn link-btn--danger" onClick={() => void deletePost(post.id)}>
                  Удалить
                </button>
              ) : null}
            </div>
          </header>
          <div className="forum-post__content">
            {editing ? (
              <ForumPostEditForm
                initialContent={post.content}
                initialTitle={isOp ? topic.title : undefined}
                showTitle={isOp && canEditTopicTitle()}
                saving={editSaving}
                onCancel={() => setEditingPostId(null)}
                onSave={(content, title) => savePostEdit(post.id, content, title, isOp)}
              />
            ) : (
              <>
                {post.content ? <FormattedMessage text={post.content} /> : null}
                <MessageAttachments attachments={post.attachments} />
              </>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <PageShell
      title={topic.title}
      subtitle={`${topic.category_name} · ${posts.length} сообщ.`}
      backTo={{ to: forumCategoryPath(topic.category_slug), label: topic.category_name }}
      wide
    >
      {staff && (
        <div className="forum-topic-toolbar">
          <button type="button" className="link-btn" onClick={() => void toggleTopic('pinned')}>
            {topic.pinned ? 'Открепить' : 'Закрепить'}
          </button>
          <span className="moder-topic__sep">·</span>
          <button type="button" className="link-btn" onClick={() => void toggleTopic('locked')}>
            {topic.locked ? 'Открыть' : 'Закрыть'}
          </button>
          <span className="moder-topic__sep">·</span>
          <button type="button" className="link-btn link-btn--danger" onClick={() => void deleteTopic()}>
            Удалить тему
          </button>
        </div>
      )}

      {opPost ? renderPost(opPost, 0) : null}

      <section className="forum-comments" aria-labelledby="forum-comments-title">
        <h2 id="forum-comments-title" className="forum-comments__title">
          Комментарии{comments.length > 0 ? ` · ${comments.length}` : ''}
        </h2>
        {comments.length === 0 ? (
          <p className="forum-comments__empty muted">Пока нет комментариев — будь первым</p>
        ) : (
          <div className="forum-comments__list">{comments.map((post, index) => renderPost(post, index + 1))}</div>
        )}
      </section>

      {canReply ? (
        <form className="forum-reply card" onSubmit={(e) => void handleReply(e)}>
          {user ? (
            <div className="forum-reply__author">
              <div className="forum-post__avatar forum-reply__avatar" aria-hidden="true">
                {authorInitial(user.username)}
              </div>
              <span className="forum-reply__name">{user.username}</span>
              <SiteRoleBadge role={user.role} size="md" className="group-badge--inline" />
            </div>
          ) : null}
          <div className="forum-reply__input-row">
            <label className="field forum-reply__field">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Напиши комментарий…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (!sending && reply.trim()) {
                      void submitReply();
                    }
                  }
                }}
              />
            </label>
            <button
              type="submit"
              className="btn btn--primary forum-reply__submit"
              disabled={sending || !reply.trim()}
            >
              {sending ? '…' : 'Ответить'}
            </button>
          </div>
          <p className="forum-reply__hint muted">Ctrl+Enter — отправить</p>
        </form>
      ) : !user ? (
        <p className="muted forum-reply-login">
          <Link to={`/login?next=${encodeURIComponent(`/forum/topic/${id}`)}`}>Войди</Link>, чтобы ответить
        </p>
      ) : topic.locked ? (
        <p className="muted forum-reply-login">🔒 Тема закрыта для ответов</p>
      ) : null}
    </PageShell>
  );
}
