import React, { useEffect, useMemo, useState } from 'react';
import { apiService } from '../../services/api';

export default function ResultForm({ appointmentTest, onClose, readOnly = false }) {
  const [panel, setPanel] = useState(null);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [serverFlags, setServerFlags] = useState(null);
  const [saved, setSaved] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(!!readOnly || !!appointmentTest.has_result);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [recommendation, setRecommendation] = useState('');

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
          if (res.interpretation) setInterpretation(res.interpretation);
          if (res.recommendations) setRecommendation(res.recommendations);
          setSaved(true);
        }
      } catch (e) {
        // if not found, ignore — user can create result
      }
    })();
    return () => { mounted = false; };
  }, [appointmentTest, isReadOnly]);

  function onChange(key, v) { if (isReadOnly) return; setValues(s => ({ ...s, [key]: v })); }

  const canGenerate = useMemo(() => {
    if (isReadOnly) return false;
    if (!panel) return false;
    const keys = (panel.parameters || []).map(p => p.key);
    if (keys.length === 0) return false;
    return keys.every(k => values[k] !== undefined && values[k] !== null && `${values[k]}`.trim() !== '');
  }, [isReadOnly, panel, values]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setAiError('');
    setAiLoading(true);
    try {
      const payload = {
        patient: {
          id: appointmentTest.patient_id,
          name: appointmentTest.patient_name,
          gender: appointmentTest.patient_gender,
          dob: appointmentTest.patient_dob,
          email: appointmentTest.patient_email,
          phone: appointmentTest.patient_phone,
        },
        test: {
          appointmentId: appointmentTest.appointment_id,
          appointmentTestId: appointmentTest.appointment_test_id,
          name: appointmentTest.test_name || appointmentTest.test_code,
          code: appointmentTest.test_code,
          date: appointmentTest.appointment_date,
          time: appointmentTest.appointment_time,
        },
        results: {
          panel: panel?.parameters || [],
          values,
        },
      };
      const r = await apiService.employee.generateInterpretation(payload);
      const data = r.data || r;
      if (!data.interpretation || !data.recommendation) throw new Error('AI response incomplete');
      setInterpretation(data.interpretation);
      setRecommendation(data.recommendation);
    } catch (e) {
      setAiError(e?.response?.data?.message || e?.message || 'Failed to generate interpretation');
    } finally {
      setAiLoading(false);
    }
  }

  async function submit() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        appointment_test_id: appointmentTest.appointment_test_id,
        result_values: values,
        interpretation,
        recommendation: recommendation,
      };
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

        {!isReadOnly && (
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
              disabled={!canGenerate || aiLoading}
              onClick={handleGenerate}
            >
              {aiLoading ? 'Generating…' : 'Generate Interpretation & Recommendation'}
            </button>
            {aiError && <span className="text-sm text-red-600">{aiError}</span>}
          </div>
        )}

        {aiLoading && (
          <div className="mt-2 p-4 border rounded bg-white">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-full" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-11/12" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-10/12" />
              <div className="pt-2 h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-9/12" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-8/12" />
            </div>
            <div className="mt-3 text-xs text-gray-500">Analyzing results with clinical guidelines…</div>
          </div>
        )}

        {(interpretation || recommendation) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Interpretation</label>
              <textarea
                className="w-full min-h-[140px] border rounded p-2"
                value={interpretation}
                onChange={e => setInterpretation(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recommendation</label>
              <textarea
                className="w-full min-h-[140px] border rounded p-2"
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1" onClick={onClose} disabled={saving}>{saved ? 'Close' : 'Cancel'}</button>
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={submit}
            disabled={saving || saved || isReadOnly || !(interpretation && recommendation)}
          >
            {saving ? 'Saving…' : (saved ? 'Saved' : 'Submit Results')}
          </button>
        </div>
      </div>
    </div>
  );
}
