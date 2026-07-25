import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const dashboardPathByRole = {
  ADMIN: '/admin',
  HR: '/hr',
  EMPLOYEE: '/employee',
};

export default function NotFound() {
  const { user } = useAuth();
  const homePath = user ? dashboardPathByRole[user.role] : '/login';

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-accent flex items-center justify-center mx-auto mb-6">
          <CompassIcon size={28} strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl font-semibold text-navy-900 mb-2">404</h1>
        <p className="text-gray-500 mb-8">
          This page doesn't exist, or you don't have access to it.
        </p>
        <Link
          to={homePath}
          className="inline-block bg-accent hover:bg-accent-hover text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Back to safety
        </Link>
      </div>
    </div>
  );
}
