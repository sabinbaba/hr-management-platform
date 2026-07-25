import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

function StatusPill({ status }) {
  const styles = {
    PENDING: 'bg-amber-50 text-amber-700',
    APPROVED: 'bg-teal-50 text-teal-700',
    REJECTED: 'bg-red-50 text-red-700',
  };

  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default function LeaveRequests() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPrivileged = user.role === 'ADMIN' || user.role === 'HR';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function fetchRequests(filter) {
    setLoading(true);
    if (isPrivileged) {
      const res = await api.get('/leave-requests', { params: { status: filter || undefined } });
      setRequests(res.data.leaveRequests);
    } else {
      const res = await api.get('/leave-requests/my');
      setRequests(res.data.leaveRequests);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/leave-requests', { startDate, endDate, reason });
      showToast('Leave request submitted.', 'success');
      setStartDate('');
      setEndDate('');
      setReason('');
      await fetchRequests(statusFilter);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecision(id, status) {
    try {
      await api.patch(`/leave-requests/${id}`, { status });
      showToast(`Request ${status.toLowerCase()}.`, 'success');
      await fetchRequests(statusFilter);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update request', 'error');
    }
  }

  return (
    <Layout title="Leave Requests">
      {!isPrivileged && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Submit a leave request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <label className="block text-sm text-gray-600 mb-1">Reason (optional)</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </form>
      )}

      {isPrivileged && (
        <div className="flex gap-2 mb-4">
          {['', 'PENDING', 'APPROVED', 'REJECTED'].map((option) => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === option
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option || 'All'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={4} cols={isPrivileged ? 5 : 3} />
      ) : (
        <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {isPrivileged && <th className="text-left px-6 py-3 font-medium text-gray-500">Employee</th>}
                <th className="text-left px-6 py-3 font-medium text-gray-500">Dates</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Reason</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                {isPrivileged && <th className="px-6 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  {isPrivileged && (
                    <td className="px-6 py-4 font-medium text-gray-800">{req.employee.fullName}</td>
                  )}
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{req.reason || '—'}</td>
                  <td className="px-6 py-4"><StatusPill status={req.status} /></td>
                  {isPrivileged && (
                    <td className="px-6 py-4 text-right space-x-3">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleDecision(req.id, 'APPROVED')}
                            className="text-sm text-teal-600 hover:text-teal-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(req.id, 'REJECTED')}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={isPrivileged ? 5 : 3} className="px-6 py-8 text-center text-gray-400">
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </Layout>
  );
}
