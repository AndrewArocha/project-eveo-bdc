// src/routes/ProtectedRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../components/Layout/ProtectedLayout';

import Hub from '../pages/Dashboard/Hub';
import Reports from '../pages/Dashboard/Reports';

export default function ProtectedRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedLayout />}>
        {/* Redirect base /app directly to /app/hub */}
        
        <Route index element={<Navigate to="hub" replace />} />
        
        <Route path="hub" element={<Hub />} />
        
        <Route path="reports" element={<Reports />} />
      </Route>
    </Routes>
  );
}