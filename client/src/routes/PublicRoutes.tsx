// src/routes/PublicRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from '../pages/Landing';
import About from '../pages/About';
import Login from '../pages/Auth/Login';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';
import Pricing from '../pages/Pricing';
import Register from '../pages/Auth/Register';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoutes() {
  const { user, isLoading } = useAuth();

  // Logged-in users should never see unauthenticated public pages
  if (user && !isLoading) {
    return <Navigate to="/app/hub" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05080c]">
      {/* Global Public Header */}
      <Header />

      {/* The main content area expands to fill the middle */}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Public Footer */}
      <Footer />
    </div>
  );
}
