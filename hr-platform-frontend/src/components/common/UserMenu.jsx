import { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import Avatar from './Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-[0_4px_16px_-4px_rgba(30,42,90,0.2)] overflow-hidden">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Avatar name={user?.email || '?'} size={32} />
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
      </button>
    </div>
  );
}
