import { Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../utils/roles';

interface StaffRouteProps {
  roles: UserRole[];
}

export function StaffRoute({ roles }: StaffRouteProps) {
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

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet context={context} />;
}
