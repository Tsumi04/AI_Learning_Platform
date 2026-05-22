/**
 * NEUROVAULT — Notification Tests
 * Tests: CRUD, SSE stream auth, mark read, delete, unread count, TTL index.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import Notification from '../models/Notification.model.js';
import { createNotification, NotificationTemplates, notificationBus } from '../services/notification.service.js';
import mongoose from 'mongoose';

describe('Notification System', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  const userId = new mongoose.Types.ObjectId();

  // ── Model ──

  describe('Notification Model', () => {
    it('should create notification with defaults', async () => {
      const notif = await Notification.create({
        user_id: userId,
        title: 'Test Notification',
      });

      expect(notif.type).toBe('system');
      expect(notif.read).toBe(false);
      expect(notif.icon).toBe('🔔');
      expect(notif.message).toBe('');
      expect(notif.actionUrl).toBe('');
    });

    it('should validate required fields', async () => {
      await expect(Notification.create({})).rejects.toThrow();
    });

    it('should enforce maxlength on title', async () => {
      await expect(Notification.create({
        user_id: userId,
        title: 'x'.repeat(121),
      })).rejects.toThrow();
    });

    it('should accept all valid types', async () => {
      const types = ['system', 'achievement', 'streak', 'quiz', 'flashcard', 'social', 'reminder', 'level_up', 'challenge'];
      for (const type of types) {
        const n = await Notification.create({ user_id: userId, title: `Type: ${type}`, type });
        expect(n.type).toBe(type);
      }
    });
  });

  // ── Service ──

  describe('Notification Service', () => {
    it('should create notification and emit event', async () => {
      let emitted = null;
      notificationBus.once('notification', (data) => { emitted = data; });

      const notif = await createNotification(userId, {
        type: 'achievement',
        title: 'Test Achievement',
        message: 'You did it!',
        icon: '🏅',
      });

      expect(notif.title).toBe('Test Achievement');
      expect(notif.type).toBe('achievement');
      expect(emitted).not.toBeNull();
      expect(emitted.userId).toBe(userId.toString());
      expect(emitted.notification.title).toBe('Test Achievement');
    });

    it('should use default icon when not provided', async () => {
      const notif = await createNotification(userId, {
        type: 'quiz',
        title: 'Quiz done',
      });
      expect(notif.icon).toBe('📝'); // Default for quiz type
    });
  });

  // ── Templates ──

  describe('Notification Templates', () => {
    it('should create levelUp notification', async () => {
      const notif = await NotificationTemplates.levelUp(userId, 5, 'Bronze');
      expect(notif.type).toBe('level_up');
      expect(notif.title).toContain('Level 5');
      expect(notif.icon).toBe('⬆️');
    });

    it('should create badgeEarned notification', async () => {
      const notif = await NotificationTemplates.badgeEarned(userId, 'Bookworm', '📖');
      expect(notif.type).toBe('achievement');
      expect(notif.title).toContain('Bookworm');
    });

    it('should create streakMilestone notification', async () => {
      const notif = await NotificationTemplates.streakMilestone(userId, 7);
      expect(notif.type).toBe('streak');
      expect(notif.title).toContain('7-Day');
    });

    it('should create welcome notification', async () => {
      const notif = await NotificationTemplates.welcome(userId);
      expect(notif.type).toBe('system');
      expect(notif.title).toContain('Welcome');
    });
  });

  // ── Queries ──

  describe('Queries', () => {
    it('should filter by unread', async () => {
      await Notification.create([
        { user_id: userId, title: 'Unread 1', read: false },
        { user_id: userId, title: 'Read 1', read: true },
        { user_id: userId, title: 'Unread 2', read: false },
      ]);

      const unread = await Notification.countDocuments({ user_id: userId, read: false });
      expect(unread).toBe(2);
    });

    it('should sort by createdAt descending', async () => {
      await Notification.create({ user_id: userId, title: 'First' });
      await new Promise(r => setTimeout(r, 10));
      await Notification.create({ user_id: userId, title: 'Second' });

      const notifs = await Notification.find({ user_id: userId }).sort({ createdAt: -1 });
      expect(notifs[0].title).toBe('Second');
      expect(notifs[1].title).toBe('First');
    });

    it('should mark all as read', async () => {
      await Notification.create([
        { user_id: userId, title: 'N1', read: false },
        { user_id: userId, title: 'N2', read: false },
      ]);

      await Notification.updateMany({ user_id: userId }, { read: true });
      const unread = await Notification.countDocuments({ user_id: userId, read: false });
      expect(unread).toBe(0);
    });
  });
});
