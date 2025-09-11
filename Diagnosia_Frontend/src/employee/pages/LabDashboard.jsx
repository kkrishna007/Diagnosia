import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import ResultForm from '../components/ResultForm';
import { useEmployeeAuth } from '../../context/EmployeeAuthContext';
import { useNavigate } from 'react-router-dom';

export default function LabDashboard() {
  const [worklist, setWorklist] = useState([]);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useEmployeeAuth();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const res = await apiService.employee.getLabWorklist();
      setWorklist(res.data || res);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load worklist');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function handleLogout() {
    logout();
    navigate('/employee/login');
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Lab Dashboard</h1>
        <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" onClick={handleLogout}>Logout</button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      {loading && <div>Loading…</div>}
  <div className="space-y-3">
        {worklist.length === 0 && !loading && <div>No work items</div>}
        {worklist.map((t) => (
          <div key={t.appointment_test_id} className="p-4 bg-white rounded shadow flex items-center justify-between">
            <div>
              <div className="font-semibold">{t.patient_name} — {t.test_name || t.test_code}</div>
              <div className="text-sm text-gray-500">#{t.appointment_id} · {t.appointment_date?.slice?.(0,10)}</div>
            </div>
            <div>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={() => setActive(t)}
              >
                {t.has_result ? 'View Result' : 'Enter Results'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <ResultForm
          appointmentTest={active}
          readOnly={active.has_result}
          onClose={() => { setActive(null); load(); }}
        />
      )}
    </div>
  );
}
