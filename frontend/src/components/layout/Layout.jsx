import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="noise-overlay" style={{ display: 'flex', height: '100vh', position: 'relative' }}>
      {/* Ambient parallax background */}
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
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
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
