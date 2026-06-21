import { useEffect, useRef } from 'react';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useScrollAnimation<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add('reveal', 'reveal--visible');
      return;
    }

    el.classList.add('reveal');
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return ref;
}

export function scrollToHash(href: string) {
  const target = document.querySelector(href);
  target?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}
