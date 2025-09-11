import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';

export default function AdminDashboard() {
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', phone: '', password: '', first_name: '', last_name: '', date_of_birth: '', gender: 'male', role: 'sample_collector', collector_type: 'both' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const nav = useNavigate();
  const { logout } = useEmployeeAuth();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const r = await apiService.employee.listUsers();
      setUsers(r.data || []);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally { setLoadingUsers(false); }
  }

  React.useEffect(() => { loadUsers(); }, []);
  React.useEffect(() => { loadPatients(); }, []);

  const employees = users.filter((u) => !u.is_patient);

  async function loadPatients() {
    setLoadingPatients(true);
    try {
      // Reuse the same endpoint but filter client-side for patients (no roles)
      const r = await apiService.employee.listUsers();
    const all = r.data || [];
    // rely on backend is_patient flag
    const pats = all.filter((x) => x.is_patient);
    setPatients(pats);
    } catch (e) {
      console.error('Failed to load patients', e);
    } finally { setLoadingPatients(false); }
  }
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
          {form.role === 'sample_collector' && (
            <select className="border p-2 rounded" value={form.collector_type} onChange={(e)=>setForm({...form,collector_type:e.target.value})}>
              <option value="home_collection">Home Collection</option>
              <option value="lab_visit">Lab Visit</option>
              <option value="both">Both</option>
            </select>
          )}
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
              setForm({ email: '', phone: '', password: '', first_name: '', last_name: '', date_of_birth: '', role: 'sample_collector', gender: 'male', collector_type: 'both' });
              setCreateSuccess('Employee created successfully');
            } catch (err) {
              setCreateError(err?.response?.data?.message || err?.message || 'Create failed');
            } finally { setCreating(false); }
          }} disabled={creating}>{creating ? 'Creating…' : 'Create Employee'}</button>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded shadow mt-6">
        <h2 className="font-semibold mb-3">User List</h2>
  {loadingUsers && <div>Loading…</div>}
  {!loadingUsers && employees.length === 0 && <div>No employees found.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Employees</h3>
            <div className="space-y-2">
              {employees.map((u) => (
                <div key={u.user_id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{u.first_name} {u.last_name} {u.is_active ? '' : '(inactive)'}</div>
                    <div className="text-sm text-gray-600">{u.email} • {u.phone}</div>
                    <div className="text-sm">Roles: {(u.roles || []).join(', ')}</div>
                    {u.collector_type && <div className="text-sm">Collector type: {u.collector_type}</div>}
                  </div>
                  <div className="space-x-2">
                    <button className="px-3 py-1 border rounded" onClick={async ()=>{
                      const newRole = window.prompt('Role (sample_collector, lab_technician, lab_manager):', (u.roles && u.roles[0]) || 'sample_collector');
                      if (newRole === null) return;
                      const newCollectorType = window.prompt('Collector type (home_collection, lab_visit, both):', u.collector_type || 'both');
                      if (newCollectorType === null) return;
                      const activeAnswer = window.prompt('Active? (yes/no):', u.is_active ? 'yes' : 'no');
                      if (activeAnswer === null) return;
                      const isActive = activeAnswer.toLowerCase().startsWith('y');
                      try {
                        await apiService.employee.updateUser(u.user_id, { role: newRole, collector_type: newCollectorType, is_active: isActive });
                        await loadUsers();
                      } catch (e) {
                        alert(e?.response?.data?.message || e?.message || 'Update failed');
                      }
                    }}>Edit</button>
                    <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={async ()=>{
                      // Show dependents
                      try {
                        const dr = await apiService.employee.getUserDependents(u.user_id);
                        const d = dr.data || dr;
                        if (d && Object.values(d).some((v) => Number(v) > 0)) {
                          const confirmForce = window.confirm(`User has dependents: ${JSON.stringify(d)}. Force delete? This will remove related data.`);
                          if (!confirmForce) return;
                          await apiService.employee.forceDeleteUser(u.user_id);
                        } else {
                          await apiService.employee.deleteUser(u.user_id);
                        }
                        await loadUsers();
                        await loadPatients();
                      } catch (e) {
                        alert(e?.response?.data?.message || e?.message || 'Delete failed');
                      }
                    }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Patients</h3>
            {loadingPatients && <div>Loading…</div>}
            {!loadingPatients && patients.length === 0 && <div>No patients found.</div>}
            <div className="space-y-2">
              {patients.map((p) => (
                    <div key={p.user_id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{p.first_name} {p.last_name}</div>
                        <div className="text-sm text-gray-600">{p.email} • {p.phone}</div>
                      </div>
                      <div className="space-x-2">
                        <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={async ()=> {
                          try {
                            // Always attempt a cascading delete for patients.
                            // Fetch dependents to show a clear summary before confirmation; proceed even if this call fails.
                            let summary = 'no linked records detected';
                            try {
                              const dr = await apiService.employee.getUserDependents(p.user_id);
                              const d = (dr && dr.data) ? dr.data : dr;
                              if (d && typeof d === 'object') {
                                const nonZero = Object.entries(d).filter(([_, v]) => Number(v) > 0);
                                if (nonZero.length) summary = nonZero.map(([k, v]) => `${k}: ${v}`).join(', ');
                              }
                            } catch {}

                            const confirmText = window.prompt(
                              `This will permanently delete the patient and ALL related records (${summary}).\n\nType DELETE to confirm.`,
                              ''
                            );
                            if (confirmText !== 'DELETE') return;

                            await apiService.employee.forceDeleteUser(p.user_id);
                            await loadUsers();
                            await loadPatients();
                          } catch (e) {
                            alert(e?.response?.data?.message || e?.message || 'Delete failed');
                          }
                        }}>Delete</button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
