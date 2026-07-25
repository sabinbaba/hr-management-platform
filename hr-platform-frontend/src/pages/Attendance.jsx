import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

export default function Attendance() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPrivileged = user.role === 'ADMIN' || user.role === 'HR';

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (isPrivileged) {
        const res = await api.get('/employees');
        setEmployees(res.data.employees);
        setLoading(false);
      } else {
        await fetchRecords();
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (isPrivileged && selectedEmployeeId) {
      fetchRecords();
    }
  }, [selectedEmployeeId]);

  async function fetchRecords() {
    setLoading(true);
    try {
      const endpoint = isPrivileged ? `/attendance/${selectedEmployeeId}` : '/attendance/my';
      const res = await api.get(endpoint);
      setRecords(res.data.attendance);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    try {
      await api.post('/attendance/check-in');
      showToast('Checked in successfully.', 'success');
      await fetchRecords();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-in failed', 'error');
    }
  }

  async function handleCheckOut() {
    try {
      await api.post('/attendance/check-out');
      showToast('Checked out successfully.', 'success');
      await fetchRecords();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-out failed', 'error');
    }
  }

  return (
    <Layout title="Attendance">
      {isPrivileged && (
        <div className="bg-white p-4 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
          <label className="block text-sm text-gray-600 mb-1">Select employee</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">-- Choose an employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
        </div>
      )}

      {!isPrivileged && (
        <div className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6 flex items-center gap-4">
          <button
            onClick={handleCheckIn}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            className="bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Check Out
          </button>
        </div>
      )}

      {(!isPrivileged || selectedEmployeeId) && (
        loading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : (
          <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
            <div className="overflow-x-auto">
          <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Check In</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id}>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {new Date(rec.workDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      No attendance records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )
      )}
    </Layout>
  );
}
