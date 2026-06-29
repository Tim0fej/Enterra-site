import { Link, Outlet, useOutletContext } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { Background } from './Background';
import { Footer } from './Footer';
import { Header } from './Header';
import { ErrorDialog } from './ErrorDialog';
import { Toast } from './Toast';
import { useToast } from '../hooks/useToast';
import { useErrorDialog, type ShowErrorOptions } from '../hooks/useErrorDialog';
import { usePageTitle } from '../hooks/usePageTitle';
import { apiErrorMeta } from '../utils/formatError';

export interface LayoutContext {
  showToast: (msg: string) => void;
  showError: (message: string, titleOrOptions?: string | ShowErrorOptions) => void;
  showApiError: (err: unknown, fallback: string) => void;
}

export function useLayoutToast() {
  return useOutletContext<LayoutContext>();
}

export function useLayoutError() {
  return useOutletContext<LayoutContext>();
}

export function Layout() {
  const toast = useToast();
  const errorDialog = useErrorDialog();

  const showApiError = useCallback((err: unknown, fallback: string) => {
    const meta = apiErrorMeta(err);
    errorDialog.show(meta.message || fallback, {
      title: meta.title,
      status: meta.status,
    });
  }, [errorDialog.show]);

  const outletContext = useMemo(
    () => ({
      showToast: toast.show,
      showError: errorDialog.show,
      showApiError,
    }),
    [toast.show, errorDialog.show, showApiError],
  );

  return (
    <>
      <Background />
      <Header onToast={toast.show} />
      <div className="route-transition">
        <Outlet context={outletContext} />
      </div>
      <Footer />
      <Toast message={toast.message} visible={toast.visible} />
      <ErrorDialog
        open={errorDialog.open}
        title={errorDialog.title}
        message={errorDialog.message}
        variant={errorDialog.variant}
        onClose={errorDialog.close}
        closeBtnRef={errorDialog.closeBtnRef}
      />
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
  backTo?: { to: string; label: string; onClick?: () => void };
  wide?: boolean;
}) {
  usePageTitle(title);

  return (
    <div className="page">
      <div className={`container page__inner${wide ? ' page__inner--wide' : ''}`}>
        {backTo &&
          (backTo.onClick ? (
            <button type="button" className="back-link" onClick={backTo.onClick}>
              ← {backTo.label}
            </button>
          ) : (
            <Link to={backTo.to} className="back-link">
              ← {backTo.label}
            </Link>
          ))}
        <div className="page__header">
          <h1 className="page__title">{title}</h1>
          {subtitle && <p className="page__subtitle">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
