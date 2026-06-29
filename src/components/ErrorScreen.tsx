import { Link } from 'react-router-dom';
import { LogoLink } from './Logo';
import {
  HTTP_ERROR_CONTENT,
  type HttpErrorCode,
} from '../../shared/httpErrors';

export interface ErrorScreenProps {
  code: HttpErrorCode | number;
  message?: string;
  compact?: boolean;
}

export function ErrorScreen({ code, message, compact = false }: ErrorScreenProps) {
  const known = HTTP_ERROR_CONTENT[code as HttpErrorCode];
  const content = known
    ? { ...known, text: message?.trim() ? message : known.text }
    : {
        title: 'Ошибка',
        subtitle: `Код ${code}`,
        text: message?.trim() || 'Не удалось выполнить запрос. Попробуйте обновить страницу.',
        primaryLabel: 'На главную',
        primaryHref: '/',
        tone: 'danger' as const,
      };

  const toneClass =
    content.tone === 'danger'
      ? 'error-screen--danger'
      : content.tone === 'warning'
        ? 'error-screen--warning'
        : 'error-screen--accent';

  return (
    <div className={`card error-screen ${toneClass}${compact ? ' error-screen--compact' : ''}`}>
      {!compact && (
        <div className="error-screen__brand">
          <LogoLink size="sm" />
        </div>
      )}

      <p className="error-screen__code" aria-hidden="true">
        {code}
      </p>
      <h2 className="error-screen__title">{content.title}</h2>
      <p className="error-screen__subtitle">{content.subtitle}</p>
      <p className="error-screen__text">{content.text}</p>

      <div className="error-screen__actions">
        {content.reload ? (
          <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
            {content.primaryLabel}
          </button>
        ) : (
          <Link to={content.primaryHref} className="btn btn--primary">
            {content.primaryLabel}
          </Link>
        )}
        {content.secondaryLabel && content.secondaryHref ? (
          <Link to={content.secondaryHref} className="btn btn--ghost">
            {content.secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
