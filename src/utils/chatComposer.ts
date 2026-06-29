import type { KeyboardEvent } from 'react';

/** Enter — отправить, Shift+Enter — новая строка */
export function onEnterToSend(
  e: KeyboardEvent<HTMLTextAreaElement>,
  send: () => void,
  disabled = false,
) {
  if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
  e.preventDefault();
  if (!disabled) send();
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Прокрутка только внутри контейнера сообщений, без сдвига всей страницы. */
export function scrollChatToBottom(container: HTMLElement | null) {
  if (!container) return;
  container.scrollTo({
    top: container.scrollHeight,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}
