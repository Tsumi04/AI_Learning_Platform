/**
 * NEUROVAULT — Gamification Model Tests
 * Tests: XP calculation, level formula, tier mapping, badge awarding, daily challenges.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import Gamification from '../models/Gamification.model.js';
import mongoose from 'mongoose';

describe('Gamification Model', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  const userId = new mongoose.Types.ObjectId();

  // ── Static methods ──

  describe('calculateLevel', () => {
    it('should return 0 for 0 XP', () => {
      expect(Gamification.calculateLevel(0)).toBe(0);
    });

    it('should return 1 for 100 XP', () => {
      expect(Gamification.calculateLevel(100)).toBe(1);
    });

    it('should return 3 for 900 XP', () => {
      expect(Gamification.calculateLevel(900)).toBe(3);
    });

    it('should return 10 for 10000 XP', () => {
      expect(Gamification.calculateLevel(10000)).toBe(10);
    });

    it('should handle partial levels correctly', () => {
      // 99 XP → level 0 (not yet 100)
      expect(Gamification.calculateLevel(99)).toBe(0);
      // 399 XP → level 1 (not yet 400 for level 2)
      expect(Gamification.calculateLevel(399)).toBe(1);
    });
  });

  describe('calculateTier', () => {
    it('should return Bronze for levels 0-5', () => {
      expect(Gamification.calculateTier(0)).toBe('Bronze');
      expect(Gamification.calculateTier(5)).toBe('Bronze');
    });

    it('should return Silver for levels 6-10', () => {
      expect(Gamification.calculateTier(6)).toBe('Silver');
      expect(Gamification.calculateTier(10)).toBe('Silver');
    });

    it('should return Gold for levels 11-15', () => {
      expect(Gamification.calculateTier(11)).toBe('Gold');
      expect(Gamification.calculateTier(15)).toBe('Gold');
    });

    it('should return Platinum for levels 16-20', () => {
      expect(Gamification.calculateTier(16)).toBe('Platinum');
      expect(Gamification.calculateTier(20)).toBe('Platinum');
    });

    it('should return Diamond for levels 21+', () => {
      expect(Gamification.calculateTier(21)).toBe('Diamond');
      expect(Gamification.calculateTier(100)).toBe('Diamond');
    });
  });

  describe('xpForLevel', () => {
    it('should return 0 for level 0', () => {
      expect(Gamification.xpForLevel(0)).toBe(0);
    });

    it('should return 100 for level 1', () => {
      expect(Gamification.xpForLevel(1)).toBe(100);
    });

    it('should return 400 for level 2', () => {
      expect(Gamification.xpForLevel(2)).toBe(400);
    });
  });

  describe('progressToNextLevel', () => {
    it('should return 0 for 0 XP', () => {
      expect(Gamification.progressToNextLevel(0)).toBe(0);
    });

    it('should return 0.5 for 50 XP (halfway to level 1)', () => {
      expect(Gamification.progressToNextLevel(50)).toBe(0.5);
    });

    it('should return value between 0 and 1', () => {
      const progress = Gamification.progressToNextLevel(250);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    });
  });

  // ── Instance methods ──

  describe('awardXP', () => {
    it('should increase XP and return result', async () => {
      const profile = await Gamification.create({ user_id: userId });
      const result = profile.awardXP(100, 'test', 'Test XP');

      expect(result.xpGained).toBe(100);
      expect(profile.xp).toBe(100);
      expect(profile.level).toBe(1);
      expect(result.leveledUp).toBe(true);
    });

    it('should not level up for small XP', async () => {
      const profile = await Gamification.create({ user_id: userId });
      const result = profile.awardXP(10, 'test');

      expect(result.leveledUp).toBe(false);
      expect(profile.level).toBe(0);
    });

    it('should not accept negative or zero XP', async () => {
      const profile = await Gamification.create({ user_id: userId });
      const result = profile.awardXP(0, 'test');

      expect(result.xpGained).toBe(0);
      expect(result.leveledUp).toBe(false);
    });

    it('should keep XP log limited to 50 entries', async () => {
      const profile = await Gamification.create({ user_id: userId });
      for (let i = 0; i < 60; i++) {
        profile.awardXP(1, 'test', `Action ${i}`);
      }
      expect(profile.xp_log.length).toBeLessThanOrEqual(50);
    });

    it('should update tier correctly', async () => {
      const profile = await Gamification.create({ user_id: userId });
      profile.awardXP(5000, 'bulk_test');
      // 5000 XP → level 7 → Silver
      expect(profile.tier).toBe('Silver');
    });
  });

  describe('tryAwardBadge', () => {
    it('should award new badge', async () => {
      const profile = await Gamification.create({ user_id: userId });
      const badge = profile.tryAwardBadge({
        badge_id: 'test_badge',
        name: 'Test Badge',
        description: 'For testing',
        icon: '🧪',
        category: 'special',
      });

      expect(badge).not.toBeNull();
      expect(badge.badge_id).toBe('test_badge');
      expect(profile.badges).toHaveLength(1);
    });

    it('should not award duplicate badge', async () => {
      const profile = await Gamification.create({ user_id: userId });
      const def = { badge_id: 'dup', name: 'Dup', description: '', icon: '', category: 'special' };
      profile.tryAwardBadge(def);
      const second = profile.tryAwardBadge(def);

      expect(second).toBeNull();
      expect(profile.badges).toHaveLength(1);
    });
  });

  // ── Database constraints ──

  describe('Database', () => {
    it('should enforce unique user_id', async () => {
      await Gamification.ensureIndexes();
      await Gamification.create({ user_id: userId });
      await expect(Gamification.create({ user_id: userId })).rejects.toThrow();
    });

    it('should create with defaults', async () => {
      const profile = await Gamification.create({ user_id: userId });
      expect(profile.xp).toBe(0);
      expect(profile.level).toBe(0);
      expect(profile.tier).toBe('Bronze');
      expect(profile.badges).toHaveLength(0);
      expect(profile.daily_challenges).toHaveLength(0);
    });
  });
});
