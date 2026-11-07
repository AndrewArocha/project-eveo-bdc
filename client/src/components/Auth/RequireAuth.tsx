import { Navigate, useLocation } from 'react-router-dom';
import type { JSX } from 'react/jsx-runtime';
import { useAuth } from '../../contexts/AuthContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#05080c] text-sm text-gray-300" role="status">Restoring your EVEO session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (location.pathname.startsWith('/admin') && role !== 'owner') {
    return <Navigate to="/app/hub" replace />;
  }

  return children;
}
