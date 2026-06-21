import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const context = useOutletContext();

  if (loading) {
    return (
      <div className="page page--center">
        <p className="muted">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={context} />;
}
