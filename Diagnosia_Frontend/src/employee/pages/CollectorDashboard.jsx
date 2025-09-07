import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';

export default function CollectorDashboard() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    apiService.employee.getCollectorTasks()
      .then((res) => setTasks(res.data || res))
      .catch((e) => setError(e?.message || 'Failed to load tasks'));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Collector Dashboard</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <ul className="list-disc pl-5">
        {tasks.length === 0 ? <li>No tasks yet</li> : tasks.map((t, i) => (<li key={i}>{JSON.stringify(t)}</li>))}
      </ul>
    </div>
  );
}
