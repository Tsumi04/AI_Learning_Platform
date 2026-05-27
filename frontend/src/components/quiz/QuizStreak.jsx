import { useState, useEffect, useRef } from 'react';
import { Flame, Zap, Star } from 'lucide-react';

/**
 * QuizStreak — Streak counter & combo multiplier overlay
 * 
 * Features:
 * - Fire emoji streak counter (🔥 x3, x5, x10)
 * - Combo multiplier for score
 * - Screen shake + particles on high streaks
 * - Animated transitions
 */
export default function QuizStreak({ streak = 0, showAnimation = false }) {
  const [particles, setParticles] = useState([]);
  const prevStreakRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (streak > prevStreakRef.current && streak >= 3 && showAnimation) {
      spawnParticles(streak);
      // Screen shake on 5+ streak
      if (streak >= 5 && containerRef.current) {
        containerRef.current.closest('[data-quiz-container]')?.classList.add('quiz-shake');
        setTimeout(() => {
          containerRef.current?.closest('[data-quiz-container]')?.classList.remove('quiz-shake');
        }, 400);
      }
    }
    prevStreakRef.current = streak;
  }, [streak, showAnimation]);

  const spawnParticles = (count) => {
    const newParticles = Array.from({ length: Math.min(count * 2, 20) }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 800 + 600,
      emoji: ['🔥', '⚡', '💥', '✨', '🌟'][Math.floor(Math.random() * 5)],
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const getStreakLevel = (s) => {
    if (s >= 10) return { label: 'LEGENDARY', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🏆', multiplier: 3 };
    if (s >= 7) return { label: 'ON FIRE', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: '🔥', multiplier: 2.5 };
    if (s >= 5) return { label: 'UNSTOPPABLE', color: '#f97316', bg: 'rgba(249,115,22,0.1)', icon: '💥', multiplier: 2 };
    if (s >= 3) return { label: 'COMBO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', icon: '⚡', multiplier: 1.5 };
    return null;
  };

  const level = getStreakLevel(streak);
  if (!level || streak < 3) return null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Streak badge */}
      <div
        className="animate-scale-in"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0.4rem 1rem',
          borderRadius: 'var(--radius-full)',
          background: level.bg,
          border: `1.5px solid ${level.color}30`,
          animation: streak >= 7 ? 'pulse-glow 1.5s ease-in-out infinite' : undefined,
        }}
      >
        <span style={{ fontSize: '1.125rem' }}>{level.icon}</span>
        <span style={{
          fontSize: '0.75rem', fontWeight: 700, color: level.color,
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {level.label}
        </span>
        <span style={{
          fontSize: '0.875rem', fontWeight: 800, color: level.color,
          fontFamily: 'var(--font-mono)',
        }}>
          ×{streak}
        </span>
        {streak >= 5 && (
          <span style={{
            fontSize: '0.625rem', fontWeight: 600, color: level.color,
            opacity: 0.8, padding: '0.1rem 0.3rem',
            borderRadius: 'var(--radius-sm)',
            background: `${level.color}15`,
          }}>
            {level.multiplier}x pts
          </span>
        )}
      </div>

      {/* Particle effects */}
      {particles.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            animation: `streak-particle ${p.duration}ms ease-out forwards`,
            pointerEvents: 'none',
            zIndex: 100,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

/**
 * Calculate score multiplier based on streak
 */
export function getStreakMultiplier(streak) {
  if (streak >= 10) return 3;
  if (streak >= 7) return 2.5;
  if (streak >= 5) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}
