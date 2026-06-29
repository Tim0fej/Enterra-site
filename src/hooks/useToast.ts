import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(text);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 2500);
  }, []);

  return { message, visible, show };
}
