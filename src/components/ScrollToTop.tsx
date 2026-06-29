import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Сбрасывает прокрутку окна при смене страницы (React Router не делает это сам). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
