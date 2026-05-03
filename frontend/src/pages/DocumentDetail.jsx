import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, FileText, Sparkles, Layers, 
  HelpCircle, ArrowLeft, Loader2 
} from 'lucide-react';
import { documentsAPI } from '../services/api';
import ChatBox from '../components/chat/ChatBox';

const tabs = [
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'actions', label: 'AI Actions', icon: Sparkles },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDocument();
  }, [id]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const data = await documentsAPI.get(id);
      setDocument(data.document);
    } catch (err) {
      setError(err.message || 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', gap: 'var(--space-md)',
      }}>
        <Loader2 size={24} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
        <span style={{ color: 'var(--c-text-secondary)', fontSize: '0.9375rem' }}>Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', gap: 'var(--space-lg)',
      }}>
        <div style={{ fontSize: '0.9375rem', color: 'var(--c-error)' }}>{error}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{
      maxWidth: 1200,
      margin: '0 auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
      }}>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/dashboard')}
          style={{ flexShrink: 0 }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--c-text-primary)',
            letterSpacing: '-0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {document?.title || 'Document'}
          </h1>
          <div style={{
            display: 'flex', gap: 'var(--space-md)',
            fontSize: '0.8125rem', color: 'var(--c-text-tertiary)',
            marginTop: 2,
          }}>
            {document?.metadata?.word_count > 0 && (
              <span>{document.metadata.word_count.toLocaleString()} words</span>
            )}
            {document?.language && document.language !== 'unknown' && (
              <span style={{ textTransform: 'uppercase' }}>{document.language}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 2,
        marginBottom: 'var(--space-lg)',
        borderBottom: '1px solid var(--c-border)',
        paddingBottom: 0,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.75rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--c-accent-light)' : 'var(--c-text-secondary)',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--c-accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--duration-fast)',
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--c-text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--c-text-secondary)';
              }}
            >
              <tab.icon size={14} strokeWidth={isActive ? 2 : 1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
      }}>
        {activeTab === 'chat' && <ChatBox documentId={id} documentTitle={document?.title} />}
        
        {activeTab === 'content' && (
          <div className="bento-card" style={{
            flex: 1, overflow: 'auto',
            padding: 'var(--space-xl)',
          }}>
            {document?.raw_text ? (
              <pre style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '0.9375rem',
                lineHeight: 1.8,
                color: 'var(--c-text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {document.raw_text}
              </pre>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: 'var(--space-md)',
              }}>
                <FileText size={32} style={{ color: 'var(--c-text-muted)' }} strokeWidth={1} />
                <span style={{ color: 'var(--c-text-tertiary)', fontSize: '0.9375rem' }}>
                  Document content will appear here after processing
                </span>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'actions' || activeTab === 'flashcards' || activeTab === 'quizzes') && (
          <div className="bento-card" style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 'var(--space-md)',
          }}>
            <div style={{
              width: 64, height: 64,
              borderRadius: 'var(--radius-xl)',
              background: 'var(--c-accent-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse-glow 3s ease-in-out infinite',
            }}>
              <Sparkles size={24} style={{ color: 'var(--c-accent-light)' }} strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.125rem', fontWeight: 600,
                color: 'var(--c-text-primary)', marginBottom: 4,
              }}>
                Coming Soon
              </div>
              <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-tertiary)' }}>
                {activeTab === 'actions' && 'AI-powered document actions — summarize, extract, analyze'}
                {activeTab === 'flashcards' && 'Auto-generated flashcards with spaced repetition'}
                {activeTab === 'quizzes' && 'Adaptive quizzes calibrated to your knowledge level'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
