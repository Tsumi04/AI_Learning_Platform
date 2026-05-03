import { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { aiAPI } from '../../services/api';

export default function QuizView({ documentId }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [started, setStarted] = useState(false);

  const generateQuiz = async () => {
    try {
      setIsLoading(true); setError(''); setStarted(true);
      const data = await aiAPI.generateQuiz(documentId, numQuestions, 0.5);
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0); setScore(0); setIsFinished(false);
      } else {
        setError('No questions generated. The document may need more content.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Make sure AI server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    const q = questions[currentIndex];
    if (answer === q.correct_answer) setScore(prev => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null); setShowResult(false);
    } else {
      setIsFinished(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0); setSelectedAnswer(null);
    setShowResult(false); setScore(0);
    setIsFinished(false); setStarted(false);
    setQuestions([]);
  };

  if (!started) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HelpCircle size={32} style={{ color: '#8b5cf6' }} strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 8 }}>AI Quiz Generator</h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', maxWidth: 400 }}>
            Generate quiz questions from your document content. Test your understanding with MCQ and fill-in-the-blank questions.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--c-text-secondary)' }}>Questions:</label>
          <select value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', fontSize: '0.875rem', background: 'var(--c-bg-card)', fontFamily: 'var(--font-sans)' }}>
            {[3, 5, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-lg" onClick={generateQuiz}>
          <Sparkles size={18} /> Generate Quiz
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <Loader2 size={32} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
        <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)' }}>Generating quiz questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <div style={{ color: 'var(--c-error)', fontSize: '0.9375rem' }}>{error}</div>
        <button className="btn btn-ghost" onClick={restart}><RotateCcw size={16} /> Try Again</button>
      </div>
    );
  }

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-xl)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: pct >= 70 ? 'var(--c-success-glow)' : 'var(--c-warning-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trophy size={36} style={{ color: pct >= 70 ? 'var(--c-success)' : '#b45309' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--c-text-primary)' }}>{pct}%</div>
          <div style={{ fontSize: '1rem', color: 'var(--c-text-secondary)' }}>{score} / {questions.length} correct</div>
        </div>
        <button className="btn btn-primary" onClick={restart}><RotateCcw size={16} /> Take Another Quiz</button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const allOptions = q.question_type === 'mcq' ? [q.correct_answer, ...(q.distractors || [])].sort(() => Math.random() - 0.5) : [];

  return (
    <div style={{ padding: 'var(--space-xl)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--c-text-secondary)' }}>Question {currentIndex + 1} / {questions.length}</span>
        <span style={{ fontSize: '0.8125rem', color: 'var(--c-text-tertiary)' }}>Score: {score}</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-accent)', textTransform: 'uppercase', marginBottom: 8 }}>
          {q.question_type === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
        </div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--c-text-primary)', lineHeight: 1.5, marginBottom: 'var(--space-xl)' }}>
          {q.question_text}
        </h3>

        {q.question_type === 'mcq' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {allOptions.map((opt, i) => {
              const isCorrect = opt === q.correct_answer;
              const isSelected = selectedAnswer === opt;
              let cls = 'quiz-option';
              if (showResult && isCorrect) cls += ' correct';
              else if (showResult && isSelected && !isCorrect) cls += ' incorrect';
              else if (isSelected) cls += ' selected';
              return (
                <div key={i} className={cls} onClick={() => handleAnswer(opt)}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: showResult && isCorrect ? 'var(--c-success)' : showResult && isSelected ? 'var(--c-error)' : 'transparent' }}>
                    {showResult && isCorrect && <CheckCircle size={14} color="white" />}
                    {showResult && isSelected && !isCorrect && <XCircle size={14} color="white" />}
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--c-text-primary)' }}>{opt}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <input className="input" placeholder="Type your answer..." onKeyDown={e => { if (e.key === 'Enter' && e.target.value) handleAnswer(e.target.value); }} style={{ fontSize: '1rem' }} disabled={showResult} />
            {showResult && <div style={{ marginTop: 'var(--space-md)', fontSize: '0.9375rem', color: 'var(--c-success)', fontWeight: 500 }}>Answer: {q.correct_answer}</div>}
          </div>
        )}
      </div>

      {/* Next */}
      {showResult && (
        <div style={{ paddingTop: 'var(--space-lg)', borderTop: '1px solid var(--c-border)' }}>
          <button className="btn btn-primary" onClick={handleNext} style={{ width: '100%' }}>
            {currentIndex < questions.length - 1 ? <><span>Next Question</span><ArrowRight size={16} /></> : <><Trophy size={16} /><span>See Results</span></>}
          </button>
        </div>
      )}
    </div>
  );
}

function Sparkles(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275z"/></svg>;
}
