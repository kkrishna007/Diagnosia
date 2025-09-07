import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';

export default function AdminLogin() {
  const { login, setAuth } = useEmployeeAuth();
  const nav = useNavigate();
  const [emailOrPhone, setId] = useState('');
  const [password, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Call admin-specific endpoint
      const res = await apiService.employeeAuth.loginAdmin({ emailOrPhone, password });
  const data = res.data || res;
  setAuth(data.token, data.user);
  nav('/admin/dashboard');
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setError('Admin access required. This account is not an admin.');
      } else {
        setError(err?.response?.data?.message || err?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold">Admin Login</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input className="w-full border rounded px-3 py-2" placeholder="Email or Phone"
               value={emailOrPhone} onChange={(e)=>setId(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password"
               value={password} onChange={(e)=>setPw(e.target.value)} />
        <button className="w-full bg-blue-600 text-white rounded px-3 py-2">Login</button>
        <div className="text-xs text-gray-500">Admin access only</div>
      </form>
    </div>
  );
}
