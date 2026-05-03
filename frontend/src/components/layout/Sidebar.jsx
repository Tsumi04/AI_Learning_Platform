import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, FileText, Brain, User, Sparkles, ChevronRight } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutGrid, path: '/dashboard' },
  { name: 'Documents', icon: FileText, path: '/documents' },
  { name: 'AI Studio', icon: Brain, path: '/ai-studio' },
  { name: 'Profile', icon: User, path: '/profile' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      zIndex: 2,
      borderRight: '1px solid var(--c-border)',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
    }}>
      {/* Brand */}
      <div style={{
        padding: 'var(--space-xl) var(--space-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: 'var(--c-accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
        }}>
          <Sparkles size={20} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            NeuroVault
          </div>
          <div style={{
            fontSize: '0.6875rem',
            color: 'var(--c-text-tertiary)',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            AI Learning
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0 var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.name}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--c-text-primary)' : 'var(--c-text-secondary)',
                background: isActive ? 'var(--c-accent-glow)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
                transition: 'all var(--duration-normal) var(--ease-out-expo)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--c-bg-glass)';
                  e.currentTarget.style.color = 'var(--c-text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--c-text-secondary)';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: -1,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--c-accent-gradient)',
                }} />
              )}
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} 
                style={{ color: isActive ? 'var(--c-accent-light)' : 'inherit' }} />
              <span>{item.name}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — Version Badge */}
      <div style={{
        padding: 'var(--space-lg)',
        borderTop: '1px solid var(--c-border)',
      }}>
        <div style={{
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--c-bg-glass)',
          border: '1px solid var(--c-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--c-success)',
            boxShadow: '0 0 8px var(--c-success)',
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)', fontWeight: 500 }}>
            v1.0 — White-Box AI
          </span>
        </div>
      </div>
    </aside>
  );
}
