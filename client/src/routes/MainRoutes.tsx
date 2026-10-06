// src/routes/MainRoutes.tsx
import { Routes, Route } from 'react-router-dom';
import PublicRoutes from './PublicRoutes';
import ProtectedRoutes from './ProtectedRoutes';

export default function MainRoutes() {
  return (
    <Routes>
      {/* The /* wildcard sends all public traffic to the Public Layout */}
      <Route path="/*" element={<PublicRoutes />} />

      {/* The /app/* wildcard sends all dashboard traffic to the Protected Layout */}
      <Route path="/app/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}