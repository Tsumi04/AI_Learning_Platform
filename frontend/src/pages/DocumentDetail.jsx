import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  MessageSquare, FileText, Sparkles, Layers, 
  HelpCircle, ArrowLeft, Loader2, Network, Brain,
  BookOpen, Download,
} from 'lucide-react';
import { documentsAPI, aiAPI } from '../services/api';
import ChatBox from '../components/chat/ChatBox';
import QuizView from '../components/quiz/QuizView';
import FlashcardView from '../components/flashcard/FlashcardView';
import KnowledgeGraphView from '../components/knowledge/KnowledgeGraphView';

const tabs = [
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { id: 'concepts', label: 'Concepts', icon: Brain },
];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'chat';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [concepts, setConcepts] = useState(null);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  useEffect(() => { loadDocument(); }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

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

  const loadConcepts = async () => {
    if (concepts) return;
    try {
      setConceptsLoading(true);
      const data = await aiAPI.getConcepts(id);
      setConcepts(data.concepts || []);
    } catch (err) {
      setConcepts([]);
    } finally {
      setConceptsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'concepts') loadConcepts();
  }, [activeTab]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-md)' }}>
        <Loader2 size={24} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
        <span style={{ color: 'var(--c-text-secondary)', fontSize: '0.9375rem' }}>Loading document...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <div style={{ fontSize: '0.9375rem', color: 'var(--c-error)' }}>{error}</div>
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 1200, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--c-text-primary)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {document?.title || 'Document'}
          </h1>
          <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginTop: 2 }}>
            {document?.metadata?.word_count > 0 && <span>{document.metadata.word_count.toLocaleString()} words</span>}
            {document?.metadata?.chunk_count > 0 && <span>{document.metadata.chunk_count} chunks</span>}
            {document?.language && document.language !== 'unknown' && <span style={{ textTransform: 'uppercase' }}>{document.language}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
            <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)' }}>
        {activeTab === 'chat' && <ChatBox documentId={id} documentTitle={document?.title} />}
        
        {activeTab === 'content' && (
          <div className="bento-card" style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xl)' }}>
            {document?.raw_text ? (
              <pre style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9375rem', lineHeight: 1.8, color: 'var(--c-text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {document.raw_text}
              </pre>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={32} style={{ color: 'var(--c-text-muted)' }} strokeWidth={1} /></div>
                <span style={{ color: 'var(--c-text-tertiary)', fontSize: '0.9375rem' }}>
                  Document content will appear here after processing completes.
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="bento-card" style={{ flex: 1, overflow: 'auto' }}>
            <QuizView documentId={id} />
          </div>
        )}

        {activeTab === 'flashcards' && (
          <div className="bento-card" style={{ flex: 1, overflow: 'hidden' }}>
            <FlashcardView documentId={id} />
          </div>
        )}

        {activeTab === 'knowledge-graph' && (
          <div className="bento-card" style={{ flex: 1, overflow: 'hidden' }}>
            <KnowledgeGraphView documentId={id} />
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="bento-card" style={{ flex: 1, overflow: 'auto', padding: 'var(--space-xl)' }}>
            {conceptsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-md)' }}>
                <Loader2 size={24} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
                <span style={{ color: 'var(--c-text-secondary)' }}>Extracting concepts...</span>
              </div>
            ) : concepts && concepts.length > 0 ? (
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 'var(--space-lg)' }}>
                  Key Concepts ({concepts.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                  {concepts.map((c, i) => (
                    <div key={i} style={{
                      padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--c-border)', background: 'var(--c-bg-card)',
                      fontSize: '0.8125rem', fontWeight: 500, color: 'var(--c-text-primary)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      boxShadow: 'var(--shadow-xs)',
                    }}>
                      <Brain size={12} style={{ color: 'var(--c-accent)' }} />
                      {c.concept}
                      <span style={{ fontSize: '0.6875rem', color: 'var(--c-text-tertiary)', fontWeight: 400 }}>
                        {(c.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon"><Brain size={32} style={{ color: 'var(--c-accent)' }} strokeWidth={1.5} /></div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 4 }}>No Concepts Found</div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-tertiary)' }}>Process the document first, then concepts will be extracted automatically.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
