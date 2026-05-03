import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, MessageSquare, HelpCircle, Layers, Network,
  FileText, Sparkles, ArrowRight, Loader2, BookOpen,
  ChevronRight, Zap, Target, TrendingUp,
} from 'lucide-react';
import { documentsAPI } from '../services/api';

const aiFeatures = [
  {
    id: 'chat',
    name: 'Smart Chat',
    desc: 'RAG-powered Q&A with your documents. Ask anything and get AI answers grounded in your content.',
    icon: MessageSquare,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  {
    id: 'quiz',
    name: 'Auto Quiz',
    desc: 'AI-generated assessments calibrated to your knowledge level. MCQ, fill-blank, and true/false.',
    icon: HelpCircle,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    desc: 'Spaced repetition flashcards with FSRS scheduling. Concept and cloze deletion cards.',
    icon: Layers,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: 'knowledge-graph',
    name: 'Knowledge Graph',
    desc: 'Visual concept map showing relationships between ideas extracted from your documents.',
    icon: Network,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
];

export default function AIStudioPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await documentsAPI.list(1, 50);
      const completed = (data.documents || []).filter(
        d => d.metadata?.processing_status === 'completed'
      );
      setDocuments(completed);
      if (completed.length > 0 && !selectedDoc) setSelectedDoc(completed[0]);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureClick = (featureId) => {
    if (!selectedDoc) return;
    // Navigate to document detail with the specific tab
    navigate(`/documents/${selectedDoc._id}?tab=${featureId}`);
  };

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 4 }}>
          <Sparkles size={20} style={{ color: 'var(--c-accent)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            AI Studio
          </span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--c-text-primary)', letterSpacing: '-0.03em' }}>
          AI-Powered Learning Tools
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', marginTop: 4 }}>
          Select a document and choose an AI feature to enhance your learning.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-xl)', alignItems: 'start' }}>
        {/* Left: Document Selector */}
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-md)' }}>
            Select Document
          </div>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="bento-card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <BookOpen size={32} style={{ color: 'var(--c-text-muted)', marginBottom: 'var(--space-md)' }} strokeWidth={1} />
              <div style={{ fontSize: '0.875rem', color: 'var(--c-text-secondary)', marginBottom: 'var(--space-md)' }}>
                No processed documents yet. Upload and process a document first.
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/documents')}>
                Go to Documents
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
              {documents.map(doc => {
                const isSelected = selectedDoc?._id === doc._id;
                return (
                  <button key={doc._id} onClick={() => setSelectedDoc(doc)} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid rgba(99,102,241,0.2)' : '1px solid var(--c-border)',
                    background: isSelected ? 'var(--c-accent-glow)' : 'var(--c-bg-card)',
                    cursor: 'pointer', width: '100%', textAlign: 'left',
                    transition: 'all var(--duration-fast)',
                    boxShadow: isSelected ? '0 0 0 2px rgba(99,102,241,0.08)' : 'var(--shadow-xs)',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-border-hover)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--c-border)'; }}>
                    <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: isSelected ? 'rgba(99,102,241,0.15)' : 'var(--c-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} style={{ color: isSelected ? 'var(--c-accent)' : 'var(--c-text-tertiary)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--c-accent)' : 'var(--c-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.title}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--c-text-tertiary)' }}>
                        {doc.metadata?.word_count?.toLocaleString() || 0} words
                      </div>
                    </div>
                    {isSelected && <ChevronRight size={14} style={{ color: 'var(--c-accent)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI Features Grid */}
        <div>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-md)' }}>
            AI Features {selectedDoc && <span style={{ fontWeight: 400, color: 'var(--c-text-tertiary)' }}>for "{selectedDoc.title}"</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
            {aiFeatures.map((feat, i) => (
              <button key={feat.id}
                className={`bento-card animate-fade-in-up stagger-${i + 1}`}
                onClick={() => handleFeatureClick(feat.id)}
                disabled={!selectedDoc}
                style={{
                  padding: 'var(--space-xl)', textAlign: 'left', cursor: selectedDoc ? 'pointer' : 'not-allowed',
                  opacity: selectedDoc ? 1 : 0.5, border: `1px solid ${feat.borderColor}`,
                  background: 'var(--c-bg-card)', width: '100%',
                  transition: 'all var(--duration-normal) var(--ease-out-expo)',
                }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: feat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-md)' }}>
                  <feat.icon size={22} style={{ color: feat.color }} strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 6 }}>{feat.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--c-text-secondary)', lineHeight: 1.5 }}>{feat.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'var(--space-md)', fontSize: '0.75rem', fontWeight: 600, color: feat.color }}>
                  Launch <ArrowRight size={12} />
                </div>
              </button>
            ))}
          </div>

          {/* Stats */}
          {selectedDoc && (
            <div className="bento-card animate-fade-in-up stagger-5" style={{ marginTop: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-md)' }}>
                Document Intelligence
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)' }}>
                {[
                  { label: 'Words', value: selectedDoc.metadata?.word_count?.toLocaleString() || '0', icon: FileText, color: '#6366f1' },
                  { label: 'Chunks', value: selectedDoc.metadata?.chunk_count || '0', icon: Layers, color: '#8b5cf6' },
                  { label: 'Language', value: (selectedDoc.language || 'unknown').toUpperCase(), icon: Brain, color: '#10b981' },
                  { label: 'Status', value: 'Ready', icon: Zap, color: '#f59e0b' },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <stat.icon size={16} style={{ color: stat.color, marginBottom: 6 }} />
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>{stat.value}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--c-text-tertiary)', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
