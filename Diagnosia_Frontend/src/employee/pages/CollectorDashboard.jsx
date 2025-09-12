import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';

function CollectorDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();

  function handleLogout() {
  // use context logout helper which clears storage and state
  try { logout(); } catch (e) { localStorage.removeItem('employee_token'); }
  navigate('/employee/login');
  }

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
      const resp = await apiService.employee.collectTask(taskId);
      // optimistic update: mark the matching task as collected locally so UI updates immediately
      setTasks((prev) => prev.map(t => {
        const id = t.task_id || t.appointment_test_id || null;
        if (id === taskId) {
          return { ...t, status: 'sample_collected', test_status: 'sample_collected' };
        }
        return t;
      }));
      setInfo('Marked collected');
      setTimeout(() => setInfo(''), 2500);
      // refresh from server in background
      load();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || e?.message || 'Failed to mark collected');
    } finally { setActionLoading((s) => ({ ...s, [taskId]: false })); }
  }

  // Only show appointments with status 'booked'
  const visibleTasks = tasks.filter((t) => {
    const s = String(t.appointment_status || t.status || t.test_status || '').toLowerCase();
    return s === 'booked';
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Collector Dashboard</h1>
        <button
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 ml-4"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
      {loading && <div>Loading tasks…</div>}
  {info && <div className="text-green-700 mb-2">{info}</div>}
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {!loading && visibleTasks.length === 0 && <div>No booked appointments.</div>}
      <div className="space-y-3">
        {visibleTasks.map((t) => {
          // prefer task_id (collection_tasks) otherwise use appointment_test_id
          const id = t.task_id || t.appointment_test_id || null;
          const isCollected = ['collected', 'sample_collected'].includes(t.status) || ['collected', 'sample_collected'].includes(t.test_status);
          return (
            <div
              key={id}
              className="p-5 bg-white rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between border border-gray-200 mb-3"
            >
              <div className="flex-1">
                {/* Address and time at top for collector priority */}
                {t.appointment_type === 'home_collection' && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-pink-700 text-base font-bold">📍 {t.collection_address || (t.special_instructions && t.special_instructions.replace(/^Collection Address:\s*/i, ''))}</span>
                  </div>
                )}
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">#{t.appointment_id}</span>
                  <span className="text-base text-gray-800 font-semibold">{t.patient_name}</span>
                  <span className="text-xs text-gray-500">({t.patient_gender}, {t.patient_dob?.slice(0, 10)})</span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-blue-700">🕒 {t.appointment_date?.slice(0, 10)} {t.appointment_time?.slice(0, 5)}</span>
                  <span className="ml-2 text-orange-700">{t.appointment_type?.replace('_', ' ')}</span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="font-semibold text-gray-700">Status:</span>
                  <span className="text-green-700 font-bold">{t.status || t.test_status || t.appointment_status}</span>
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                  <span>📞 {t.patient_phone}</span>
                  <span>✉️ {t.patient_email}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-800">
                  <span className="font-semibold text-green-700">🧪 {t.test_name || t.test_code}</span>
                  {t.test_price && (
                    <span className="ml-2 text-gray-600 font-semibold">₹{Number(t.test_price).toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 mt-3 md:mt-0">
                {t.task_id && t.status === 'pending' && (
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() => assign(t.task_id)}
                    disabled={!!actionLoading[t.task_id]}
                  >
                    {actionLoading[t.task_id] ? '…' : 'Assign to me'}
                  </button>
                )}
                {id && !isCollected && (
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => collect(id)}
                    disabled={!!actionLoading[id]}
                  >
                    {actionLoading[id] ? '…' : 'Mark Collected'}
                  </button>
                )}
                {id && isCollected && (
                  <div className="px-3 py-1 bg-blue-50 text-blue-800 rounded text-sm font-medium">Collected</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CollectorDashboard;
