import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireAuth from '../components/Auth/RequireAuth';

const PublicRoutes = lazy(() => import('./PublicRoutes'));
const ProtectedRoutes = lazy(() => import('./ProtectedRoutes'));
const AdminRoutes = lazy(() => import('./AdminRoutes'));

export default function MainRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center bg-[#05080c] text-sm text-gray-300" role="status">Loading EVEO…</div>}>
    <Routes>
      {/* 1. PUBLIC ROUTES (Landing, About, Pricing, Login, Register) */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* 2. AGENT WORKSPACE (Sidebar Layout, routed to /app/...) */}
      <Route
        path="/app/*"
        element={
          <RequireAuth>
            <ProtectedRoutes />
          </RequireAuth>
        }
      />

      {/* 3. MASTER CONTROL (Public-style Full Screen Layout, routed to /admin/...) */}
      <Route
        path="/admin/*"
        element={
          <RequireAuth>
            <AdminRoutes />
          </RequireAuth>
        }
      />
    </Routes>
    </Suspense>
  );
}
