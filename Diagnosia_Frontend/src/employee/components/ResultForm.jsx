import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

export default function ResultForm({ appointmentTest, onClose, readOnly = false }) {
  const [panel, setPanel] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [serverFlags, setServerFlags] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(!!readOnly || !!appointmentTest.has_result);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const code = appointmentTest.test_code || appointmentTest.test_name || '';
        const r = await apiService.employee.getPanel(code);
        if (!mounted) return;
        setPanel(r.data || r);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Failed to load panel');
      }
    })();
    return () => { mounted = false; };
  }, [appointmentTest]);

  // If read-only or existing result present, fetch the saved result
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (isReadOnly) {
          const r = await apiService.employee.getTestResult(appointmentTest.appointment_test_id);
          if (!mounted) return;
          const res = r.data || r;
          setValues(res.result_values || {});
          setServerFlags(res.abnormal_flags || null);
          setSaved(true);
        }
      } catch (e) {
        // if not found, ignore — user can create result
      }
    })();
    return () => { mounted = false; };
  }, [appointmentTest, isReadOnly]);

  function onChange(key, v) { if (isReadOnly) return; setValues(s => ({ ...s, [key]: v })); }

  async function submit() {
    setSaving(true);
    setError('');
    try {
      const payload = { appointment_test_id: appointmentTest.appointment_test_id, result_values: values };
      const r = await apiService.employee.saveTestResult(payload);
      // server returns created test_result with abnormal_flags
      setServerFlags(r.data?.abnormal_flags || r.abnormal_flags || null);
      setSaved(true);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to save results');
    } finally { setSaving(false); }
  }

  if (error) return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-6 rounded max-w-lg w-full">
        <div className="text-red-600 mb-2">{error}</div>
        <div className="flex justify-end"><button className="px-3 py-1" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );

  if (!panel) return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white p-6 rounded">Loading panel…</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded max-w-3xl w-full">
        <h2 className="text-lg font-semibold mb-2">Enter Results — {panel.display_name}</h2>
        <div className="grid grid-cols-2 gap-3 max-h-72 overflow-auto mb-4">
          {panel.parameters.map(p => (
            <div key={p.key}>
              <label className="block text-sm font-medium">{p.label} {p.unit && <span className="text-xs text-gray-500">({p.unit})</span>}</label>
              <input className="mt-1 p-2 border rounded w-full" type="text" value={values[p.key] || ''} onChange={e => onChange(p.key, e.target.value)} readOnly={isReadOnly} />
              <div className="text-xs text-gray-400">{p.notes || ''}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1" onClick={onClose} disabled={saving}>{saved ? 'Close' : 'Cancel'}</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submit} disabled={saving || saved}>{saving ? 'Saving…' : (saved ? 'Saved' : 'Submit Results')}</button>
        </div>
      </div>
    </div>
  );
}
