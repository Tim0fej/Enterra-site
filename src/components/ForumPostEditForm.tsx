import { useState } from 'react';

interface ForumPostEditFormProps {
  initialContent: string;
  initialTitle?: string;
  showTitle?: boolean;
  saving: boolean;
  onSave: (content: string, title?: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ForumPostEditForm({
  initialContent,
  initialTitle = '',
  showTitle = false,
  saving,
  onSave,
  onCancel,
}: ForumPostEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);

  return (
    <form
      className="forum-edit"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(content.trim(), showTitle ? title.trim() : undefined);
      }}
    >
      {showTitle ? (
        <label className="field forum-edit__field">
          <span>Заголовок</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
        </label>
      ) : null}
      <label className="field forum-edit__field">
        <span>{showTitle ? 'Текст' : 'Сообщение'}</span>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={showTitle ? 8 : 4} required />
      </label>
      <div className="forum-edit__actions">
        <button type="submit" className="btn btn--primary btn--small" disabled={saving || !content.trim()}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={onCancel} disabled={saving}>
          Отмена
        </button>
      </div>
    </form>
  );
}
