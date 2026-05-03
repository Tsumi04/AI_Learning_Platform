import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Camera, User, Mail, Lock, Shield, LogOut, Sparkles } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '', email: user?.email || '',
    currentPassword: '', newPassword: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleLogout = () => { logout(); navigate('/login'); };
  const handleSave = (e) => { e.preventDefault(); /* TODO: API call */ };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text-primary)', letterSpacing: '-0.02em' }}>Profile Settings</h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', marginTop: 4 }}>Manage your account and preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)' }}>
        {/* Left — Avatar Card */}
        <div className="bento-card" style={{ padding: 'var(--space-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-xl)', background: 'var(--c-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.75rem', fontWeight: 700, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)' }}>
              {user?.avatar || user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginTop: 2 }}>{user?.email || 'user@example.com'}</div>
          </div>
          <div style={{ width: '100%', height: 1, background: 'var(--c-border)', margin: 'var(--space-sm) 0' }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-success)', background: 'var(--c-success-glow)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', width: '100%', justifyContent: 'center' }}>
            <Shield size={14}/> Pro Member
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>

        {/* Right — Form */}
        <form className="bento-card" style={{ padding: 'var(--space-xl)' }} onSubmit={handleSave}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-lg)' }}>Personal Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-tertiary)' }}/>
                <input name="name" value={formData.name} onChange={handleChange} className="input" style={{ paddingLeft: '2.5rem' }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-tertiary)' }}/>
                <input name="email" value={formData.email} onChange={handleChange} type="email" className="input" style={{ paddingLeft: '2.5rem' }}/>
              </div>
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--c-border)', margin: 'var(--space-md) 0 var(--space-lg)' }}/>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-lg)' }}>Change Password</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-tertiary)' }}/>
                <input name="currentPassword" value={formData.currentPassword} onChange={handleChange} type="password" placeholder="••••••••" className="input" style={{ paddingLeft: '2.5rem' }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-tertiary)' }}/>
                <input name="newPassword" value={formData.newPassword} onChange={handleChange} type="password" placeholder="••••••••" className="input" style={{ paddingLeft: '2.5rem' }}/>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
