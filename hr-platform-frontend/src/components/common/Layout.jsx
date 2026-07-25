import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserMenu from './UserMenu';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  ClipboardList,
} from 'lucide-react';

const mainNavItems = [
  { to: '/employees', label: 'Employees', Icon: Users, roles: ['ADMIN', 'HR'] },
  { to: '/departments', label: 'Departments', Icon: Building2, roles: ['ADMIN', 'HR'] },
  { to: '/leave-requests', label: 'Leave Requests', Icon: CalendarDays, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
  { to: '/attendance', label: 'Attendance', Icon: Clock, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
  { to: '/salary', label: 'Salary', Icon: DollarSign, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
  { to: '/documents', label: 'Documents', Icon: FileText, roles: ['ADMIN', 'HR', 'EMPLOYEE'] },
];

const dashboardPathByRole = {
  ADMIN: '/admin',
  HR: '/hr',
  EMPLOYEE: '/employee',
};

const pageDescriptions = {
  'Admin Dashboard': 'Organization-wide overview',
  'HR Dashboard': 'Team and leave overview',
  'Employee Dashboard': 'Your personal overview',
  Employees: 'Manage employee records',
  Departments: 'Organize your teams',
  'Leave Requests': 'Submit and review time off',
  Attendance: 'Track daily check-ins',
  Salary: 'Compensation and history',
  Documents: 'Employee files and uploads',
  'Audit Logs': 'System activity trail',
};

function NavItem({ to, label, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-navy-900 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100'
        }`
      }
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      {label}
    </NavLink>
  );
}

export default function Layout({ children, title }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleNavItems = mainNavItems.filter((item) => item.roles.includes(user?.role));

  useEffect(() => {
    document.title = title ? `${title} · HR Platform` : 'HR Platform';
  }, [title]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-canvas flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 z-20 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-64 bg-white flex flex-col shadow-[6px_0_24px_-2px_rgba(30,42,90,0.25)] fixed md:static inset-y-0 left-0 z-30 transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-6 py-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-navy-900 flex items-center justify-center text-white font-bold text-sm">
              HR
            </div>
            <h1 className="text-lg font-semibold text-navy-900">HR Platform</h1>
          </div>
          <button onClick={closeMobile} className="md:hidden text-gray-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Main Menu
          </p>
          <NavItem to={dashboardPathByRole[user?.role] || '/login'} label="Dashboard" Icon={LayoutDashboard} onClick={closeMobile} />
          {visibleNavItems.map((item) => (
            <NavItem key={item.to} {...item} onClick={closeMobile} />
          ))}

          {(user?.role === 'ADMIN' || user?.role === 'HR') && (
            <>
              <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide mt-6 mb-2">
                Reports
              </p>
              <NavItem to="/audit-logs" label="Audit Logs" Icon={ClipboardList} onClick={closeMobile} />
            </>
          )}
        </nav>

        <div className="px-3 py-3">
          <UserMenu />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white px-4 md:px-8 py-5 shadow-[0_6px_24px_-2px_rgba(30,42,90,0.25)] sticky top-0 z-10 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-gray-500">
            <Menu size={22} />
          </button>
          <div>
            <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
              {pageDescriptions[title] || 'Overview'}
            </p>
            <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
