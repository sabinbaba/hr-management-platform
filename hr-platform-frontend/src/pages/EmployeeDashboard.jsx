import { useState, useEffect } from 'react';
import { Briefcase, DollarSign, CalendarClock } from 'lucide-react';
import Layout from '../components/common/Layout';
import MetricCard from '../components/common/MetricCard';
import { getGreeting } from '../utils/greeting';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [currentSalary, setCurrentSalary] = useState(null);
  const [myLeave, setMyLeave] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const profileRes = await api.get('/employees/my');
      const employeeId = profileRes.data.employee.id;

      const [salaryRes, leaveRes] = await Promise.all([
        api.get(`/salaries/${employeeId}/current`).catch(() => null),
        api.get('/leave-requests/my'),
      ]);

      setProfile(profileRes.data.employee);
      setCurrentSalary(salaryRes?.data.salary || null);
      setMyLeave(leaveRes.data.leaveRequests);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Layout title="Employee Dashboard">
        <p className="text-gray-400">Loading dashboard...</p>
      </Layout>
    );
  }

  const pendingCount = myLeave.filter((r) => r.status === 'PENDING').length;
  const firstName = profile.fullName.split(' ')[0];

  return (
    <Layout title="Employee Dashboard">
      <p className="text-gray-500 mb-6">
        {getGreeting()}, <span className="font-semibold text-navy-900">{firstName}</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Job Title" value={profile.jobTitle} sublabel={profile.department.name} Icon={Briefcase} accent="navy" />
        <MetricCard
          label="Current Salary"
          value={currentSalary ? formatCurrency(currentSalary.amount) : '—'}
          Icon={DollarSign}
          accent="teal"
        />
        <MetricCard label="Pending Leave Requests" value={pendingCount} Icon={CalendarClock} accent="amber" />
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">My Recent Leave Requests</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <tbody>
            {myLeave.slice(0, 5).map((req) => (
              <tr key={req.id}>
                <td className="px-6 py-3 text-gray-800">
                  {new Date(req.startDate).toLocaleDateString()} – {new Date(req.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-gray-400 text-right">{req.status}</td>
              </tr>
            ))}
            {myLeave.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-400">No leave requests yet.</td>
              </tr>
            )}
          </tbody>
        </table>
          </div>
      </div>
    </Layout>
  );
}
