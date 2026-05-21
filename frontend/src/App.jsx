import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import AIStudioPage from './pages/AIStudioPage';
import DocumentDetail from './pages/DocumentDetail';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import GoogleCallback from './pages/GoogleCallback';
import useAuthStore from './store/useAuthStore';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Sparkles } from 'lucide-react';

// ═══ DEV BYPASS: Set true to skip login ═══
const DEV_BYPASS_AUTH = false;

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  // ═══ DEV MODE: Skip auth, inject mock user ═══
  if (DEV_BYPASS_AUTH) {
    const store = useAuthStore.getState();
    if (!store.user) {
      useAuthStore.setState({
        user: {
          _id: 'dev-user-001',
          name: 'NeuroVault Dev',
          email: 'dev@neurovault.ai',
          avatar: 'N',
          role: 'admin',
          neural_profile: {
            learning_velocity: 1.25,
            total_concepts_mastered: 42,
            total_study_time_minutes: 1260,
          },
        },
        isAuthenticated: true,
        isLoading: false,
      });
    }
    return children;
  }

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-bg-primary)',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--c-accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}>
          <Sparkles size={24} color="white" strokeWidth={2} />
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: 'var(--c-text-tertiary)',
          fontWeight: 500,
        }}>
          Initializing NeuroVault...
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <ToastProvider maxToasts={5}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                <ErrorBoundary minimal><Dashboard /></ErrorBoundary>
              } />
              <Route path="documents" element={
                <ErrorBoundary minimal><DocumentsPage /></ErrorBoundary>
              } />
              <Route path="documents/:id" element={
                <ErrorBoundary minimal><DocumentDetail /></ErrorBoundary>
              } />
              <Route path="ai-studio" element={
                <ErrorBoundary minimal><AIStudioPage /></ErrorBoundary>
              } />
              <Route path="knowledge-graph" element={
                <ErrorBoundary minimal><KnowledgeGraphPage /></ErrorBoundary>
              } />
              <Route path="profile" element={
                <ErrorBoundary minimal><Profile /></ErrorBoundary>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
