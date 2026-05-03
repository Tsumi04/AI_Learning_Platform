import { useState, useEffect } from 'react';
import { Layers, RotateCcw, ThumbsDown, ThumbsUp, Zap, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiAPI } from '../../services/api';

const ratingButtons = [
  { rating: 1, label: 'Again', color: 'var(--c-error)', icon: RotateCcw },
  { rating: 2, label: 'Hard', color: '#b45309', icon: ThumbsDown },
  { rating: 3, label: 'Good', color: 'var(--c-success)', icon: ThumbsUp },
  { rating: 4, label: 'Easy', color: 'var(--c-accent)', icon: Zap },
];

export default function FlashcardView({ documentId }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [maxCards, setMaxCards] = useState(10);

  const generateCards = async () => {
    try {
      setIsLoading(true); setError(''); setStarted(true);
      const data = await aiAPI.generateFlashcards(documentId, maxCards);
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards);
        setCurrentIndex(0); setReviewed(0);
      } else {
        setError('No flashcards generated. The document may need more content.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate flashcards. Make sure AI server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = async (rating) => {
    setReviewed(prev => prev + 1);
    // Call FSRS scheduling
    try {
      await aiAPI.scheduleReview(rating, 1.0, 5.0, 0, 1);
    } catch {}
    // Next card
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      setStarted(false);
    }
  };

  if (!started || cards.length === 0) {
    if (reviewed > 0 && cards.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--c-success-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={36} style={{ color: 'var(--c-success)' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>Session Complete!</div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', marginTop: 4 }}>{reviewed} cards reviewed</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setStarted(false); setReviewed(0); setCards([]); }}>
            <RotateCcw size={16} /> Study Again
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-xl)', padding: 'var(--space-xl)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 'var(--radius-xl)', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={32} style={{ color: '#10b981' }} strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--c-text-primary)', marginBottom: 8 }}>Flashcard Study</h3>
          <p style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)', maxWidth: 400 }}>
            AI-generated flashcards with spaced repetition (FSRS). Tap a card to reveal the answer, then rate your recall.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--c-text-secondary)' }}>Cards:</label>
          <select value={maxCards} onChange={e => setMaxCards(Number(e.target.value))} style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--c-border)', fontSize: '0.875rem', background: 'var(--c-bg-card)', fontFamily: 'var(--font-sans)' }}>
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-lg" onClick={generateCards}>
          <Layers size={18} /> Generate Flashcards
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <Loader2 size={32} style={{ color: 'var(--c-accent)', animation: 'rotate-slow 1s linear infinite' }} />
        <div style={{ fontSize: '0.9375rem', color: 'var(--c-text-secondary)' }}>Generating flashcards...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 'var(--space-lg)' }}>
        <div style={{ color: 'var(--c-error)', fontSize: '0.9375rem' }}>{error}</div>
        <button className="btn btn-ghost" onClick={() => { setStarted(false); setError(''); }}><RotateCcw size={16} /> Try Again</button>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 'var(--space-xl)', gap: 'var(--space-xl)' }}>
      {/* Progress */}
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--c-text-secondary)', marginBottom: 8 }}>
          <span>Card {currentIndex + 1} / {cards.length}</span>
          <span className="badge badge-accent">{card.card_type}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="flashcard-container" style={{ width: '100%', maxWidth: 500, cursor: 'pointer' }} onClick={() => setIsFlipped(!isFlipped)}>
        <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-front">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Question</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--c-text-primary)', textAlign: 'center', lineHeight: 1.6 }}>
              {card.front}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--c-text-tertiary)', marginTop: 'var(--space-lg)' }}>Tap to reveal</div>
          </div>
          <div className="flashcard-back">
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', marginBottom: 'var(--space-md)' }}>Answer</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.6 }}>
              {card.back}
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="animate-fade-in-up" style={{ display: 'flex', gap: 'var(--space-md)', width: '100%', maxWidth: 500 }}>
          {ratingButtons.map(btn => (
            <button key={btn.rating} onClick={() => handleRate(btn.rating)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--c-border)', background: 'var(--c-bg-card)',
              cursor: 'pointer', transition: 'all var(--duration-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.transform = 'none'; }}>
              <btn.icon size={18} style={{ color: btn.color }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
