// src/routes/MainRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import ProtectedRoutes from './ProtectedRoutes';
// Import your dashboard components here as you build them, e.g.:
import Hub from '../pages/Dashboard/Hub';
import Reports from '../pages/Dashboard/Reports';

export default function MainRoutes() {
  return (
    <Routes>
      {/* The /* wildcard ensures any public URL matches this block */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* Protected Layout Wrapper */}
      <Route element={<ProtectedRoutes />}>
        {/* All routes placed inside here require isAuthenticated to be true */}
        <Route path="/app" element={<Hub />} />
        <Route path="/reports" element={<Reports />} /> 
      </Route>
    </Routes>
  );
}