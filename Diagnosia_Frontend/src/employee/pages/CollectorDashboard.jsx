import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';

export default function CollectorDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const { user } = useEmployeeAuth();

  async function load() {
    setLoading(true);
    try {
      const r = await apiService.employee.getCollectorTasks();
      setTasks(r.data || []);
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function assign(taskId) {
    setActionLoading((s) => ({ ...s, [taskId]: true }));
    try {
      await apiService.employee.assignTask(taskId);
      await load();
    } catch (e) {
      console.error(e);
    } finally { setActionLoading((s) => ({ ...s, [taskId]: false })); }
  }

  async function collect(taskId) {
    setActionLoading((s) => ({ ...s, [taskId]: true }));
    try {
      await apiService.employee.collectTask(taskId);
      await load();
    } catch (e) {
      console.error(e);
    } finally { setActionLoading((s) => ({ ...s, [taskId]: false })); }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Collector Dashboard</h1>
      </div>

      {loading && <div>Loading tasks…</div>}

      {!loading && tasks.length === 0 && <div>No tasks assigned or available.</div>}

      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.task_id} className="p-3 bg-white rounded shadow flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.patient_name} — {t.test_code}</div>
              <div className="text-sm text-gray-600">{t.appointment_date} {t.appointment_time} • {t.appointment_type}</div>
              <div className="text-sm">Status: {t.status}</div>
            </div>
            <div className="space-x-2">
              {t.status === 'pending' && <button className="px-3 py-1 border rounded" onClick={()=>assign(t.task_id)} disabled={!!actionLoading[t.task_id]}>{actionLoading[t.task_id] ? '…' : 'Assign to me'}</button>}
              {t.status !== 'collected' && <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={()=>collect(t.task_id)} disabled={!!actionLoading[t.task_id]}>{actionLoading[t.task_id] ? '…' : 'Mark Collected'}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
