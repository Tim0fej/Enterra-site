import { useEffect, useRef, useState } from 'react';
import { ApiError, getToken, uploadAttachments } from '../api/client';
import type { Attachment } from '../../shared/attachments';
import { MAX_ATTACHMENTS_PER_MESSAGE } from '../../shared/attachments';
import { isImageMime } from '../../shared/attachments';

interface AttachmentInputProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function AttachmentInput({ attachments, onChange, disabled = false }: AttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length || disabled) return;

    const remaining = MAX_ATTACHMENTS_PER_MESSAGE - attachments.length;
    if (remaining <= 0) {
      setError(`Не больше ${MAX_ATTACHMENTS_PER_MESSAGE} файлов`);
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    setError('');
    setUploading(true);

    try {
      const uploaded = await uploadAttachments(files);
      onChange([...attachments, ...uploaded]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAttachment = (id: number) => {
    onChange(attachments.filter((item) => item.id !== id));
  };

  return (
    <div className="attachment-input">
      {attachments.length > 0 && (
        <div className="attachment-input__list">
          {attachments.map((item) => (
            <div key={item.id} className="attachment-input__item">
              <AttachmentPreview attachment={item} />
              <button
                type="button"
                className="attachment-input__remove"
                onClick={() => removeAttachment(item.id)}
                disabled={disabled}
                aria-label="Удалить файл"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {attachments.length < MAX_ATTACHMENTS_PER_MESSAGE && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            hidden
            disabled={disabled || uploading}
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button
            type="button"
            className="btn btn--ghost btn--small attachment-input__pick"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Загрузка...' : '📎 Фото или видео'}
          </button>
        </>
      )}

      {error && <p className="attachment-input__error">{error}</p>}
    </div>
  );
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const token = getToken();

    void fetch(attachment.url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('fail');
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url]);

  if (!src) {
    return <span className="attachment-input__name">{attachment.originalName}</span>;
  }

  if (isImageMime(attachment.mimeType)) {
    return <img src={src} alt={attachment.originalName} className="attachment-input__thumb" />;
  }

  return <video src={src} className="attachment-input__thumb" muted playsInline />;
}

export function attachmentIds(attachments: Attachment[]) {
  return attachments.map((item) => item.id);
}
