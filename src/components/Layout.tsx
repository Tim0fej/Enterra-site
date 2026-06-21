import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { Background } from './Background';
import { Footer } from './Footer';
import { Header } from './Header';
import { Toast } from './Toast';
import { useToast } from '../hooks/useToast';

interface LayoutContext {
  showToast: (msg: string) => void;
}

export function useLayoutToast() {
  return useOutletContext<LayoutContext>();
}

export function Layout() {
  const toast = useToast();

  return (
    <>
      <Background />
      <Header onToast={toast.show} />
      <div className="route-transition">
        <Outlet context={{ showToast: toast.show }} />
      </div>
      <Footer />
      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
}

export function PageShell({
  title,
  subtitle,
  children,
  backTo,
  wide,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  backTo?: { to: string; label: string };
  wide?: boolean;
}) {
  return (
    <div className="page">
      <div className={`container page__inner${wide ? ' page__inner--wide' : ''}`}>
        {backTo && (
          <Link to={backTo.to} className="back-link">
            ← {backTo.label}
          </Link>
        )}
        <div className="page__header">
          <h1 className="page__title">{title}</h1>
          {subtitle && <p className="page__subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
