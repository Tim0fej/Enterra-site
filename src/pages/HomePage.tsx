import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { About } from '../components/About';
import { Features } from '../components/Features';
import { Hero } from '../components/Hero';
import { Join } from '../components/Join';
import { Rules } from '../components/Rules';
import { useLayoutToast } from '../components/Layout';
import { scrollToHash } from '../hooks/useScrollAnimation';
import { useServerStatus } from '../hooks/useServerStatus';

export function HomePage() {
  const status = useServerStatus();
  const { showToast } = useLayoutToast();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      scrollToHash(location.hash);
    }
  }, [location.hash]);

  const handleCopy = (success: boolean) => {
    showToast(success ? 'IP скопирован!' : 'Не удалось скопировать');
  };

  return (
    <main>
      <Hero status={status} onCopy={handleCopy} />
      <About playersOnline={status.playersOnline} />
      <Features />
      <Rules />
      <Join />
    </main>
  );
}
