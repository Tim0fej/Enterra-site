import { ApiError } from '../api/client';
import { dialogTitleForStatus } from '../../shared/httpErrors';

export function formatApiError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export function apiErrorMeta(err: unknown): { message: string; status?: number; title: string } {
  if (err instanceof ApiError) {
    return {
      message: err.message,
      status: err.status,
      title: dialogTitleForStatus(err.status),
    };
  }

  return {
    message: 'Неизвестная ошибка',
    title: 'Ошибка',
  };
}
