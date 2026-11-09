import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import Footer from '../components/Layout/Footer';

import AdminPortal from '../pages/Admin/AdminPortal';
import StorePortal from '../pages/Admin/StorePortal';
import PaymentPortal from '../pages/Admin/PaymentPortal';
import Customers from '../pages/Dashboard/Customers';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoutes() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'owner') return <Navigate to="/app/hub" replace />;
  return (
    <div className="flex flex-col min-h-screen bg-[#05080c]">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route index element={<Navigate to="portal" replace />} />
          <Route path="portal" element={<AdminPortal />} />
          <Route path="customers" element={<div className="pt-20"><Customers /></div>} />
          <Route path="store" element={<StorePortal />} />
          <Route path="checkout" element={<PaymentPortal />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
