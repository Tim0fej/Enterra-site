export type HttpErrorCode = 400 | 403 | 404 | 405 | 415 | 429 | 500 | 503 | 504;

export interface HttpErrorContent {
  title: string;
  subtitle: string;
  text: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  reload?: boolean;
  tone?: 'accent' | 'danger' | 'warning';
}

export const HTTP_ERROR_CONTENT: Record<HttpErrorCode, HttpErrorContent> = {
  400: {
    title: 'Неверный запрос',
    subtitle: 'Сервер не смог обработать обращение',
    text: 'Проверь адрес или попробуй снова. Если ошибка повторяется — вернись на главную.',
    primaryLabel: 'На главную',
    primaryHref: '/',
    tone: 'warning',
  },
  403: {
    title: 'Доступ ограничен',
    subtitle: 'С вашего IP временно закрыт вход на сайт',
    text: 'Это защита от подозрительной активности. Обычно ограничение снимается через некоторое время. Если ты ничего не нарушал — зайди позже или напиши в поддержку.',
    primaryLabel: 'На главную',
    primaryHref: '/',
    secondaryLabel: 'Поддержка',
    secondaryHref: '/tickets/new',
    tone: 'danger',
  },
  404: {
    title: 'Страница не найдена',
    subtitle: 'Такой страницы на Enterra нет',
    text: 'Проверь адрес или вернись на главную — возможно, ссылка устарела или опечатка в URL.',
    primaryLabel: 'На главную',
    primaryHref: '/',
    secondaryLabel: 'Форум',
    secondaryHref: '/forum',
    tone: 'accent',
  },
  405: {
    title: 'Метод не поддерживается',
    subtitle: 'Запрос выполнен неподдерживаемым способом',
    text: 'Попробуй открыть страницу в браузере или вернись на главную.',
    primaryLabel: 'На главную',
    primaryHref: '/',
    tone: 'warning',
  },
  415: {
    title: 'Неверный формат',
    subtitle: 'Сервер ожидал другой тип данных',
    text: 'Обнови страницу и повтори действие. Если ошибка не исчезает — напиши в поддержку.',
    primaryLabel: 'Обновить',
    primaryHref: '/',
    reload: true,
    tone: 'warning',
  },
  429: {
    title: 'Слишком много запросов',
    subtitle: 'Нужно немного подождать',
    text: 'Сайт ограничил число обращений с вашего IP или аккаунта. Подождите минуту и попробуйте снова.',
    primaryLabel: 'Обновить страницу',
    primaryHref: '/',
    reload: true,
    secondaryLabel: 'На главную',
    secondaryHref: '/',
    tone: 'warning',
  },
  500: {
    title: 'Ошибка сервера',
    subtitle: 'Что-то пошло не так на нашей стороне',
    text: 'Мы уже видим сбой в логах. Подожди минуту и обнови страницу. Если проблема остаётся — напиши в поддержку.',
    primaryLabel: 'Обновить',
    primaryHref: '/',
    reload: true,
    secondaryLabel: 'Поддержка',
    secondaryHref: '/tickets/new',
    tone: 'danger',
  },
  503: {
    title: 'Сервис недоступен',
    subtitle: 'Сайт временно не принимает запросы',
    text: 'Возможно, идёт обновление или перезапуск. Попробуй зайти через несколько минут.',
    primaryLabel: 'Обновить',
    primaryHref: '/',
    reload: true,
    tone: 'warning',
  },
  504: {
    title: 'Сервер не отвечает',
    subtitle: 'Сайт временно перегружен или на техобслуживании',
    text: 'Подожди минуту и обнови страницу. Если ошибка повторяется — зайди позже или напиши в поддержку.',
    primaryLabel: 'Обновить',
    primaryHref: '/',
    reload: true,
    secondaryLabel: 'Поддержка',
    secondaryHref: '/tickets/new',
    tone: 'danger',
  },
};

export function resolveHttpErrorContent(
  status: number,
  message?: string,
): HttpErrorContent & { code: HttpErrorCode | number } {
  const known = HTTP_ERROR_CONTENT[status as HttpErrorCode];
  if (known) {
    return {
      code: status as HttpErrorCode,
      ...known,
      text: message?.trim() ? message : known.text,
    };
  }

  return {
    code: status,
    title: 'Ошибка',
    subtitle: `Код ${status}`,
    text: message?.trim() || 'Не удалось выполнить запрос. Попробуйте обновить страницу.',
    primaryLabel: 'На главную',
    primaryHref: '/',
    tone: 'danger',
  };
}

export function dialogTitleForStatus(status?: number): string {
  if (!status) return 'Ошибка';
  if (status === 429) return 'Слишком много запросов';
  if (status === 403) return 'Доступ ограничен';
  if (status === 401) return 'Нужен вход';
  if (status === 404) return 'Не найдено';
  if (status >= 500) return 'Ошибка сервера';
  return 'Ошибка';
}

export function dialogVariantForStatus(status?: number): 'error' | 'warning' | 'limit' {
  if (status === 429) return 'limit';
  if (status === 403 || status === 401) return 'warning';
  if (status && status >= 500) return 'error';
  return 'error';
}
