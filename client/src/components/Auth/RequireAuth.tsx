import { Navigate, useLocation } from 'react-router-dom';
import type { JSX } from 'react/jsx-runtime';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreAppearance } from '../../contexts/StoreAppereanceContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { storesLoading, storesError, refreshStores } = useStoreAppearance();

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#05080c] text-sm text-gray-300" role="status">Restoring your EVEO session…</div>;
  }

  if (!user || !user.emailVerifiedAt) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (storesLoading) {
    return <div className="min-h-screen grid place-items-center bg-[#05080c] text-sm text-gray-300" role="status">Loading your store registry…</div>;
  }

  if (storesError) {
    return <div className="min-h-screen grid place-items-center bg-[#05080c] px-6 text-center text-sm text-gray-300"><div><p role="alert">{storesError}</p><button type="button" onClick={() => void refreshStores()} className="mt-4 min-h-11 rounded-xl bg-orange-500 px-4 font-semibold text-white">Retry</button></div></div>;
  }

  if (location.pathname.startsWith('/admin') && user.role !== 'owner') {
    return <Navigate to="/app/hub" replace />;
  }

  return children;
}
