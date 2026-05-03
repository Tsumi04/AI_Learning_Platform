import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import useAuthStore from './store/useAuthStore';
import { Sparkles } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="noise-overlay" style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg-primary)',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}>
        <div className="ambient-bg">
          <div className="ambient-orb ambient-orb-1" />
          <div className="ambient-orb ambient-orb-2" />
        </div>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--c-accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-glow 2s ease-in-out infinite',
          position: 'relative',
          zIndex: 1,
        }}>
          <Sparkles size={24} color="white" strokeWidth={2} />
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--c-text-tertiary)',
          fontWeight: 500,
          position: 'relative',
          zIndex: 1,
        }}>
          Initializing NeuroVault...
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

import GoogleCallback from './pages/GoogleCallback';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="documents" element={<Dashboard />} />
          <Route path="documents/:id" element={<DocumentDetail />} />
          <Route path="ai-studio" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
