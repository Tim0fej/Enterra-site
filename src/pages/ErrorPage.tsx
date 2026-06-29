import { PageShell } from '../components/Layout';
import { ErrorScreen } from '../components/ErrorScreen';
import { usePageTitle } from '../hooks/usePageTitle';
import type { HttpErrorCode } from '../../shared/httpErrors';

interface ErrorPageProps {
  code: HttpErrorCode;
}

export function ErrorPage({ code }: ErrorPageProps) {
  usePageTitle(String(code));

  return (
    <PageShell title={`${code}`} subtitle="Enterra">
      <ErrorScreen code={code} />
    </PageShell>
  );
}

export function NotFoundPage() {
  return <ErrorPage code={404} />;
}

export function ForbiddenPage() {
  return <ErrorPage code={403} />;
}

export function TooManyRequestsPage() {
  return <ErrorPage code={429} />;
}

export function ServerErrorPage() {
  return <ErrorPage code={500} />;
}

export function GatewayTimeoutPage() {
  return <ErrorPage code={504} />;
}
