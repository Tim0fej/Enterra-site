import { useEffect } from 'react';

import { SITE_NAME } from '../../shared/siteMeta';

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    const next =
      pageTitle && pageTitle !== SITE_NAME ? `${pageTitle} · ${SITE_NAME}` : `${SITE_NAME} — ванильный Minecraft сервер`;
    document.title = next;
  }, [pageTitle]);
}
