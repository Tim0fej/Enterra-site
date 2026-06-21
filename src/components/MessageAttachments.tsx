import { useEffect, useState } from 'react';
import { getToken } from '../api/client';
import type { Attachment } from '../../shared/attachments';
import { isImageMime } from '../../shared/attachments';

interface MessageAttachmentsProps {
  attachments?: Attachment[];
}

export function MessageAttachments({ attachments = [] }: MessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="message-attachments">
      {attachments.map((attachment) => (
        <MessageAttachment key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}

function MessageAttachment({ attachment }: { attachment: Attachment }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

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
        setFailed(false);
      })
      .catch(() => {
        setSrc(null);
        setFailed(true);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.url]);

  if (failed) {
    return (
      <a href={attachment.url} className="message-attachments__fallback" target="_blank" rel="noreferrer">
        {attachment.originalName}
      </a>
    );
  }

  if (!src) {
    return <div className="message-attachments__loading">Загрузка...</div>;
  }

  if (isImageMime(attachment.mimeType)) {
    return (
      <a href={src} target="_blank" rel="noreferrer" className="message-attachments__link">
        <img src={src} alt={attachment.originalName} className="message-attachments__image" loading="lazy" />
      </a>
    );
  }

  return (
    <video src={src} className="message-attachments__video" controls preload="metadata">
      <track kind="captions" />
    </video>
  );
}
