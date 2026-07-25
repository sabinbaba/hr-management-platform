import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Layout from '../components/common/Layout';
import Avatar from '../components/common/Avatar';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../hooks/useToast';
import { formatAction, formatDetails } from '../utils/audit';
import api from '../services/api';

const ACTION_OPTIONS = ['', 'LEAVE_REQUEST_APPROVED', 'LEAVE_REQUEST_REJECTED'];

export default function AuditLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => setUserSearch(userSearchInput), 300);
    return () => clearTimeout(timer);
  }, [userSearchInput]);

  useEffect(() => {
    setPage(1);
  }, [actionFilter, userSearch]);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, userSearch]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: {
          page,
          limit,
          action: actionFilter || undefined,
          userEmail: userSearch || undefined,
        },
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <Layout title="Audit Logs">
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative max-w-xs flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by user email..."
            value={userSearchInput}
            onChange={(e) => setUserSearchInput(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt ? formatAction(opt) : 'All actions'}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">User</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Action</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Details</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-500">When</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={log.user.email} size={28} />
                          <div>
                            <p className="font-medium text-gray-800 leading-tight">{log.user.email}</p>
                            <p className="text-xs text-gray-400">{log.user.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-800">{formatAction(log.action)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDetails(log)}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                        No matching audit activity.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
