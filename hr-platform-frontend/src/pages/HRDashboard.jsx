import { useState, useEffect } from 'react';
import Layout from '../components/common/Layout';
import MetricCard from '../components/common/MetricCard';
import api from '../services/api';

export default function HRDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [employeesRes, leaveRes] = await Promise.all([
        api.get('/employees'),
        api.get('/leave-requests?status=PENDING'),
      ]);

      setStats({
        totalEmployees: employeesRes.data.total,
        pendingLeave: leaveRes.data.total,
        recentEmployees: employeesRes.data.employees.slice(0, 5),
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout title="HR Dashboard">
        <p className="text-gray-400">Loading dashboard...</p>
      </Layout>
    );
  }

  return (
    <Layout title="HR Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <MetricCard label="Total Employees" value={stats.totalEmployees} />
        <MetricCard label="Pending Leave Requests" value={stats.pendingLeave} />
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Recently Added Employees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <tbody>
            {stats.recentEmployees.map((emp) => (
              <tr key={emp.id} className="border-b border-gray-100 last:border-0">
                <td className="px-6 py-3 font-medium text-gray-800">{emp.fullName}</td>
                <td className="px-6 py-3 text-gray-500">{emp.jobTitle}</td>
                <td className="px-6 py-3 text-gray-400 text-right">{emp.department.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
      </div>
    </Layout>
  );
}
