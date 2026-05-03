import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!parallaxRef.current) return;
      const orbs = parallaxRef.current.querySelectorAll('.parallax-orb');
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 15;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="noise-overlay" style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--c-bg-primary)',
    }}>
      {/* Left — Parallax Visual */}
      <div ref={parallaxRef} style={{
        flex: 1,
        display: 'none',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #111128 100%)',
      }}
      className="login-visual-panel"
      >
        {/* Parallax Orbs */}
        <div className="parallax-orb" style={{
          position: 'absolute', top: '10%', left: '20%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          transition: 'transform 0.1s ease-out',
        }} />
        <div className="parallax-orb" style={{
          position: 'absolute', bottom: '15%', right: '10%',
          width: 350, height: 350, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
          transition: 'transform 0.15s ease-out',
        }} />
        <div className="parallax-orb" style={{
          position: 'absolute', top: '50%', right: '30%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          transition: 'transform 0.2s ease-out',
        }} />

        {/* Content */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: '3rem',
        }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: 'var(--radius-xl)',
            background: 'var(--c-accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-xl)',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)',
          }}>
            <Sparkles size={28} color="white" strokeWidth={2} />
          </div>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: 'var(--c-text-primary)',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            marginBottom: 'var(--space-lg)',
            maxWidth: 500,
          }}>
            Accelerate your learning with{' '}
            <span className="text-gradient-animated">AI intelligence</span>
          </h1>
          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--c-text-secondary)',
            textAlign: 'center',
            maxWidth: 420,
            lineHeight: 1.7,
          }}>
            White-box AI that processes your documents, builds knowledge graphs, 
            and creates personalized learning paths — all running 100% locally.
          </p>

          {/* Stats Row */}
          <div style={{
            display: 'flex', gap: 'var(--space-lg)',
            marginTop: 'var(--space-2xl)',
          }}>
            {[
              { value: '0', label: 'External APIs' },
              { value: '100%', label: 'White-Box' },
              { value: 'Local', label: 'AI Engine' },
            ].map(s => (
              <div key={s.label} className="glass" style={{
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: s.value === '100%' ? 'var(--c-accent-light)' : 'var(--c-text-primary)',
                }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        position: 'relative',
      }}>
        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile Brand */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
            marginBottom: 'var(--space-2xl)',
          }} className="login-mobile-brand">
            <div style={{
              width: 44, height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--c-accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            }}>
              <Sparkles size={20} color="white" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '1.25rem', fontWeight: 700,
              color: 'var(--c-text-primary)',
              letterSpacing: '-0.02em',
            }}>
              NeuroVault
            </span>
          </div>

          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: 8,
          }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: 'var(--c-accent-light)',
              textDecoration: 'none',
              fontWeight: 500,
            }}>Sign up free</Link>
          </p>

          {error && (
            <div className="animate-scale-in" style={{
              padding: '0.875rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--c-error-glow)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--c-error)',
              fontSize: '0.875rem',
              marginBottom: 'var(--space-lg)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--c-text-tertiary)',
                }} />
                <input
                  className="input input-with-icon"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--c-text-tertiary)',
                }} />
                <input
                  className="input input-with-icon"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                marginTop: 'var(--space-sm)',
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ArrowRight size={18} />}
            </button>

            {/* Divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
              margin: 'var(--space-sm) 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: 'var(--c-border)' }} />
            </div>

            {/* Google Sign In */}
            <a
              href="http://localhost:5000/api/auth/google"
              className="btn btn-ghost btn-lg"
              style={{
                width: '100%',
                gap: 'var(--space-md)',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </a>
          </form>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .login-visual-panel { display: flex !important; }
          .login-mobile-brand { display: flex !important; }
        }
        @media (max-width: 1023px) {
          .login-mobile-brand { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
