import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText, Upload, Brain, Zap, TrendingUp,
  Clock, ArrowRight, Plus, Sparkles, BookOpen,
  Target, Flame, Activity, BarChart3, Network,
  Layers, MessageSquare,
} from 'lucide-react';
import { documentsAPI, healthAPI, aiAPI } from '../services/api';
import useAuthStore from '../store/useAuthStore';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [aiStats, setAiStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    gateway: 'checking',
    aiCore: 'checking',
    processing: 'idle',
  });

  useEffect(() => {
    loadDocuments();
    checkSystemHealth();
    loadAIStats();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    const gatewayData = await healthAPI.checkGateway();
    const aiCoreData = await healthAPI.checkAICore();
    setSystemStatus({
      gateway: gatewayData ? 'online' : 'offline',
      aiCore: aiCoreData?.ai_core === 'online' ? 'online' : 'offline',
      processing: 'idle',
    });
  };

  const loadAIStats = async () => {
    const stats = await aiAPI.getStats();
    setAiStats(stats);
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsAPI.list(1, 10);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    {
      label: 'Documents',
      value: documents.length || aiStats?.total_documents || 0,
      icon: FileText,
      color: 'var(--c-accent)',
      glow: 'var(--c-accent-glow)',
    },
    {
      label: 'Concepts',
      value: aiStats?.total_concepts || user?.neural_profile?.total_concepts_mastered || 0,
      icon: Brain,
      color: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.1)',
    },
    {
      label: 'Study Hours',
      value: Math.round((user?.neural_profile?.total_study_time_minutes || 0) / 60),
      icon: Clock,
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Streak',
      value: '0 days',
      icon: Flame,
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.1)',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    const configs = {
      completed: { label: 'Ready', color: 'var(--c-success)', bg: 'var(--c-success-glow)' },
      processing: { label: 'Processing', color: '#b45309', bg: 'var(--c-warning-glow)' },
      pending: { label: 'Pending', color: 'var(--c-text-tertiary)', bg: 'var(--c-bg-secondary)' },
      failed: { label: 'Failed', color: 'var(--c-error)', bg: 'var(--c-error-glow)' },
    };
    const cfg = configs[status] || configs.pending;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.6875rem', fontWeight: 500, color: cfg.color,
        background: cfg.bg, padding: '0.25rem 0.625rem',
        borderRadius: 'var(--radius-full)',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: cfg.color,
          boxShadow: status === 'completed' ? `0 0 6px ${cfg.color}` : 'none',
        }} />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Greeting Section */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 style={{
          fontSize: '1.75rem', fontWeight: 700,
          letterSpacing: '-0.03em', color: 'var(--c-text-primary)',
          marginBottom: 4,
        }}>
          {getGreeting()}, <span className="text-gradient">{user?.name || 'there'}</span>
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)' }}>
          Your AI-powered learning journey continues. Let's make progress today.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-2xl)',
      }}>
        {stats.map((stat, i) => (
          <div key={stat.label} className={`bento-card animate-fade-in-up stagger-${i + 1}`}
            style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{
                  fontSize: '1.75rem', fontWeight: 700,
                  color: 'var(--c-text-primary)', lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.8125rem', color: 'var(--c-text-tertiary)',
                  marginTop: 4, fontWeight: 500,
                }}>
                  {stat.label}
                </div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: stat.glow, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={18} style={{ color: stat.color }} strokeWidth={2} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 'var(--space-lg)',
      }}>
        {/* Documents List */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
          }}>
            <h2 style={{
              fontSize: '1.125rem', fontWeight: 600,
              color: 'var(--c-text-primary)', letterSpacing: '-0.01em',
            }}>
              Recent Documents
            </h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
              <Plus size={14} />
              Upload
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="bento-card" style={{
              padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 'var(--space-lg)',
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: 'var(--radius-xl)',
                background: 'var(--c-accent-glow)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                animation: 'float 6s ease-in-out infinite',
              }}>
                <BookOpen size={32} style={{ color: 'var(--c-accent)' }} strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 8 }}>
                  Start your learning journey
                </h3>
                <p style={{
                  fontSize: '0.9375rem', color: 'var(--c-text-secondary)',
                  maxWidth: 400, margin: '0 auto', lineHeight: 1.6,
                }}>
                  Upload a document and our AI will analyze it, extract key concepts, and create a personalized learning path for you.
                </p>
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => setShowUpload(true)}>
                <Upload size={18} />
                Upload Your First Document
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {documents.map((doc, i) => (
                <Link
                  key={doc._id}
                  to={`/documents/${doc._id}`}
                  className={`bento-card animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                  style={{
                    textDecoration: 'none', padding: 'var(--space-lg)',
                    display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--radius-md)',
                    background: 'var(--c-accent-glow)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <FileText size={20} style={{ color: 'var(--c-accent)' }} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9375rem', fontWeight: 600, color: 'var(--c-text-primary)',
                      marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {doc.title}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                      fontSize: '0.8125rem', color: 'var(--c-text-tertiary)',
                    }}>
                      <span>{formatDate(doc.createdAt)}</span>
                      {doc.metadata?.word_count > 0 && (
                        <span>{doc.metadata.word_count.toLocaleString()} words</span>
                      )}
                      {getStatusBadge(doc.metadata?.processing_status)}
                    </div>
                  </div>
                  <ArrowRight size={16} style={{ color: 'var(--c-text-tertiary)', flexShrink: 0 }} />
                </Link>
              ))}
              {documents.length >= 3 && (
                <Link to="/documents" style={{
                  textDecoration: 'none', textAlign: 'center', padding: 'var(--space-md)',
                  fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-accent)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-accent-glow)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  View All Documents →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar — Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* AI Features Card */}
          <div className="bento-card animate-fade-in-up stagger-2" style={{
            padding: 'var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-lg)' }}>
              <Sparkles size={16} style={{ color: 'var(--c-accent)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-accent)' }}>
                AI CAPABILITIES
              </span>
            </div>
            {[
              { icon: MessageSquare, label: 'Smart Chat', desc: 'Ask questions about your docs', path: '/ai-studio' },
              { icon: Target, label: 'Auto Quiz', desc: 'AI-generated assessments', path: '/ai-studio' },
              { icon: Layers, label: 'Flashcards', desc: 'Spaced repetition learning', path: '/ai-studio' },
              { icon: Network, label: 'Knowledge Graph', desc: 'Visual concept mapping', path: '/ai-studio' },
            ].map((feat, i) => (
              <div key={feat.label}
                onClick={() => navigate(feat.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                  padding: '0.625rem 0.5rem', borderBottom: i < 3 ? '1px solid var(--c-border)' : 'none',
                  cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--duration-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <feat.icon size={16} style={{ color: 'var(--c-accent)', flexShrink: 0 }} strokeWidth={1.5} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-primary)' }}>
                    {feat.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)' }}>
                    {feat.desc}
                  </div>
                </div>
                <ArrowRight size={12} style={{ color: 'var(--c-text-muted)' }} />
              </div>
            ))}
          </div>

          {/* AI Engine Info */}
          {aiStats && (
            <div className="bento-card animate-fade-in-up stagger-3" style={{ padding: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                <Activity size={14} style={{ color: 'var(--c-accent)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>
                  AI Engine
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                {[
                  { label: 'Model', value: aiStats.llm_model || 'N/A' },
                  { label: 'Status', value: aiStats.llm_available ? '● Online' : '○ Offline' },
                  { label: 'Indexed', value: `${aiStats.total_documents || 0} docs` },
                  { label: 'Chunks', value: aiStats.total_chunks || 0 },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--c-bg-secondary)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--c-text-tertiary)', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-primary)', fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Status */}
          <div className="bento-card animate-fade-in-up stagger-4" style={{ padding: 'var(--space-lg)' }}>
            <div style={{
              fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--c-text-primary)', marginBottom: 'var(--space-md)',
            }}>
              System Status
            </div>
            {[
              { label: 'API Gateway', status: systemStatus.gateway },
              { label: 'AI Engine', status: systemStatus.aiCore },
              { label: 'LLM (Ollama)', status: systemStatus.aiCore },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0',
              }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-secondary)' }}>
                  {s.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: s.status === 'online' ? 'var(--c-success)'
                      : s.status === 'offline' ? 'var(--c-error)'
                      : s.status === 'checking' ? '#f59e0b'
                      : 'var(--c-text-tertiary)',
                    boxShadow: s.status === 'online' ? '0 0 6px var(--c-success)' : 'none',
                    animation: s.status === 'checking' ? 'pulse-glow 1s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{
                    fontSize: '0.75rem',
                    color: s.status === 'online' ? 'var(--c-success)'
                      : s.status === 'offline' ? 'var(--c-error)'
                      : s.status === 'checking' ? '#f59e0b'
                      : 'var(--c-text-tertiary)',
                    textTransform: 'capitalize',
                  }}>
                    {s.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => { setShowUpload(false); loadDocuments(); loadAIStats(); }} />}
    </div>
  );
}

/* ═══ UPLOAD MODAL ═══ */
function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) { setFile(droppedFile); if (!title) setTitle(droppedFile.name.replace(/\.[^/.]+$/, '')); }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) { setFile(selectedFile); if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, '')); }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setIsUploading(true); setError(''); setProgress(0);
      const progressInterval = setInterval(() => setProgress(p => Math.min(p + 12, 90)), 200);
      await documentsAPI.upload(file, title);
      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(onSuccess, 500);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(8px)',
    }} onClick={onClose}>
      <div className="animate-scale-in" style={{
        width: '100%', maxWidth: 520, borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)', background: 'white',
        border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xl)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--c-text-primary)', marginBottom: 'var(--space-lg)', letterSpacing: '-0.02em' }}>
          Upload Document
        </h2>

        <div style={{
          border: `2px dashed ${dragOver ? 'var(--c-accent)' : 'var(--c-border)'}`,
          borderRadius: 'var(--radius-lg)', padding: 'var(--space-2xl)', textAlign: 'center',
          transition: 'all var(--duration-normal)',
          background: dragOver ? 'var(--c-accent-glow)' : 'var(--c-bg-secondary)',
          cursor: 'pointer', marginBottom: 'var(--space-lg)',
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
        onClick={() => document.getElementById('dash-file-input').click()}>
          <input id="dash-file-input" type="file" accept=".pdf,.txt,.md,.docx" onChange={handleFileSelect} style={{ display: 'none' }} />
          <Upload size={28} style={{ color: 'var(--c-text-tertiary)', marginBottom: 12 }} strokeWidth={1.5} />
          {file ? (
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>{file.name}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginTop: 4 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)' }}>Drop file here or click to browse</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginTop: 4 }}>PDF, TXT, Markdown, DOCX — up to 50MB</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-secondary)', marginBottom: 6, display: 'block' }}>Title (optional)</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title..." />
        </div>

        {isUploading && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)', textAlign: 'center', marginTop: 6 }}>
              {progress < 100 ? 'Uploading & Processing...' : 'Complete!'}
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'var(--c-error-glow)', color: 'var(--c-error)', fontSize: '0.8125rem', marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}
            style={{ opacity: (!file || isUploading) ? 0.5 : 1 }}>
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  );
}
