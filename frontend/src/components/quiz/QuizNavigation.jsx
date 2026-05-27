import { useState } from 'react';
import { Flag, CheckCircle, XCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * QuizNavigation — Question dots navigation sidebar
 * 
 * Features:
 * - Dot indicators for each question (✅ correct, ❌ wrong, ⭕ unanswered, 🏳️ flagged)
 * - Click to jump to answered question (review only)
 * - Flag/bookmark questions for later review
 * - Collapse/expand
 */
export default function QuizNavigation({
  questions = [],
  answers = [],
  currentIndex = 0,
  flaggedQuestions = [],
  onJumpTo,
  onToggleFlag,
}) {
  const [collapsed, setCollapsed] = useState(false);

  const getStatus = (idx) => {
    if (idx === currentIndex) return 'current';
    if (idx < answers.length) {
      return answers[idx]?.isCorrect ? 'correct' : 'incorrect';
    }
    return 'unanswered';
  };

  const getDotStyle = (status, isFlagged) => {
    const base = {
      width: 28, height: 28, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.625rem', fontWeight: 700,
      transition: 'all 0.2s ease',
      cursor: status === 'unanswered' && status !== 'current' ? 'default' : 'pointer',
      position: 'relative',
      fontFamily: 'var(--font-mono)',
    };

    if (status === 'current') {
      return {
        ...base,
        background: 'var(--c-accent-gradient)',
        color: 'white',
        boxShadow: '0 0 12px rgba(99,102,241,0.3)',
        transform: 'scale(1.15)',
      };
    }
    if (status === 'correct') {
      return {
        ...base,
        background: 'var(--c-success-glow)',
        color: 'var(--c-success)',
        border: '1.5px solid rgba(52,211,153,0.3)',
      };
    }
    if (status === 'incorrect') {
      return {
        ...base,
        background: 'var(--c-error-glow)',
        color: 'var(--c-error)',
        border: '1.5px solid rgba(248,113,113,0.3)',
      };
    }
    // unanswered
    return {
      ...base,
      background: 'var(--c-bg-secondary)',
      color: 'var(--c-text-tertiary)',
      border: '1.5px solid var(--c-border)',
    };
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          position: 'absolute', top: 8, right: -12,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--c-bg-card)', border: '1px solid var(--c-border)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)', zIndex: 10,
        }}
      >
        <ChevronLeft size={12} style={{ color: 'var(--c-text-tertiary)' }} />
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
      padding: 'var(--space-sm)',
      background: 'var(--c-bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--c-border)',
      maxHeight: 360,
      overflowY: 'auto',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-xs)',
        padding: '0 0.25rem',
      }}>
        <span style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--c-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Questions
        </span>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--c-text-tertiary)', padding: 2,
          }}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Question dots grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(28px, 1fr))',
        gap: 4,
      }}>
        {questions.map((_, idx) => {
          const status = getStatus(idx);
          const isFlagged = flaggedQuestions.includes(idx);
          const canJump = status !== 'unanswered' || status === 'current';

          return (
            <div
              key={idx}
              onClick={() => canJump && onJumpTo?.(idx)}
              style={getDotStyle(status, isFlagged)}
              title={`Q${idx + 1}${isFlagged ? ' (flagged)' : ''}`}
              onMouseEnter={e => {
                if (canJump) e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                if (status !== 'current') e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {status === 'correct' && <CheckCircle size={13} />}
              {status === 'incorrect' && <XCircle size={13} />}
              {(status === 'unanswered' || status === 'current') && (idx + 1)}
              {/* Flag indicator */}
              {isFlagged && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#f59e0b',
                  border: '1.5px solid var(--c-bg-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Flag size={5} color="white" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: 'var(--space-xs)',
        padding: '0.375rem 0.5rem',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--c-bg-secondary)',
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.5625rem', color: 'var(--c-text-tertiary)',
        fontFamily: 'var(--font-mono)',
      }}>
        <span>✅ {answers.filter(a => a?.isCorrect).length}</span>
        <span>❌ {answers.filter(a => a && !a.isCorrect).length}</span>
        <span>⭕ {questions.length - answers.length}</span>
        {flaggedQuestions.length > 0 && <span>🚩 {flaggedQuestions.length}</span>}
      </div>
    </div>
  );
}
