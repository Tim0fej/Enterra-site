import { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AttachmentInput, attachmentIds } from '../components/AttachmentInput';
import type { ForumOutletContext } from '../components/ForumMessengerLayout';
import type { Attachment } from '../../shared/attachments';
import { FORM_LOADED_AT_FIELD } from '../../shared/botProtection';
import { useFormLoadedAt } from '../hooks/useBotFormFields';

export function ForumNewTopicPage() {
  const { user } = useAuth();
  const formLoadedAt = useFormLoadedAt();
  const navigate = useNavigate();
  const { reloadTopics, showApiError } = useOutletContext<ForumOutletContext>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="messenger__placeholder card">
        <p>
          <Link to="/login?next=%2Fforum%2Fgeneral%2Fnew">Войди</Link>, чтобы создать тему
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api<{ topicId: number }>('/forum/topics', {
        method: 'POST',
        body: JSON.stringify({
          categorySlug: 'general',
          title,
          content,
          attachmentIds: attachmentIds(attachments),
          [FORM_LOADED_AT_FIELD]: formLoadedAt,
        }),
      });
      reloadTopics();
      navigate(`/forum/general/topic/${data.topicId}`);
    } catch (err) {
      showApiError(err, 'Не удалось создать тему');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="chat-panel card">
      <header className="chat-panel__header">
        <Link to="/forum/general" className="chat-panel__back">
          ← Назад
        </Link>
        <h2>Новая тема</h2>
      </header>

      <form className="chat-panel__new-form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="field">
          <span>Заголовок</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </label>
        <label className="field">
          <span>Первое сообщение</span>
          <textarea
            className="chat-panel__new-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="О чём хочешь поговорить?"
          />
        </label>
        <div className="chat-panel__toolbar chat-panel__toolbar--new">
          <AttachmentInput attachments={attachments} onChange={setAttachments} />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || !title.trim() || (!content.trim() && attachments.length === 0)}
          >
            {saving ? 'Публикация…' : 'Опубликовать'}
          </button>
        </div>
      </form>
    </div>
  );
}
