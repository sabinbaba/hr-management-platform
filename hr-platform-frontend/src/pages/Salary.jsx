import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function Salary() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPrivileged = user.role === 'ADMIN' || user.role === 'HR';

  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      if (isPrivileged) {
        const res = await api.get('/employees');
        setEmployees(res.data.employees);
        setLoading(false);
      } else {
        const res = await api.get('/employees/my');
        setSelectedEmployeeId(res.data.employee.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    fetchHistory(selectedEmployeeId);
  }, [selectedEmployeeId]);

  async function fetchHistory(employeeId) {
    setLoading(true);
    const res = await api.get(`/salaries/${employeeId}/history`);
    setHistory(res.data.salaries);
    setLoading(false);
  }

  async function handleAddSalary(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/salaries/${selectedEmployeeId}`, { amount, effectiveDate });
      showToast('Salary record added.', 'success');
      setAmount('');
      setEffectiveDate('');
      await fetchHistory(selectedEmployeeId);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to add salary record', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const currentSalary = history[0];

  return (
    <Layout title="Salary">
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

      {selectedEmployeeId && (
        <>
          {currentSalary && (
            <div className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
              <p className="text-sm text-gray-500 mb-1">Current salary</p>
              <p className="text-2xl font-semibold text-navy-900">{formatCurrency(currentSalary.amount)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Effective {new Date(currentSalary.effectiveDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {isPrivileged && (
            <form onSubmit={handleAddSalary} className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Add salary record</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Effective date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add record'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-400">Loading history...</p>
          ) : (
            <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
              <div className="overflow-x-auto">
          <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Amount</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Effective Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((sal) => (
                    <tr key={sal.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-4 font-medium text-gray-800">{formatCurrency(sal.amount)}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(sal.effectiveDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
