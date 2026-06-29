const FORUM_CATEGORY_SLUGS = new Set(['news', 'general', 'builds', 'bugs']);

const SINGLE_SEGMENT_ROUTES = new Set([
  'register',
  'login',
  'forgot-password',
  'forum',
  'shop',
  'media',
  'faq',
  'terms',
  'rules',
  'refund',
  'legal',
  'profile',
  'mods',
  'moder',
  'staff-guide',
  'admin',
  '403',
  '404',
  '429',
  '500',
  '504',
  'support',
  'tickets',
]);

function isNumericId(value: string | undefined): boolean {
  return !!value && /^\d+$/.test(value);
}

/** Paths that should receive the SPA shell (index.html) with HTTP 200. */
export function isKnownSpaPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/') return true;

  const parts = path.slice(1).split('/');
  const [first, second, third, fourth] = parts;

  if (parts.length === 1 && SINGLE_SEGMENT_ROUTES.has(first)) {
    return true;
  }

  if (first === 'media' && second === 'apply' && parts.length === 2) {
    return true;
  }

  if (first === 'support' && (second === 'vip' || second === 'media') && parts.length === 2) {
    return true;
  }

  if (first === 'tickets') {
    if (parts.length === 2 && (second === 'new' || isNumericId(second))) {
      return true;
    }
  }

  if (first === 'forum') {
    if (parts.length === 2 && FORUM_CATEGORY_SLUGS.has(second)) {
      return true;
    }
    if (parts.length === 3 && second === 'topic' && isNumericId(third)) {
      return true;
    }
    if (parts.length === 3 && second === 'general' && third === 'new') {
      return true;
    }
    if (parts.length === 4 && second === 'general' && third === 'topic' && isNumericId(fourth)) {
      return true;
    }
  }

  return false;
}
