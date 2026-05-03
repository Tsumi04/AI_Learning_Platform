import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { User, Mail, Lock, Shield, LogOut, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user, logout, updateProfile, changePassword, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '', email: user?.email || '',
    currentPassword: '', newPassword: '',
  });
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleLogout = () => { logout(); navigate('/login'); };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus(null);

    // Save profile info
    if (formData.name !== user?.name || formData.email !== user?.email) {
      const result = await updateProfile({
        name: formData.name,
        email: formData.email,
      });
      if (!result.success) {
        setSaveStatus('error');
        setStatusMessage(result.error || 'Failed to update profile');
        return;
      }
    }

    // Change password if provided
    if (formData.currentPassword && formData.newPassword) {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      if (!result.success) {
        setSaveStatus('error');
        setStatusMessage(result.error || 'Failed to change password');
        return;
      }
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
    }

    setSaveStatus('success');
    setStatusMessage('Changes saved successfully');
    setTimeout(() => setSaveStatus(null), 3000);
  };

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

          {/* Neural Profile Stats */}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Concepts Mastered</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>{user?.neural_profile?.total_concepts_mastered || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Study Time</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>{Math.round((user?.neural_profile?.total_study_time_minutes || 0) / 60)}h</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--c-text-tertiary)' }}>Learning Velocity</span>
              <span style={{ color: 'var(--c-text-primary)', fontWeight: 600 }}>{user?.neural_profile?.learning_velocity?.toFixed(2) || '1.00'}x</span>
            </div>
          </div>

          <div style={{ width: '100%', height: 1, background: 'var(--c-border)', margin: 'var(--space-sm) 0' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-success)', background: 'var(--c-success-glow)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', width: '100%', justifyContent: 'center' }}>
            <Shield size={14}/> {user?.role === 'admin' ? 'Admin' : 'Active Member'}
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            <LogOut size={14}/> Sign Out
          </button>
        </div>

        {/* Right — Form */}
        <form className="bento-card" style={{ padding: 'var(--space-xl)' }} onSubmit={handleSaveProfile}>
          {/* Status Message */}
          {saveStatus && (
            <div className="animate-fade-in" style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-lg)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: saveStatus === 'success' ? 'var(--c-success-glow)' : 'var(--c-error-glow)',
              color: saveStatus === 'success' ? 'var(--c-success)' : 'var(--c-error)',
              fontSize: '0.8125rem', fontWeight: 500,
            }}>
              {saveStatus === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
              {statusMessage}
            </div>
          )}

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
            <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ opacity: isLoading ? 0.6 : 1 }}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
