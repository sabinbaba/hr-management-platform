import { useState, useEffect } from 'react';
import { Search, Users } from 'lucide-react';
import Layout from '../components/common/Layout';
import Avatar from '../components/common/Avatar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/common/Button';
import { TableSkeleton } from '../components/common/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Full name is required';
  if (!form.jobTitle.trim()) errors.jobTitle = 'Job title is required';
  if (!form.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 8) {
    errors.password = 'Must be at least 8 characters';
  }
  if (!form.departmentId) errors.departmentId = 'Select a department';
  if (!form.hireDate) errors.hireDate = 'Hire date is required';
  return errors;
}

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-600 mt-1">{message}</p>;
}

export default function Employees() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    jobTitle: '',
    departmentId: '',
    hireDate: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function fetchEmployees(currentSearch) {
    setLoading(true);
    const res = await api.get('/employees', { params: { search: currentSearch || undefined } });
    setEmployees(res.data.employees);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const departmentsRes = await api.get('/departments');
      setDepartments(departmentsRes.data.departments);
      await fetchEmployees('');
    }
    init();
  }, []);

  useEffect(() => {
    fetchEmployees(search);
  }, [search]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/employees', form);
      setForm({ email: '', password: '', fullName: '', jobTitle: '', departmentId: '', hireDate: '' });
      setFieldErrors({});
      setShowForm(false);
      showToast(`${form.fullName} was added.`, 'success');
      await fetchEmployees(search);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create employee', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    const emp = pendingDelete;
    setPendingDelete(null);
    try {
      await api.delete(`/employees/${emp.id}`);
      showToast(`${emp.fullName} was deleted.`, 'success');
      await fetchEmployees(search);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete employee', 'error');
    }
  }

  function inputClass(field) {
    return `w-full border rounded-lg px-3 py-2 text-sm ${
      fieldErrors[field] ? 'border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-300'
    }`;
  }

  return (
    <Layout title="Employees">
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)} className="whitespace-nowrap">
          {showForm ? 'Cancel' : '+ New Employee'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} noValidate className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Create employee</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={inputClass('fullName')}
              />
              <FieldError message={fieldErrors.fullName} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Job title</label>
              <input
                type="text"
                value={form.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className={inputClass('jobTitle')}
              />
              <FieldError message={fieldErrors.jobTitle} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={inputClass('email')}
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Temporary password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={inputClass('password')}
              />
              <FieldError message={fieldErrors.password} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Department</label>
              <select
                value={form.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                className={inputClass('departmentId')}
              >
                <option value="">-- Select department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <FieldError message={fieldErrors.departmentId} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hire date</label>
              <input
                type="date"
                value={form.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
                className={inputClass('hireDate')}
              />
              <FieldError message={fieldErrors.hireDate} />
            </div>
          </div>

          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create employee'}
          </Button>
        </form>
      )}

      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)]">
          <EmptyState
            icon={Users}
            message={search ? `No employees match "${search}".` : 'No employees found.'}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Job Title</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Department</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Hire Date</th>
                  {user.role === 'ADMIN' && <th className="px-6 py-3"></th>}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.fullName} size={32} />
                        <span className="font-medium text-gray-800">{emp.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{emp.jobTitle}</td>
                    <td className="px-6 py-4 text-gray-600">{emp.department.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(emp.hireDate).toLocaleDateString()}
                    </td>
                    {user.role === 'ADMIN' && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setPendingDelete(emp)}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete employee"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.fullName}? This permanently removes their record and cannot be undone.`
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
