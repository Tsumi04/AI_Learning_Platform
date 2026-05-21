/**
 * NeuroVault — Header Bar
 *
 * Desktop: search bar + actions.
 * Mobile: hamburger menu + brand + actions (compact).
 * Props:
 *   onMenuToggle — callback mở/đóng sidebar overlay.
 */
import { Bell, Search, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import ThemeToggle from './ThemeToggle';

export default function Header({ onMenuToggle }) {
  const { user } = useAuthStore();

  return (
    <header className="app-header">
      {/* Left section */}
      <div className="header-left">
        {/* Hamburger — chỉ hiện trên mobile */}
        <button
          className="header-menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>

        {/* Search Bar */}
        <div className="header-search">
          <Search size={16} className="header-search-icon" />
          <input
            type="text"
            placeholder="Search documents, concepts..."
            className="input input-with-icon"
            id="header-search-input"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="header-actions">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notification Bell */}
        <button className="header-icon-btn" aria-label="Notifications">
          <Bell size={16} strokeWidth={1.5} />
          <div className="header-notif-dot" />
        </button>

        {/* User Avatar */}
        <Link to="/profile" className="header-user-link">
          <div className="header-avatar">
            {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="header-user-info">
            <span className="header-user-name">
              {user?.name || 'User'}
            </span>
            <span className="header-user-role">
              Pro Member
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
