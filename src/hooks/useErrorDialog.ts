import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dialogTitleForStatus,
  dialogVariantForStatus,
} from '../../shared/httpErrors';
import type { ErrorDialogVariant } from '../components/ErrorDialog';

export interface ErrorDialogState {
  open: boolean;
  title: string;
  message: string;
  variant: ErrorDialogVariant;
}

export type ShowErrorOptions = {
  title?: string;
  status?: number;
};

export function useErrorDialog() {
  const [state, setState] = useState<ErrorDialogState>({
    open: false,
    title: 'Ошибка',
    message: '',
    variant: 'error',
  });
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const show = useCallback((message: string, titleOrOptions?: string | ShowErrorOptions) => {
    if (!message.trim()) return;

    const options =
      typeof titleOrOptions === 'string'
        ? { title: titleOrOptions }
        : (titleOrOptions ?? {});

    const status = options.status;
    setState((prev) => {
      const nextMessage = message.trim();
      if (prev.open && prev.message === nextMessage) {
        return prev;
      }
      return {
        open: true,
        title: options.title ?? dialogTitleForStatus(status),
        message: nextMessage,
        variant: dialogVariantForStatus(status),
      };
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    if (!state.open) return;

    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [state.open, close]);

  return { ...state, show, close, closeBtnRef };
}
