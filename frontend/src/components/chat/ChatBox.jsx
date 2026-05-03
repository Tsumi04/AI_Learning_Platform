import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, AlertCircle, RotateCcw, BookOpen } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { aiAPI } from '../../services/api';

/**
 * ChatBox — RAG-powered AI Chat with Document
 * Kết nối thật với AI Core qua aiAPI.chat()
 * Graceful fallback khi AI Core offline
 */
export default function ChatBox({ documentId, documentTitle }) {
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'ai',
    content: `Xin chào! Tôi là NeuroVault AI — trợ lý học tập thông minh.\n\nTôi đã phân tích tài liệu "${documentTitle || 'này'}". Hãy hỏi tôi bất cứ điều gì về nội dung tài liệu!`,
  }]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildChatHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 'welcome' && !m.isError)
      .slice(-10)
      .map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isThinking) return;

    const query = inputText.trim();
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const chatHistory = buildChatHistory();
      const response = await aiAPI.chat(documentId, query, chatHistory);

      setConnectionStatus('online');
      const aiMsg = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: response.answer || response.response || 'Không có phản hồi từ AI.',
        sources: response.sources || [],
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error('[ChatBox] AI chat error:', error);
      setConnectionStatus('offline');

      let errorContent;
      if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed')) {
        errorContent = '⚠️ Không thể kết nối đến AI Engine.\n\nĐảm bảo cả 3 server đang chạy:\n• Backend (port 5000)\n• AI Core (port 8000)\n• Ollama (port 11434)\n\nChạy lệnh: `python backend/ai_core/api/ai_server.py`';
      } else if (error.status === 404) {
        errorContent = '📄 Tài liệu chưa được xử lý bởi AI Engine.\n\nVui lòng đợi quá trình processing hoàn tất, hoặc upload lại tài liệu.';
      } else if (error.status === 429) {
        errorContent = '⏳ Quá nhiều yêu cầu. Vui lòng đợi một chút rồi thử lại.';
      } else {
        errorContent = `❌ Lỗi: ${error.message || 'Không thể xử lý yêu cầu'}\n\nVui lòng thử lại.`;
      }

      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'ai',
        content: errorContent,
        isError: true,
      }]);
    } finally {
      setIsThinking(false);
      inputRef.current?.focus();
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => !m.isError));
      setInputText(lastUserMsg.content);
    }
  };

  const lastMessage = messages[messages.length - 1];
  const hasError = lastMessage?.isError;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--c-bg-card)', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>

      {/* Connection Status Bar */}
      {connectionStatus === 'offline' && (
        <div className="animate-fade-in" style={{
          padding: '0.5rem 1rem',
          background: 'var(--c-warning-glow)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: '0.75rem', color: '#b45309',
        }}>
          <AlertCircle size={12} />
          <span>AI Engine offline — Kiểm tra backend servers</span>
        </div>
      )}

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {messages.map((msg, i) => (
          <div key={msg.id} className={i > 0 ? 'animate-fade-in-up' : ''} style={{
            display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32,
              borderRadius: msg.role === 'ai' ? 'var(--radius-md)' : '50%',
              background: msg.role === 'ai'
                ? (msg.isError ? 'var(--c-warning-glow)' : 'var(--c-accent-gradient)')
                : 'var(--c-bg-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              border: msg.role === 'user' ? '1px solid var(--c-border)' : 'none',
              boxShadow: msg.role === 'ai' && !msg.isError ? '0 2px 8px rgba(99,102,241,0.2)' : 'none',
            }}>
              {msg.role === 'ai'
                ? (msg.isError
                  ? <AlertCircle size={14} color="#b45309" strokeWidth={2} />
                  : <Sparkles size={14} color="white" strokeWidth={2} />)
                : <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-text-secondary)' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </span>
              }
            </div>

            {/* Message Bubble */}
            <div style={{
              maxWidth: '75%',
              padding: '0.875rem 1rem',
              borderRadius: msg.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)'
                : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)',
              background: msg.isError
                ? 'var(--c-warning-glow)'
                : (msg.role === 'user' ? 'var(--c-accent-glow)' : 'var(--c-bg-secondary)'),
              border: `1px solid ${msg.isError
                ? 'rgba(245, 158, 11, 0.15)'
                : (msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'var(--c-border)')}`,
            }}>
              <div style={{
                fontSize: '0.875rem', lineHeight: 1.7,
                color: msg.isError ? 'var(--c-text-secondary)' : 'var(--c-text-primary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {msg.content}
              </div>

              {/* Source Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--c-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6, fontSize: '0.6875rem', color: 'var(--c-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <BookOpen size={10} />
                    Nguồn tham chiếu
                  </div>
                  {msg.sources.slice(0, 3).map((src, si) => (
                    <div key={si} style={{
                      fontSize: '0.75rem', color: 'var(--c-text-tertiary)',
                      padding: '0.375rem 0.5rem', marginBottom: 2,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--c-bg-primary)',
                      lineHeight: 1.5,
                      overflow: 'hidden', textOverflow: 'ellipsis',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      <span style={{ color: 'var(--c-accent)', fontWeight: 500 }}>
                        [{src.chunk_id?.slice(0, 8) || `P${si + 1}`}]
                      </span>{' '}
                      {src.text?.slice(0, 150) || 'No preview available'}...
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="animate-fade-in" style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'var(--c-accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="white" strokeWidth={2} />
            </div>
            <div style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)', background: 'var(--c-bg-secondary)', border: '1px solid var(--c-border)' }}>
              <div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — LIGHT MODE */}
      <div style={{ padding: 'var(--space-md) var(--space-lg)', borderTop: '1px solid var(--c-border)', background: 'var(--c-bg-card)' }}>
        {hasError && (
          <button onClick={handleRetry} className="btn btn-ghost btn-sm" style={{
            marginBottom: 'var(--space-sm)', width: '100%',
            justifyContent: 'center', gap: 6,
          }}>
            <RotateCcw size={12} /> Thử lại câu hỏi trước
          </button>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Hỏi về tài liệu này..."
            disabled={isThinking}
            className="input"
            style={{
              flex: 1, borderRadius: 'var(--radius-full)',
              paddingRight: '3rem', background: 'var(--c-bg-secondary)',
              opacity: isThinking ? 0.6 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isThinking}
            style={{
              position: 'absolute', right: 6, width: 34, height: 34,
              borderRadius: 'var(--radius-full)',
              background: inputText.trim() ? 'var(--c-accent-gradient)' : 'var(--c-bg-tertiary)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: inputText.trim() ? 'pointer' : 'default',
              transition: 'all var(--duration-fast)',
            }}
          >
            <Send size={14} color={inputText.trim() ? 'white' : 'var(--c-text-muted)'} />
          </button>
        </div>
      </div>
    </div>
  );
}
