import { LayoutGrid, FileText, Component, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
    { name: 'Documents', icon: FileText, path: '/documents' },
    { name: 'Flashcards', icon: Component, path: '/flashcards' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="w-64 h-full bg-white border-r border-gray-100 flex flex-col pt-6 pb-4">
      <div className="px-6 flex items-center mb-8 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
          <span className="text-sm">AI</span>
        </div>
        <h1 className="font-semibold text-gray-800 text-lg">AI Learning Assistant</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <item.icon size={20} className="stroke-[1.5]" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-gray-500 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors text-left">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Logout
        </button>
      </div>
    </div>
  );
}
