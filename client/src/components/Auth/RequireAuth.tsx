import { Navigate, useLocation } from 'react-router-dom';
import type { JSX } from 'react/jsx-runtime';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  
  // In a real app, you might check a Zustand store or React Context here.
  // For now, we check if the server gave us a token and we saved it to local storage.
  const isAuthenticated = localStorage.getItem('eveo_token') !== null;
  const userRole = localStorage.getItem('eveo_role'); // e.g., 'owner' or 'agent'

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were 
    // trying to go to so you can send them back there after they log in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // --- OPTIONAL: ROLE-BASED ROUTING ---
  // If a standard BDC Agent tries to type /admin/portal into the URL, kick them to the hub.
  if (location.pathname.startsWith('/admin') && userRole !== 'owner') {
    return <Navigate to="/app/hub" replace />;
  }

  // If they are logged in (and have the right role), render the protected page!
  return children;
}