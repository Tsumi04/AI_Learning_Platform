import { useState } from 'react';
import { Award, Lock, Check } from 'lucide-react';

/**
 * BadgeGrid — Grid hiển thị tất cả badges (earned + locked).
 * Dùng trong Profile page.
 */
export default function BadgeGrid({ badges = [], earnedCount = 0, totalCount = 0 }) {
  const [selectedBadge, setSelectedBadge] = useState(null);

  const categories = ['documents', 'quizzes', 'flashcards', 'streaks', 'engagement', 'mastery', 'special'];
  const categoryLabels = {
    documents: '📚 Documents',
    quizzes: '🧪 Quizzes',
    flashcards: '🃏 Flashcards',
    streaks: '🔥 Streaks',
    engagement: '💬 Engagement',
    mastery: '🧠 Mastery',
    special: '👑 Special',
  };

  return (
    <div className="bento-card" style={{ padding: '1.25rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Award size={16} style={{ color: 'var(--c-accent)' }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>
            Achievements
          </span>
        </div>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600, color: 'var(--c-accent)',
          background: 'var(--c-accent-glow)', padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
        }}>
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* Badge Grid by Category */}
      {categories.map(cat => {
        const catBadges = badges.filter(b => b.category === cat);
        if (catBadges.length === 0) return null;

        return (
          <div key={cat} style={{ marginBottom: '1rem' }}>
            <div style={{
              fontSize: '0.6875rem', fontWeight: 600, color: 'var(--c-text-tertiary)',
              marginBottom: 8, letterSpacing: '0.04em',
            }}>
              {categoryLabels[cat] || cat}
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
              gap: 8,
            }}>
              {catBadges.map(badge => (
                <div
                  key={badge.badge_id}
                  onClick={() => setSelectedBadge(badge)}
                  style={{
                    width: 56, height: 56, borderRadius: 'var(--radius-lg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    background: badge.earned
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))'
                      : 'var(--c-bg-tertiary)',
                    border: badge.earned
                      ? '1px solid rgba(99,102,241,0.2)'
                      : '1px solid var(--c-border)',
                    opacity: badge.earned ? 1 : 0.5,
                    filter: badge.earned ? 'none' : 'grayscale(0.8)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = badge.earned
                      ? '0 4px 16px rgba(99,102,241,0.2)' : '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{badge.icon}</span>
                  {badge.earned && (
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--c-success)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--c-bg-card)',
                    }}>
                      <Check size={8} color="#fff" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Selected badge popup */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="animate-scale-in"
            style={{
              padding: '2rem', borderRadius: 'var(--radius-xl)',
              background: 'var(--c-bg-card)', border: '1px solid var(--c-border)',
              boxShadow: 'var(--shadow-xl)', textAlign: 'center',
              maxWidth: 300, width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{selectedBadge.icon}</div>
            <div style={{
              fontSize: '1.125rem', fontWeight: 700, color: 'var(--c-text-primary)',
              marginBottom: '0.5rem',
            }}>
              {selectedBadge.name}
            </div>
            <div style={{
              fontSize: '0.8125rem', color: 'var(--c-text-secondary)', marginBottom: '1rem',
              lineHeight: 1.5,
            }}>
              {selectedBadge.description}
            </div>
            {selectedBadge.earned ? (
              <div style={{
                fontSize: '0.75rem', color: 'var(--c-success)', fontWeight: 600,
              }}>
                ✅ Earned {selectedBadge.earned_at
                  ? new Date(selectedBadge.earned_at).toLocaleDateString()
                  : ''}
              </div>
            ) : (
              <div style={{
                fontSize: '0.75rem', color: 'var(--c-text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <Lock size={12} /> Not yet earned
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
