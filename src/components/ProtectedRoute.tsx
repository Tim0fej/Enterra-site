import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const context = useOutletContext();

  if (loading) {
    return (
      <div className="page page--center">
        <p className="muted">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    const loginTo = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';
    return <Navigate to={loginTo} replace />;
  }

  return <Outlet context={context} />;
}
