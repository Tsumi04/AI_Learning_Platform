/**
 * NEUROVAULT — Instructor Portal Tests
 * Tests: Course model, role auth middleware, enrollment, gradebook, module management.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupTestDB, clearTestDB, teardownTestDB } from './setup.js';
import Course from '../models/Course.model.js';
import { requireRole, requireInstructor, requireAdmin } from '../middleware/roleAuth.js';
import mongoose from 'mongoose';

// ══════════════════════════════════════════════
// Mock helpers
// ══════════════════════════════════════════════
function mockRes() {
  const res = { statusCode: 200, body: null,
    status(c) { res.statusCode = c; return res; },
    json(d) { res.body = d; return res; },
  };
  return res;
}
const noop = () => {};

describe('Instructor Portal', () => {
  beforeAll(async () => await setupTestDB());
  afterEach(async () => await clearTestDB());
  afterAll(async () => await teardownTestDB());

  const instructorId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();

  // ── Role Auth Middleware ──

  describe('requireRole middleware', () => {
    it('should allow matching role', () => {
      const middleware = requireRole('instructor', 'admin');
      const req = { user: { role: 'instructor' } };
      const res = mockRes();
      let passed = false;
      middleware(req, res, () => { passed = true; });
      expect(passed).toBe(true);
    });

    it('should reject non-matching role', () => {
      const middleware = requireRole('instructor', 'admin');
      const req = { user: { role: 'user' } };
      const res = mockRes();
      middleware(req, res, noop);
      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should reject unauthenticated user', () => {
      const middleware = requireRole('admin');
      const res = mockRes();
      middleware({}, res, noop);
      expect(res.statusCode).toBe(401);
    });

    it('requireInstructor should allow instructor', () => {
      const req = { user: { role: 'instructor' } };
      const res = mockRes();
      let passed = false;
      requireInstructor(req, res, () => { passed = true; });
      expect(passed).toBe(true);
    });

    it('requireInstructor should allow admin', () => {
      const req = { user: { role: 'admin' } };
      const res = mockRes();
      let passed = false;
      requireInstructor(req, res, () => { passed = true; });
      expect(passed).toBe(true);
    });

    it('requireAdmin should reject instructor', () => {
      const req = { user: { role: 'instructor' } };
      const res = mockRes();
      requireAdmin(req, res, noop);
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Course Model ──

  describe('Course Model', () => {
    it('should create course with defaults', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Machine Learning 101',
      });

      expect(course.title).toBe('Machine Learning 101');
      expect(course.status).toBe('draft');
      expect(course.subject).toBe('other');
      expect(course.level).toBe('all');
      expect(course.modules).toHaveLength(0);
      expect(course.enrollments).toHaveLength(0);
      expect(course.settings.max_students).toBe(100);
      expect(course.settings.enrollment_open).toBe(true);
    });

    it('should enforce required title', async () => {
      await expect(Course.create({ instructor_id: instructorId }))
        .rejects.toThrow();
    });

    it('should accept valid subjects', async () => {
      const subjects = ['cs', 'math', 'science', 'language', 'history', 'business', 'art', 'other'];
      for (const subject of subjects) {
        const c = await Course.create({
          instructor_id: instructorId,
          title: `Course: ${subject}`,
          subject,
        });
        expect(c.subject).toBe(subject);
      }
    });

    it('should accept valid levels', async () => {
      const levels = ['beginner', 'intermediate', 'advanced', 'all'];
      for (const level of levels) {
        const c = await Course.create({
          instructor_id: instructorId,
          title: `Level: ${level}`,
          level,
        });
        expect(c.level).toBe(level);
      }
    });

    it('should accept valid statuses', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Status Test',
      });
      expect(course.status).toBe('draft');

      course.status = 'published';
      await course.save();
      expect(course.status).toBe('published');

      course.status = 'archived';
      await course.save();
      expect(course.status).toBe('archived');
    });
  });

  // ── Modules ──

  describe('Course Modules', () => {
    it('should add modules with order', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Module Test',
      });

      course.modules.push(
        { title: 'Module 1', order: 0 },
        { title: 'Module 2', order: 1 },
        { title: 'Module 3', order: 2 },
      );
      await course.save();

      expect(course.modules).toHaveLength(3);
      expect(course.modules[0].title).toBe('Module 1');
      expect(course.modules[2].order).toBe(2);
    });

    it('should enforce module title', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Module Validation',
      });

      course.modules.push({ order: 0 }); // Missing title
      await expect(course.save()).rejects.toThrow();
    });

    it('should support document linking', async () => {
      const docId = new mongoose.Types.ObjectId();
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Doc Link Test',
      });

      course.modules.push({
        title: 'Reading Module',
        order: 0,
        document_ids: [docId],
      });
      await course.save();

      expect(course.modules[0].document_ids).toHaveLength(1);
      expect(course.modules[0].document_ids[0].toString()).toBe(docId.toString());
    });

    it('should support completion requirements', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Req Test',
      });

      course.modules.push({
        title: 'Quiz Module',
        order: 0,
        requirements: { min_quiz_score: 80, min_study_minutes: 30 },
      });
      await course.save();

      expect(course.modules[0].requirements.min_quiz_score).toBe(80);
      expect(course.modules[0].requirements.min_study_minutes).toBe(30);
    });
  });

  // ── Enrollment ──

  describe('Enrollment', () => {
    it('should enroll student', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Enroll Test',
      });

      course.enrollments.push({ student_id: studentId });
      course.stats.total_enrolled = 1;
      await course.save();

      expect(course.enrollments).toHaveLength(1);
      expect(course.enrollments[0].status).toBe('active');
      expect(course.stats.total_enrolled).toBe(1);
    });

    it('should track enrollment progress', async () => {
      const moduleId = new mongoose.Types.ObjectId();
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Progress Test',
      });

      course.enrollments.push({
        student_id: studentId,
        progress: {
          completed_modules: [moduleId],
          current_module_index: 1,
          overall_percent: 33,
        },
      });
      await course.save();

      const enrollment = course.enrollments[0];
      expect(enrollment.progress.completed_modules).toHaveLength(1);
      expect(enrollment.progress.current_module_index).toBe(1);
      expect(enrollment.progress.overall_percent).toBe(33);
    });

    it('should track student grades', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Grade Test',
      });

      course.enrollments.push({
        student_id: studentId,
        grade: {
          quiz_average: 85,
          flashcard_mastery: 72,
          total_study_minutes: 120,
          final_grade: 'B',
        },
      });
      await course.save();

      const grade = course.enrollments[0].grade;
      expect(grade.quiz_average).toBe(85);
      expect(grade.final_grade).toBe('B');
    });

    it('should support enrollment status transitions', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Status Test',
      });

      course.enrollments.push({ student_id: studentId });
      await course.save();
      expect(course.enrollments[0].status).toBe('active');

      course.enrollments[0].status = 'completed';
      await course.save();
      expect(course.enrollments[0].status).toBe('completed');

      course.enrollments[0].status = 'dropped';
      await course.save();
      expect(course.enrollments[0].status).toBe('dropped');
    });
  });

  // ── Settings ──

  describe('Course Settings', () => {
    it('should have default settings', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Default Settings',
      });

      expect(course.settings.max_students).toBe(100);
      expect(course.settings.enrollment_open).toBe(true);
      expect(course.settings.require_approval).toBe(false);
      expect(course.settings.allow_self_paced).toBe(true);
    });

    it('should update settings', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Custom Settings',
      });

      course.settings.max_students = 30;
      course.settings.require_approval = true;
      await course.save();

      expect(course.settings.max_students).toBe(30);
      expect(course.settings.require_approval).toBe(true);
    });
  });

  // ── Queries ──

  describe('Course Queries', () => {
    it('should find by instructor', async () => {
      const otherId = new mongoose.Types.ObjectId();
      await Course.create([
        { instructor_id: instructorId, title: 'My Course' },
        { instructor_id: otherId, title: 'Their Course' },
      ]);

      const mine = await Course.find({ instructor_id: instructorId });
      expect(mine).toHaveLength(1);
      expect(mine[0].title).toBe('My Course');
    });

    it('should find published courses', async () => {
      await Course.create([
        { instructor_id: instructorId, title: 'Draft', status: 'draft' },
        { instructor_id: instructorId, title: 'Published', status: 'published' },
      ]);

      const published = await Course.find({ status: 'published' });
      expect(published).toHaveLength(1);
      expect(published[0].title).toBe('Published');
    });

    it('should find by enrolled student', async () => {
      const course = await Course.create({
        instructor_id: instructorId,
        title: 'Enrolled Query',
      });
      course.enrollments.push({ student_id: studentId });
      await course.save();

      const found = await Course.find({ 'enrollments.student_id': studentId });
      expect(found).toHaveLength(1);
    });
  });
});
