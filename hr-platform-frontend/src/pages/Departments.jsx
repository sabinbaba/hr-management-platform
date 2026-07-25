import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Layout from '../components/common/Layout';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

export default function Departments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchDepartments() {
    setLoading(true);
    const res = await api.get('/departments');
    setDepartments(res.data.departments);
    setLoading(false);
  }

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', { name: newName });
      showToast(`${newName} department created.`, 'success');
      setNewName('');
      await fetchDepartments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create department', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const dept = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/departments/${dept.id}`);
      showToast(`${dept.name} was deleted.`, 'success');
      await fetchDepartments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete department', 'error');
    }
  }

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Departments">
      <div className="relative max-w-sm mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {user.role === 'ADMIN' && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6 flex gap-3 items-start">
          <div className="flex-1">
            <input
              type="text"
              placeholder="New department name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Department'}
          </button>
        </form>
      )}

      {loading ? (
        <TableSkeleton rows={3} cols={2} />
      ) : (
        <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Employees</th>
                {user.role === 'ADMIN' && <th className="px-6 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map((dept) => (
                <tr key={dept.id}>
                  <td className="px-6 py-4 font-medium text-gray-800">{dept.name}</td>
                  <td className="px-6 py-4 text-gray-600">{dept._count.employees}</td>
                  {user.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setPendingDelete(dept)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredDepartments.length === 0 && (
                <tr>
                  <td colSpan={user.role === 'ADMIN' ? 3 : 2} className="px-6 py-8 text-center text-gray-400">
                    {searchTerm ? `No departments match "${searchTerm}".` : 'No departments found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete department"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.name}? This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Layout>
  );
}
