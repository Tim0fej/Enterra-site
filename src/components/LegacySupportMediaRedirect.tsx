import { Navigate, useLocation } from 'react-router-dom';

export function LegacySupportMediaRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/media/apply${search}`} replace />;
}
