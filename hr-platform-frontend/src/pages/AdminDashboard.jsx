import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Building2, CalendarClock } from 'lucide-react';
import Layout from '../components/common/Layout';
import MetricCard from '../components/common/MetricCard';
import Avatar from '../components/common/Avatar';
import { formatAction, formatDetails } from '../utils/audit';
import api from '../services/api';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2">
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-xs text-gray-500">
        Employees: <span className="font-medium text-accent">{payload[0].value}</span>
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [employeesRes, departmentsRes, leaveRes, auditRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/leave-requests?status=PENDING'),
        api.get('/audit-logs?limit=5'),
      ]);

      const departments = departmentsRes.data.departments;
      const chartData = departments.map((d) => ({
        name: d.name,
        employees: d._count.employees,
      }));

      setStats({
        totalEmployees: employeesRes.data.total,
        totalDepartments: departments.length,
        pendingLeave: leaveRes.data.total,
        recentAudit: auditRes.data.logs,
        chartData,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <p className="text-gray-400">Loading dashboard...</p>
      </Layout>
    );
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Total Employees" value={stats.totalEmployees} Icon={Users} accent="blue" />
        <MetricCard label="Departments" value={stats.totalDepartments} Icon={Building2} accent="teal" />
        <MetricCard label="Pending Leave Requests" value={stats.pendingLeave} Icon={CalendarClock} accent="amber" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Headcount by Department</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F2F6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F5F6FA' }} />
            <Bar dataKey="employees" fill="#2F6FED" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-[0_2px_16px_-4px_rgba(30,42,90,0.10)] overflow-hidden">
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-700">Recent Audit Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {stats.recentAudit.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={log.user.email} size={28} />
                      <span className="text-gray-800">{formatAction(log.action)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDetails(log)}</td>
                  <td className="px-6 py-3 text-gray-400 text-right">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {stats.recentAudit.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-400">No audit activity yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
