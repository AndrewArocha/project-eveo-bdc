// src/routes/ProtectedRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoutes() {
  // Using mock auth for now
  const isAuthenticated = true; 

  // If logged in, render the protected dashboard components (Outlet)
  // If not, redirect them back to the landing page or login route
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}