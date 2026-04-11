import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-8">
      {/* Breadcrumb or left side empty */}
      <div className="flex-1"></div>

      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer text-gray-500 hover:text-gray-700">
          <Bell size={22} className="stroke-[1.5]"/>
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-white"></span>
        </div>

        <Link to="/profile" className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-xl transition-colors">
          <div className="w-10 h-10 rounded-full bg-primary flex flex-col items-center justify-center text-white font-medium shadow-sm">
            {user?.avatar || 'A'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-400">{user?.email || 'user@example.com'}</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
