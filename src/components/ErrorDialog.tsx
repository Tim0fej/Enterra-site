import type { RefObject } from 'react';

export type ErrorDialogVariant = 'error' | 'warning' | 'limit';

interface ErrorDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: ErrorDialogVariant;
  onClose: () => void;
  closeBtnRef?: RefObject<HTMLButtonElement | null>;
}

const ICONS: Record<ErrorDialogVariant, string> = {
  error: '!',
  warning: '?',
  limit: '⏱',
};

export function ErrorDialog({
  open,
  title,
  message,
  variant = 'error',
  onClose,
  closeBtnRef,
}: ErrorDialogProps) {
  if (!open) return null;

  return (
    <div className="error-dialog" role="presentation">
      <button type="button" className="error-dialog__backdrop" aria-label="Закрыть" onClick={onClose} />
      <div
        className={`error-dialog__panel card error-dialog__panel--${variant}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="error-dialog-title"
        aria-describedby="error-dialog-message"
      >
        <div className={`error-dialog__icon error-dialog__icon--${variant}`} aria-hidden="true">
          {ICONS[variant]}
        </div>
        <h2 id="error-dialog-title" className="error-dialog__title">
          {title}
        </h2>
        <p id="error-dialog-message" className="error-dialog__message">
          {message}
        </p>
        <button
          ref={closeBtnRef}
          type="button"
          className="btn btn--primary btn--full error-dialog__action"
          onClick={onClose}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
