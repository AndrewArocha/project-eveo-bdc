import { Routes, Route } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import ProtectedRoutes from './ProtectedRoutes';
import AdminRoutes from './AdminRoutes'; 
import RequireAuth from '../components/Auth/RequireAuth';

export default function MainRoutes() {
  return (
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
  );
}