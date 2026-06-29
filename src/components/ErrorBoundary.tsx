import { Component, type ErrorInfo, type ReactNode } from 'react';
import { PageShell } from './Layout';
import { ErrorScreen } from './ErrorScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <PageShell title="Ошибка интерфейса" subtitle="Страница не загрузилась">
          <ErrorScreen code={500} message="Обнови страницу. Если ошибка повторяется — напиши в поддержку." />
        </PageShell>
      );
    }

    return this.props.children;
  }
}
