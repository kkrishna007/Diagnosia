import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EmployeeAuthProvider, useEmployeeAuth } from '../context/EmployeeAuthContext';

const EmployeeLogin = React.lazy(() => import('./pages/EmployeeLogin'));
const CollectorDashboard = React.lazy(() => import('./pages/CollectorDashboard'));
const LabDashboard = React.lazy(() => import('./pages/LabDashboard'));
const ManagerDashboard = React.lazy(() => import('./pages/ManagerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const RequireEmployee = ({ roles, children }) => {
  const { employee } = useEmployeeAuth();
  if (!employee) return <Navigate to="/employee/login" replace />;
  if (roles?.length) {
    const userRoles = employee?.user?.roles || [];
    const has = userRoles.some((r) => roles.includes(r));
    if (!has) return <Navigate to="/employee" replace />;
  }
  return children;
};

const RoleAwareDashboard = () => {
  const { employee } = useEmployeeAuth();
  const roles = employee?.user?.roles || [];
  if (roles.includes('admin')) return <Navigate to="/admin/dashboard" replace />;
  if (roles.includes('lab_manager')) return <ManagerDashboard />;
  if (roles.includes('lab_technician')) return <LabDashboard />;
  return <CollectorDashboard />;
};

export default function EmployeeRouter() {
  return (
    <EmployeeAuthProvider>
      <React.Suspense fallback={<div className="p-6">Loading…</div>}>
        <Routes>
          <Route path="/login" element={<EmployeeLogin />} />
          <Route path="/" element={<Navigate to="/employee/login" replace />} />
          <Route
            path="/dashboard"
            element={
              <RequireEmployee roles={["sample_collector", "lab_technician", "lab_manager", "admin"]}>
                <RoleAwareDashboard />
              </RequireEmployee>
            }
          />
        </Routes>
      </React.Suspense>
    </EmployeeAuthProvider>
  );
}
