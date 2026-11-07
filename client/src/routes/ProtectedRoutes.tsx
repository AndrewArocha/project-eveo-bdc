// src/routes/ProtectedRoutes.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../components/Layout/ProtectedLayout';

const Hub = lazy(() => import('../pages/Dashboard/Hub'));
const Reports = lazy(() => import('../pages/Dashboard/Reports'));
const Account = lazy(() => import('../pages/Dashboard/Account'));
const Settings = lazy(() => import('../pages/Dashboard/Settings'));
const Insights = lazy(() => import('../pages/Dashboard/Insights'));
const PayrollCheckout = lazy(() => import('../pages/Dashboard/PayrollCheckout'));
const LiveShowroom = lazy(() => import('../pages/Dashboard/LiveShowroom'));
const ShowroomVisitDomain = lazy(() => import('../pages/Dashboard/ShowroomVisitDomain'));
const Customers = lazy(() => import('../pages/Dashboard/Customers'));

export default function ProtectedRoutes() {
  return (
    <Suspense fallback={<div className="min-h-full grid place-items-center text-sm text-gray-500" role="status">Loading workspace…</div>}>
    <Routes>
      <Route element={<ProtectedLayout />}>
        {/* Redirect base /app directly to /app/hub */}

        <Route index element={<Navigate to="hub" replace />} />

        <Route path="hub" element={<Hub />} />

        <Route path="reports" element={<Reports />} />

        <Route path="account" element={<Account />} />

        <Route path="customers" element={<Customers />} />

        <Route path="settings" element={<Settings />} />

        <Route path="insights" element={<Insights />} />

        <Route path="payroll-checkout" element={<PayrollCheckout />} />

        <Route path="showroom" element={<LiveShowroom />} />

        <Route path="showroom/visit/:visitId" element={<ShowroomVisitDomain />} />

      </Route>


    </Routes>
    </Suspense>
  );
}
