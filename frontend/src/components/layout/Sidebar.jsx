/**
 * NeuroVault — Sidebar Navigation
 *
 * Desktop (>768px): luôn hiển thị bên trái, width cố định.
 * Mobile (≤768px): overlay trượt từ trái, có backdrop close.
 * Props:
 *   isOpen  — boolean, điều khiển overlay trên mobile.
 *   onClose — callback đóng sidebar khi chọn menu item trên mobile.
 */
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, Brain, Network, User, Sparkles, ChevronRight, X } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { name: 'Documents', icon: FileText, path: '/documents' },
  { name: 'AI Studio', icon: Brain, path: '/ai-studio' },
  { name: 'Knowledge Graph', icon: Network, path: '/knowledge-graph' },
  { name: 'Profile', icon: User, path: '/profile' },
];

export default function Sidebar({ isOpen = false, onClose }) {
  const location = useLocation();

  const handleNavClick = () => {
    // Đóng sidebar trên mobile khi chọn menu item
    if (onClose && window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Sparkles size={20} color="white" strokeWidth={2.5} />
        </div>
        <div className="sidebar-brand-text">
          <div className="sidebar-brand-name">NeuroVault</div>
          <div className="sidebar-brand-sub">AI Learning</div>
        </div>
        {/* Nút đóng chỉ hiện trên mobile */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={handleNavClick}
            >
              {isActive && <div className="sidebar-active-indicator" />}
              <item.icon
                size={18}
                strokeWidth={isActive ? 2 : 1.5}
                className="sidebar-nav-icon"
              />
              <span>{item.name}</span>
              {isActive && <ChevronRight size={14} className="sidebar-nav-chevron" />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — Version Badge */}
      <div className="sidebar-footer">
        <div className="sidebar-version">
          <div className="sidebar-version-dot" />
          <span>v1.0 — White-Box AI</span>
        </div>
      </div>
    </aside>
  );
}
