import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', position: 'relative', background: 'var(--c-bg-primary)' }}>
      {/* Soft ambient background */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
      </div>

      <Sidebar />
      
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        <Header />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-xl)',
          background: 'var(--c-bg-primary)',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
