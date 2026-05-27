import { useState } from 'react';
import { Lightbulb, Eye, Trash2 } from 'lucide-react';

/**
 * QuizHint — Progressive hint system with scoring penalty
 * 
 * Hint levels:
 * 1. Category / topic hint
 * 2. Eliminate one wrong answer (MCQ) or first letter (fill_blank)
 * 3. Show half the answer (fill_blank) or eliminate another (MCQ)
 * 
 * Scoring: full=3pts, 1 hint=2pts, 2 hints=1pt, 3 hints=0.5pt
 */
export default function QuizHint({
  question,
  shuffledOptions = [],
  hintsUsed = 0,
  onUseHint,
  disabled = false,
}) {
  const [revealedHints, setRevealedHints] = useState([]);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

  const maxHints = question.question_type === 'true_false' ? 1 : 3;
  const canUseHint = hintsUsed < maxHints && !disabled;

  const getHintContent = (level) => {
    const q = question;

    if (level === 0) {
      // Level 1: Category / topic hint
      const bloom = q.bloom_level || 'remember';
      const concept = q.source_concept || q.concept || '';
      if (concept) {
        return `🏷️ This question is about: "${concept}"`;
      }
      return `🧠 Bloom's level: ${bloom} — think about ${bloom === 'remember' ? 'recalling facts' : bloom === 'understand' ? 'explaining concepts' : bloom === 'apply' ? 'applying knowledge' : bloom === 'analyze' ? 'breaking down ideas' : 'evaluating critically'}`;
    }

    if (level === 1) {
      if (q.question_type === 'mcq') {
        // Eliminate one wrong answer
        const wrongOptions = shuffledOptions.filter(
          o => o !== q.correct_answer && !eliminatedOptions.includes(o)
        );
        if (wrongOptions.length > 0) {
          const eliminated = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          setEliminatedOptions(prev => [...prev, eliminated]);
          return `❌ Eliminated: "${eliminated.length > 60 ? eliminated.slice(0, 57) + '...' : eliminated}"`;
        }
        return '🔍 Focus on the key differences between remaining options';
      }
      if (q.question_type === 'fill_blank') {
        const answer = q.correct_answer;
        return `🔤 The answer starts with "${answer.charAt(0).toUpperCase()}" and has ${answer.length} characters`;
      }
      if (q.question_type === 'true_false') {
        return `💡 Look carefully at every detail in the statement — numbers, relationships, and qualifiers`;
      }
    }

    if (level === 2) {
      if (q.question_type === 'mcq') {
        // Eliminate another wrong answer
        const wrongOptions = shuffledOptions.filter(
          o => o !== q.correct_answer && !eliminatedOptions.includes(o)
        );
        if (wrongOptions.length > 0) {
          const eliminated = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
          setEliminatedOptions(prev => [...prev, eliminated]);
          return `❌ Also eliminated: "${eliminated.length > 60 ? eliminated.slice(0, 57) + '...' : eliminated}"`;
        }
        return '🎯 You\'re very close — only the correct answer remains!';
      }
      if (q.question_type === 'fill_blank') {
        const answer = q.correct_answer;
        const halfLen = Math.ceil(answer.length / 2);
        const revealed = answer.slice(0, halfLen) + '…';
        return `🔑 The answer begins with: "${revealed}"`;
      }
    }

    return '🤔 Think carefully about what you\'ve learned';
  };

  const handleUseHint = () => {
    if (!canUseHint) return;
    const hintText = getHintContent(hintsUsed);
    setRevealedHints(prev => [...prev, hintText]);
    onUseHint?.(hintsUsed + 1, eliminatedOptions);
  };

  const pointsAfterHints = (used) => {
    if (used === 0) return 3;
    if (used === 1) return 2;
    if (used === 2) return 1;
    return 0.5;
  };

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      {/* Hint button */}
      {canUseHint && (
        <button
          onClick={handleUseHint}
          className="quiz-hint-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(251,191,36,0.25)',
            background: 'rgba(251,191,36,0.06)',
            color: '#d97706', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(251,191,36,0.12)';
            e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(251,191,36,0.06)';
            e.currentTarget.style.borderColor = 'rgba(251,191,36,0.25)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Lightbulb size={14} />
          <span>Hint ({hintsUsed}/{maxHints})</span>
          <span style={{
            fontSize: '0.6875rem', opacity: 0.7,
            padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)',
            background: 'rgba(251,191,36,0.1)',
          }}>
            -{3 - pointsAfterHints(hintsUsed + 1)} pts
          </span>
        </button>
      )}

      {/* Revealed hints */}
      {revealedHints.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)',
          marginTop: 'var(--space-sm)',
        }}>
          {revealedHints.map((hint, i) => (
            <div
              key={i}
              className="animate-fade-in-up"
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.12)',
                fontSize: '0.8125rem',
                color: 'var(--c-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {hint}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Returns which options should be visually eliminated (crossed out)
 */
export function getEliminatedOptions(eliminatedList) {
  return new Set(eliminatedList);
}
