import { Bell, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

export default function Header() {
  const { user } = useAuthStore();

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--c-border)',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-xl)',
      position: 'relative',
      zIndex: 2,
    }}>
      {/* Search Bar */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
      }}>
        <Search size={16} style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--c-text-tertiary)',
        }} />
        <input
          type="text"
          placeholder="Search documents, concepts..."
          className="input input-with-icon"
          style={{
            height: 38,
            fontSize: '0.8125rem',
            paddingLeft: '2.25rem',
            background: 'var(--c-bg-secondary)',
            border: '1px solid var(--c-border)',
          }}
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        {/* Notification Bell */}
        <button style={{
          position: 'relative',
          background: 'var(--c-bg-card)',
          border: '1px solid var(--c-border)',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 38,
          height: 38,
          color: 'var(--c-text-secondary)',
          transition: 'all var(--duration-fast)',
          boxShadow: 'var(--shadow-xs)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--c-border-hover)';
          e.currentTarget.style.color = 'var(--c-text-primary)';
          e.currentTarget.style.background = 'var(--c-bg-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--c-border)';
          e.currentTarget.style.color = 'var(--c-text-secondary)';
          e.currentTarget.style.background = 'var(--c-bg-card)';
        }}
        >
          <Bell size={16} strokeWidth={1.5} />
          <div style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--c-accent)',
            boxShadow: '0 0 6px var(--c-accent)',
          }} />
        </button>

        {/* User Avatar */}
        <Link to="/profile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          padding: '0.375rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          textDecoration: 'none',
          transition: 'all var(--duration-fast)',
          border: '1px solid transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--c-bg-secondary)';
          e.currentTarget.style.borderColor = 'var(--c-border)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md)',
            background: 'var(--c-accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.8125rem',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
          }}>
            {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--c-text-primary)',
              lineHeight: 1.3,
            }}>
              {user?.name || 'User'}
            </span>
            <span style={{
              fontSize: '0.6875rem',
              color: 'var(--c-text-tertiary)',
            }}>
              Pro Member
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
