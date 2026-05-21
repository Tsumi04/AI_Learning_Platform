import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, FileText, Sparkles, Layers,
  HelpCircle, ArrowLeft, Loader2, Network, Brain,
  BookOpen, StickyNote, PanelRightOpen, PanelRightClose,
  Eye, ChevronRight,
} from 'lucide-react';
import { documentsAPI, aiAPI, annotationsAPI } from '../services/api';
import ChatBox from '../components/chat/ChatBox';
import QuizView from '../components/quiz/QuizView';
import FlashcardView from '../components/flashcard/FlashcardView';
import KnowledgeGraphView from '../components/knowledge/KnowledgeGraphView';
import PDFViewer from '../components/documents/PDFViewer';
import TextContentViewer from '../components/documents/TextContentViewer';
import AnnotationPanel from '../components/documents/AnnotationPanel';

const tabs = [
  { id: 'viewer', label: 'Document', icon: Eye },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'quiz', label: 'Quizzes', icon: HelpCircle },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { id: 'concepts', label: 'Concepts', icon: Brain },
];

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'viewer';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [concepts, setConcepts] = useState(null);
  const [conceptsLoading, setConceptsLoading] = useState(false);

  // Annotation state
  const [annotations, setAnnotations] = useState([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);

  // Side chat state (song song với viewer)
  const [showSideChat, setShowSideChat] = useState(false);

  // ──── Data Loading ────
  useEffect(() => { loadDocument(); loadAnnotations(); }, [id]);

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

  const loadAnnotations = async () => {
    try {
      setAnnotationsLoading(true);
      const data = await annotationsAPI.list(id);
      setAnnotations(data.annotations || []);
    } catch {
      setAnnotations([]);
    } finally {
      setAnnotationsLoading(false);
    }
  };

  const loadConcepts = async () => {
    if (concepts) return;
    try {
      setConceptsLoading(true);
      const data = await aiAPI.getConcepts(id);
      setConcepts(data.concepts || []);
    } catch {
      setConcepts([]);
    } finally {
      setConceptsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'concepts') loadConcepts();
  }, [activeTab]);

  // ──── Annotation CRUD ────
  const handleAddAnnotation = useCallback(async (annotationData) => {
    try {
      const data = await annotationsAPI.create({
        document_id: id,
        ...annotationData,
      });
      setAnnotations(prev => [data.annotation, ...prev]);
    } catch (err) {
      console.error('[Annotation] Create failed:', err);
    }
  }, [id]);

  const handleUpdateAnnotation = useCallback(async (annId, updates) => {
    try {
      const data = await annotationsAPI.update(annId, updates);
      setAnnotations(prev =>
        prev.map(a => a._id === annId ? data.annotation : a)
      );
    } catch (err) {
      console.error('[Annotation] Update failed:', err);
    }
  }, []);

  const handleDeleteAnnotation = useCallback(async (annId) => {
    try {
      await annotationsAPI.delete(annId);
      setAnnotations(prev => prev.filter(a => a._id !== annId));
    } catch (err) {
      console.error('[Annotation] Delete failed:', err);
    }
  }, []);

  // ──── Helpers ────
  const isPDF = document?.mime_type === 'application/pdf';
  const hasText = !!document?.raw_text;

  // ──── Render States ────
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

  // ──── Render Viewer Tab (split: viewer + side chat) ────
  const renderViewerTab = () => (
    <div style={{
      flex: 1, display: 'flex', overflow: 'hidden',
      borderRadius: 'var(--radius-lg)',
    }}>
      {/* Main Viewer */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'var(--c-bg-card)',
        border: '1px solid var(--c-border)',
        borderRadius: showSideChat ? 'var(--radius-lg) 0 0 var(--radius-lg)' : 'var(--radius-lg)',
        overflow: 'hidden', minWidth: 0,
      }}>
        {isPDF ? (
          <PDFViewer documentId={id} fileName={document?.original_filename} />
        ) : hasText ? (
          <TextContentViewer
            text={document.raw_text}
            annotations={annotations}
            onHighlight={handleAddAnnotation}
          />
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText size={32} style={{ color: 'var(--c-text-muted)' }} strokeWidth={1} />
            </div>
            <span style={{ color: 'var(--c-text-tertiary)', fontSize: '0.9375rem' }}>
              Document content will appear here after processing completes.
            </span>
          </div>
        )}
      </div>

      {/* Side Chat Panel */}
      {showSideChat && (
        <div className="animate-slide-in-right" style={{
          width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column',
          borderLeft: 'none',
          borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
          overflow: 'hidden',
        }}>
          <ChatBox documentId={id} documentTitle={document?.title} />
        </div>
      )}

      {/* Annotation Sidebar */}
      {showAnnotations && !isPDF && (
        <div className="animate-slide-in-right" style={{
          width: 280, flexShrink: 0,
          borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
          overflow: 'hidden',
        }}>
          <AnnotationPanel
            annotations={annotations}
            onAdd={handleAddAnnotation}
            onUpdate={handleUpdateAnnotation}
            onDelete={handleDeleteAnnotation}
            isLoading={annotationsLoading}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{
      maxWidth: 1600, margin: '0 auto', height: '100%',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ═══ Header ═══ */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        marginBottom: 'var(--space-md)',
      }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate(-1)} style={{ flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: '1.375rem', fontWeight: 700,
            color: 'var(--c-text-primary)', letterSpacing: '-0.02em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {document?.title || 'Document'}
          </h1>
          <div style={{
            display: 'flex', gap: 'var(--space-md)',
            fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginTop: 2,
          }}>
            {document?.metadata?.word_count > 0 && (
              <span>{document.metadata.word_count.toLocaleString()} words</span>
            )}
            {document?.metadata?.chunk_count > 0 && (
              <span>{document.metadata.chunk_count} chunks</span>
            )}
            {document?.language && document.language !== 'unknown' && (
              <span style={{ textTransform: 'uppercase' }}>{document.language}</span>
            )}
            {isPDF && (
              <span className="badge badge-accent" style={{ fontSize: '0.625rem' }}>PDF</span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
          {activeTab === 'viewer' && !isPDF && (
            <button
              className={`btn btn-ghost btn-sm ${showAnnotations ? '' : ''}`}
              onClick={() => setShowAnnotations(!showAnnotations)}
              title={showAnnotations ? 'Ẩn ghi chú' : 'Hiện ghi chú'}
              style={{
                color: showAnnotations ? 'var(--c-accent)' : 'var(--c-text-tertiary)',
                background: showAnnotations ? 'var(--c-accent-glow)' : 'transparent',
              }}
            >
              <StickyNote size={14} />
              <span style={{ fontSize: '0.75rem' }}>
                {annotations.length > 0 ? annotations.length : ''}
              </span>
            </button>
          )}
          {activeTab === 'viewer' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowSideChat(!showSideChat)}
              title={showSideChat ? 'Đóng AI Chat' : 'Mở AI Chat bên cạnh'}
              style={{
                color: showSideChat ? 'var(--c-accent)' : 'var(--c-text-tertiary)',
                background: showSideChat ? 'var(--c-accent-glow)' : 'transparent',
              }}
            >
              {showSideChat ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
              <span style={{ fontSize: '0.75rem' }}>Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Tabs ═══ */}
      <div className="tab-bar" style={{ marginBottom: 'var(--space-md)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}>
            <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Tab Content ═══ */}
      <div style={{
        flex: 1, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        borderRadius: 'var(--radius-lg)',
      }}>
        {activeTab === 'viewer' && renderViewerTab()}

        {activeTab === 'chat' && <ChatBox documentId={id} documentTitle={document?.title} />}

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
                <div className="empty-state-icon">
                  <Brain size={32} style={{ color: 'var(--c-accent)' }} strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 4 }}>
                    No Concepts Found
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-tertiary)' }}>
                    Process the document first, then concepts will be extracted automatically.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
