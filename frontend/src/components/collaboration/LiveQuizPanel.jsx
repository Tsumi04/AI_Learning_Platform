import { useState, useEffect } from 'react';
import { Users, Trophy, Clock, CheckCircle2, XCircle, Zap, Play, ArrowRight } from 'lucide-react';

/**
 * LiveQuizPanel — UI cho Live Quiz (host + participant).
 * Props: quizState, leaderboard, events, actions (startQuiz, answerQuiz, nextQuestion, endQuiz)
 */
export default function LiveQuizPanel({ quizState, leaderboard, events, members, actions, onClose }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const q = quizState?.currentQuestion;
  const isHost = quizState?.role === 'host';
  const isActive = quizState?.status === 'active';
  const isFinished = quizState?.status === 'finished';
  const isWaiting = quizState?.status === 'waiting';

  // Timer countdown
  useEffect(() => {
    if (!q?.timeLimit || quizState?.answered) return;
    setTimeLeft(q.timeLimit);
    setSelectedAnswer(null);
    const timer = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, [q?.index]);

  const handleAnswer = (idx) => {
    if (quizState?.answered || isHost) return;
    setSelectedAnswer(idx);
    const timeTaken = (q?.timeLimit || 30) - timeLeft;
    actions.answerQuiz(quizState.quizId, idx, timeTaken);
  };

  // ── WAITING SCREEN ──
  if (isWaiting) {
    return (
      <div className="bento-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--c-text-primary)', marginBottom: 8 }}>
          Live Quiz Ready
        </h3>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-accent)', marginBottom: '1rem', fontFamily: 'monospace', letterSpacing: '0.15em' }}>
          {quizState.quizId}
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--c-text-tertiary)', marginBottom: '1.5rem' }}>
          Share this code with others to join • {members?.length || 1} connected
        </p>
        {isHost && (
          <button className="btn btn-primary" onClick={() => actions.startQuiz(quizState.quizId)}>
            <Play size={16} /> Start Quiz ({quizState.questionCount} questions)
          </button>
        )}
      </div>
    );
  }

  // ── FINISHED SCREEN ──
  if (isFinished) {
    return (
      <div className="bento-card" style={{ padding: '1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <Trophy size={32} style={{ color: '#fbbf24', marginBottom: 8 }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>Quiz Complete!</h3>
        </div>
        {/* Leaderboard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {leaderboard.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: i === 0 ? 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))' : 'var(--c-bg-secondary)',
              border: i === 0 ? '1px solid rgba(251,191,36,0.2)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: '1rem', width: 28, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>{p.name}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--c-accent)' }}>{p.score}</span>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ width: '100%', marginTop: '1rem' }}>Close</button>
      </div>
    );
  }

  // ── ACTIVE QUESTION ──
  if (!q) return null;

  const result = quizState?.lastResult;

  return (
    <div className="bento-card" style={{ padding: '1.5rem' }}>
      {/* Header: question # + timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Question {q.index + 1}/{q.total}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.875rem', fontWeight: 700, color: timeLeft <= 5 ? '#ef4444' : 'var(--c-text-primary)' }}>
          <Clock size={14} /> {timeLeft}s
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ height: 3, borderRadius: 2, background: 'var(--c-bg-tertiary)', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 2, transition: 'width 1s linear',
          width: `${(timeLeft / (q.timeLimit || 30)) * 100}%`,
          background: timeLeft <= 5 ? '#ef4444' : 'var(--c-accent-gradient)',
        }} />
      </div>

      {/* Question text */}
      <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
        {q.question}
      </p>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {q.options?.map((opt, idx) => {
          const isSelected = selectedAnswer === idx;
          const showResult = quizState?.answered;
          const isCorrect = showResult && result?.correctIndex === idx;
          const isWrong = showResult && isSelected && !result?.isCorrect;

          let bg = 'var(--c-bg-secondary)';
          let border = '1px solid var(--c-border)';
          if (showResult && isCorrect) { bg = 'rgba(16,185,129,0.1)'; border = '1px solid rgba(16,185,129,0.3)'; }
          if (isWrong) { bg = 'rgba(239,68,68,0.1)'; border = '1px solid rgba(239,68,68,0.3)'; }
          if (!showResult && isSelected) { bg = 'var(--c-accent-glow)'; border = '1px solid rgba(99,102,241,0.3)'; }

          return (
            <button key={idx} onClick={() => handleAnswer(idx)} disabled={showResult || isHost}
              style={{
                padding: '12px', borderRadius: 'var(--radius-md)', background: bg, border,
                cursor: (showResult || isHost) ? 'default' : 'pointer', textAlign: 'left',
                fontSize: '0.8125rem', color: 'var(--c-text-primary)', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--c-bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ flex: 1 }}>{opt}</span>
              {showResult && isCorrect && <CheckCircle2 size={16} style={{ color: '#10b981' }} />}
              {isWrong && <XCircle size={16} style={{ color: '#ef4444' }} />}
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult(quizState) && (
        <div style={{
          marginTop: '1rem', padding: '10px 12px', borderRadius: 'var(--radius-md)', textAlign: 'center',
          background: result?.isCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          fontSize: '0.8125rem', fontWeight: 600,
          color: result?.isCorrect ? '#10b981' : '#ef4444',
        }}>
          {result?.isCorrect ? `✅ Correct! +${result.points} points` : '❌ Incorrect'}
        </div>
      )}

      {/* Host: Next button */}
      {isHost && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => actions.nextQuestion(quizState.quizId)}>
            {q.index + 1 < q.total ? (<><ArrowRight size={14} /> Next Question</>) : (<><Trophy size={14} /> Show Results</>)}
          </button>
        </div>
      )}
    </div>
  );
}

function showResult(state) {
  return state?.answered && state?.lastResult;
}
