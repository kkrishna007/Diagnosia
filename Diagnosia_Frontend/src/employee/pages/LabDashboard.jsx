import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

export default function LabDashboard() {
  const [worklist, setWorklist] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    apiService.employee.getLabWorklist()
      .then((res) => setWorklist(res.data || res))
      .catch((e) => setError(e?.message || 'Failed to load worklist'));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Lab Dashboard</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <ul className="list-disc pl-5">
        {worklist.length === 0 ? <li>No work items</li> : worklist.map((t, i) => (<li key={i}>{JSON.stringify(t)}</li>))}
      </ul>
    </div>
  );
}
