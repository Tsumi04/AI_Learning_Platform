import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export default function ChatBox({ documentId, documentTitle }) {
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([{
    id: 'welcome', role: 'ai',
    content: `I'm NeuroVault AI. I've analyzed "${documentTitle || 'this document'}". Ask me anything about it!`,
  }]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isThinking) return;
    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: inputText.trim() };
    setMessages(p => [...p, userMsg]);
    setInputText('');
    setIsThinking(true);
    setTimeout(() => {
      setMessages(p => [...p, {
        id: `ai-${Date.now()}`, role: 'ai',
        content: `Analyzing your question: "${userMsg.content}"\n\nThe AI inference engine (Gemma 4 + RAG) is being built. Once deployed, I'll provide document-grounded answers with citations — 100% local, zero APIs.`,
      }]);
      setIsThinking(false);
    }, 1200);
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'var(--c-bg-card)', border:'1px solid var(--c-border)', borderRadius:'var(--radius-lg)', overflow:'hidden' }}>
      <div style={{ flex:1, overflowY:'auto', padding:'var(--space-lg)', display:'flex', flexDirection:'column', gap:'var(--space-lg)' }}>
        {messages.map((msg, i) => (
          <div key={msg.id} className={i > 0 ? 'animate-fade-in-up' : ''} style={{ display:'flex', gap:'var(--space-md)', alignItems:'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width:32, height:32, borderRadius: msg.role === 'ai' ? 'var(--radius-md)' : '50%', background: msg.role === 'ai' ? 'var(--c-accent-gradient)' : 'var(--c-bg-glass-strong)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow: msg.role === 'ai' ? '0 2px 8px rgba(99,102,241,0.2)' : 'none' }}>
              {msg.role === 'ai' ? <Sparkles size={14} color="white" strokeWidth={2}/> : <span style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--c-text-secondary)' }}>{user?.name?.charAt(0) || 'U'}</span>}
            </div>
            <div style={{ maxWidth:'75%', padding:'0.875rem 1rem', borderRadius: msg.role === 'user' ? 'var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)', background: msg.role === 'user' ? 'var(--c-accent-glow)' : 'var(--c-bg-glass)', border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.15)' : 'var(--c-border)'}` }}>
              <div style={{ fontSize:'0.875rem', lineHeight:1.7, color:'var(--c-text-primary)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.content}</div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="animate-fade-in" style={{ display:'flex', gap:'var(--space-md)' }}>
            <div style={{ width:32, height:32, borderRadius:'var(--radius-md)', background:'var(--c-accent-gradient)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={14} color="white" strokeWidth={2}/>
            </div>
            <div style={{ padding:'0.875rem 1rem', borderRadius:'var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm)', background:'var(--c-bg-glass)', border:'1px solid var(--c-border)' }}>
              <div className="typing-indicator"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef}/>
      </div>
      <div style={{ padding:'var(--space-md) var(--space-lg)', borderTop:'1px solid var(--c-border)', background:'rgba(10,10,15,0.5)' }}>
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key==='Enter' && handleSend()} placeholder="Ask about this document..." disabled={isThinking} className="input" style={{ flex:1, borderRadius:'var(--radius-full)', paddingRight:'3rem', background:'var(--c-bg-glass)', opacity: isThinking ? 0.6 : 1 }}/>
          <button onClick={handleSend} disabled={!inputText.trim() || isThinking} style={{ position:'absolute', right:6, width:34, height:34, borderRadius:'var(--radius-full)', background: inputText.trim() ? 'var(--c-accent-gradient)' : 'var(--c-bg-glass)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor: inputText.trim() ? 'pointer' : 'default', transition:'all var(--duration-fast)' }}>
            <Send size={14} color={inputText.trim() ? 'white' : 'var(--c-text-muted)'}/>
          </button>
        </div>
      </div>
    </div>
  );
}
