import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeAuthProvider, useEmployeeAuth } from '../context/EmployeeAuthContext';

const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const RequireAdmin = ({ children }) => {
  const { employee } = useEmployeeAuth();
  if (!employee) return <Navigate to="/admin/login" replace />;
  const roles = employee?.user?.roles || [];
  if (!roles.includes('admin')) return <Navigate to="/employee/dashboard" replace />;
  return children;
};

export default function AdminRouter() {
  return (
    <EmployeeAuthProvider>
      <React.Suspense fallback={<div className="p-6">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Routes>
      </React.Suspense>
    </EmployeeAuthProvider>
  );
}
