/**
 * NEUROVAULT — Export Service Tests
 * Tests: Anki TSV, flashcards CSV, concepts CSV, sessions CSV, Markdown, JSON backup.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import {
  exportFlashcardsAnki, exportFlashcardsCSV, exportConceptsCSV,
  exportSessionsCSV, exportDocumentMarkdown, exportFullBackup,
} from '../services/export.service.js';
import LearnerProgress from '../models/LearnerProgress.model.js';
import Document from '../models/Document.model.js';
import KnowledgeNode from '../models/KnowledgeNode.model.js';
import mongoose from 'mongoose';

describe('Export Service', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  const userId = new mongoose.Types.ObjectId();

  // ── Helpers ──
  async function seedFlashcards() {
    return LearnerProgress.create({
      user_id: userId,
      flashcard_states: [
        { front: 'What is AI?', back: 'Artificial Intelligence', stability: 1.5, difficulty: 4.0, review_count: 3 },
        { front: 'What is ML?', back: 'Machine Learning', stability: 2.0, difficulty: 5.0, review_count: 1 },
        { front: 'Tab\there', back: 'Has\ttab', stability: 1.0, difficulty: 5.0, review_count: 0 },
      ],
    });
  }

  // ── Anki ──

  describe('exportFlashcardsAnki', () => {
    it('should return empty for user with no flashcards', async () => {
      const result = await exportFlashcardsAnki(userId);
      expect(result.count).toBe(0);
      expect(result.content).toBe('');
    });

    it('should export as Anki TSV with header', async () => {
      await seedFlashcards();
      const result = await exportFlashcardsAnki(userId);

      expect(result.count).toBe(3);
      expect(result.content).toContain('#separator:tab');
      expect(result.content).toContain('#deck:NeuroVault');
      expect(result.content).toContain('What is AI?');
      expect(result.filename).toMatch(/^neurovault_flashcards_\d+\.txt$/);
    });

    it('should escape tabs in content', async () => {
      await seedFlashcards();
      const result = await exportFlashcardsAnki(userId);
      // Tab characters in content should be replaced with spaces
      const lines = result.content.split('\n').filter(l => !l.startsWith('#'));
      lines.forEach(line => {
        const parts = line.split('\t');
        // Each line should have exactly 3 tab-separated parts (front, back, tags)
        expect(parts.length).toBe(3);
      });
    });
  });

  // ── Flashcards CSV ──

  describe('exportFlashcardsCSV', () => {
    it('should export with CSV header', async () => {
      await seedFlashcards();
      const result = await exportFlashcardsCSV(userId);

      expect(result.count).toBe(3);
      expect(result.content).toContain('Front,Back,Stability,Difficulty');
      expect(result.mimeType).toBe('text/csv');
    });

    it('should escape double quotes in CSV', async () => {
      await LearnerProgress.create({
        user_id: userId,
        flashcard_states: [
          { front: 'He said "hello"', back: 'Quote test', stability: 1.0, difficulty: 5.0, review_count: 0 },
        ],
      });

      const result = await exportFlashcardsCSV(userId);
      expect(result.content).toContain('""hello""'); // CSV-escaped double quotes
    });
  });

  // ── Concepts CSV ──

  describe('exportConceptsCSV', () => {
    it('should export concepts from KnowledgeNode', async () => {
      const docId = new mongoose.Types.ObjectId();
      await KnowledgeNode.create([
        { user_id: userId, document_id: docId, concept: 'Neural Networks', definition: 'A computing model', centrality_score: 0.85 },
        { user_id: userId, document_id: docId, concept: 'Backpropagation', definition: 'Training algorithm', centrality_score: 0.72 },
      ]);

      const result = await exportConceptsCSV(userId);
      expect(result.count).toBe(2);
      expect(result.content).toContain('Neural Networks');
      expect(result.content).toContain('Concept,Definition,MasteryLevel');
    });
  });

  // ── Markdown ──

  describe('exportDocumentMarkdown', () => {
    it('should return null for non-existent document', async () => {
      const result = await exportDocumentMarkdown(userId, new mongoose.Types.ObjectId());
      expect(result).toBeNull();
    });

    it('should export document as markdown', async () => {
      const doc = await Document.create({
        user_id: userId,
        title: 'ML Basics',
        raw_text: 'Machine learning is a subset of AI.',
        language: 'en',
        metadata: { word_count: 7, chunk_count: 1, processing_status: 'completed' },
      });

      const result = await exportDocumentMarkdown(userId, doc._id);
      expect(result.content).toContain('# ML Basics');
      expect(result.content).toContain('Machine learning is a subset of AI.');
      expect(result.content).toContain('**Language:** en');
      expect(result.filename).toMatch(/\.md$/);
    });
  });

  // ── Full Backup ──

  describe('exportFullBackup', () => {
    it('should export valid JSON structure', async () => {
      await seedFlashcards();
      const doc = await Document.create({
        user_id: userId,
        title: 'Backup Test',
        raw_text: 'Content',
        metadata: { processing_status: 'completed' },
      });

      const result = await exportFullBackup(userId);
      const parsed = JSON.parse(result.content);

      expect(parsed.exportVersion).toBe('1.0');
      expect(parsed.platform).toBe('NeuroVault');
      expect(parsed.data.flashcards).toHaveLength(3);
      expect(parsed.data.documents).toHaveLength(1);
      expect(parsed.counts.flashcards).toBe(3);
      expect(result.mimeType).toBe('application/json');
    });

    it('should handle user with no data', async () => {
      const result = await exportFullBackup(new mongoose.Types.ObjectId());
      const parsed = JSON.parse(result.content);

      expect(parsed.data.flashcards).toHaveLength(0);
      expect(parsed.data.documents).toHaveLength(0);
      expect(parsed.counts.flashcards).toBe(0);
    });
  });
});
