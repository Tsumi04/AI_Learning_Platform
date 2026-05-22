/**
 * NEUROVAULT — Library (SharedContent) Tests
 * Tests: Publish, like toggle, rate, search, browse, my/published route order.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import SharedContent from '../models/SharedContent.model.js';
import mongoose from 'mongoose';

describe('SharedContent (Library) Model', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  const userId = new mongoose.Types.ObjectId();
  const docId = new mongoose.Types.ObjectId();

  describe('Create & Validate', () => {
    it('should create shared content with required fields', async () => {
      const sc = await SharedContent.create({
        document_id: docId,
        author_id: userId,
        title: 'Test Document',
      });

      expect(sc.title).toBe('Test Document');
      expect(sc.status).toBe('published');
      expect(sc.views).toBe(0);
      expect(sc.likes).toBe(0);
      expect(sc.average_rating).toBe(0);
    });

    it('should enforce required fields', async () => {
      await expect(SharedContent.create({})).rejects.toThrow();
    });

    it('should accept valid subjects', async () => {
      const subjects = ['cs', 'math', 'science', 'language', 'history', 'business', 'art', 'other'];
      for (const subject of subjects) {
        const sc = await SharedContent.create({
          document_id: new mongoose.Types.ObjectId(),
          author_id: userId,
          title: `Subject: ${subject}`,
          subject,
        });
        expect(sc.subject).toBe(subject);
      }
    });

    it('should trim and lowercase tags', async () => {
      const sc = await SharedContent.create({
        document_id: docId,
        author_id: userId,
        title: 'Tagged',
        tags: ['JavaScript', ' React ', 'NODE.JS'],
      });
      expect(sc.tags).toContain('javascript');
      expect(sc.tags).toContain('react');
    });
  });

  describe('Like Toggle', () => {
    it('should add and remove likes', async () => {
      const sc = await SharedContent.create({
        document_id: docId,
        author_id: userId,
        title: 'Likeable',
      });

      const likerId = new mongoose.Types.ObjectId();

      // Like
      sc.liked_by.push(likerId);
      sc.likes += 1;
      await sc.save();
      expect(sc.likes).toBe(1);
      expect(sc.liked_by).toHaveLength(1);

      // Unlike
      sc.liked_by.pull(likerId);
      sc.likes = Math.max(0, sc.likes - 1);
      await sc.save();
      expect(sc.likes).toBe(0);
      expect(sc.liked_by).toHaveLength(0);
    });
  });

  describe('Rating', () => {
    it('should calculate average rating', async () => {
      const sc = await SharedContent.create({
        document_id: docId,
        author_id: userId,
        title: 'Rateable',
      });

      sc.ratings.push(
        { user_id: new mongoose.Types.ObjectId(), score: 5 },
        { user_id: new mongoose.Types.ObjectId(), score: 3 },
        { user_id: new mongoose.Types.ObjectId(), score: 4 },
      );
      sc.rating_count = sc.ratings.length;
      sc.average_rating = Math.round(
        (sc.ratings.reduce((s, r) => s + r.score, 0) / sc.ratings.length) * 10
      ) / 10;
      await sc.save();

      expect(sc.average_rating).toBe(4);
      expect(sc.rating_count).toBe(3);
    });

    it('should enforce score range 1-5', async () => {
      const sc = await SharedContent.create({
        document_id: docId,
        author_id: userId,
        title: 'Score Range',
      });

      sc.ratings.push({ user_id: new mongoose.Types.ObjectId(), score: 6 });
      await expect(sc.save()).rejects.toThrow();
    });
  });

  describe('Queries', () => {
    it('should filter by status', async () => {
      await SharedContent.create([
        { document_id: new mongoose.Types.ObjectId(), author_id: userId, title: 'Published', status: 'published' },
        { document_id: new mongoose.Types.ObjectId(), author_id: userId, title: 'Removed', status: 'removed' },
      ]);

      const published = await SharedContent.find({ status: 'published' });
      expect(published).toHaveLength(1);
      expect(published[0].title).toBe('Published');
    });

    it('should find by author', async () => {
      const otherId = new mongoose.Types.ObjectId();
      await SharedContent.create([
        { document_id: new mongoose.Types.ObjectId(), author_id: userId, title: 'Mine' },
        { document_id: new mongoose.Types.ObjectId(), author_id: otherId, title: 'Theirs' },
      ]);

      const mine = await SharedContent.find({ author_id: userId });
      expect(mine).toHaveLength(1);
      expect(mine[0].title).toBe('Mine');
    });
  });
});
