import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';

export default function AdminDashboard() {
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', phone: '', password: '', first_name: '', last_name: '', date_of_birth: '', gender: 'male', role: 'sample_collector' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const nav = useNavigate();
  const { logout } = useEmployeeAuth();
  return (
    <div className="p-6">
      {/* Header with logout */}
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <button className="px-3 py-1 border rounded text-sm" onClick={() => { logout(); nav('/admin/login'); }}>Log out</button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-3">Create Employee Account</h2>
  {createError && <div className="text-red-600 text-sm mb-2">{createError}</div>}
  {createSuccess && <div className="text-green-600 text-sm mb-2">{createSuccess}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
          <input className="border p-2 rounded" placeholder="Phone" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
          <input className="border p-2 rounded" type="date" placeholder="Date of birth" value={form.date_of_birth} onChange={(e)=>setForm({...form,date_of_birth:e.target.value})} />
          <select className="border p-2 rounded" value={form.gender} onChange={(e)=>setForm({...form,gender:e.target.value})}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input className="border p-2 rounded" placeholder="First name" value={form.first_name} onChange={(e)=>setForm({...form,first_name:e.target.value})} />
          <input className="border p-2 rounded" placeholder="Last name" value={form.last_name} onChange={(e)=>setForm({...form,last_name:e.target.value})} />
          <input className="border p-2 rounded" placeholder="Password" type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} />
          <select className="border p-2 rounded" value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>
            <option value="sample_collector">Sample Collector</option>
            <option value="lab_technician">Lab Technician</option>
            <option value="lab_manager">Lab Manager</option>
            {/* Creating admin accounts via this UI is not allowed */}
          </select>
        </div>
        <div className="flex justify-end mt-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={async ()=>{
            setCreateError(''); setCreateSuccess('');
            // Prevent creating admin accounts from this UI
            if (form.role === 'admin') {
              setCreateError('Creating admin accounts is not allowed from this dashboard');
              return;
            }
            setCreating(true);
            try {
              await apiService.employee.createUser(form);
              setForm({ email: '', phone: '', password: '', first_name: '', last_name: '', date_of_birth: '', role: 'sample_collector' });
              setCreateSuccess('Employee created successfully');
            } catch (err) {
              setCreateError(err?.response?.data?.message || err?.message || 'Create failed');
            } finally { setCreating(false); }
          }} disabled={creating}>{creating ? 'Creating…' : 'Create Employee'}</button>
        </div>
      </div>
    </div>
  );
}
