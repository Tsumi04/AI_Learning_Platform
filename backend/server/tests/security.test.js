/**
 * NEUROVAULT — Security Middleware Tests
 * Tests: MongoDB injection protection, XSS stripping, magic bytes validation, audit logging.
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeInput, sanitizeXSS, validateFileMagicBytes,
  logAuditEvent, getAuditLog,
} from '../middleware/security.js';

// ══════════════════════════════════════════════
// MOCK HELPERS
// ══════════════════════════════════════════════

function mockReq(overrides = {}) {
  return {
    body: {},
    query: {},
    params: {},
    ...overrides,
  };
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

const next = () => {};

// ══════════════════════════════════════════════
// MongoDB Injection Protection
// ══════════════════════════════════════════════

describe('sanitizeInput (MongoDB Injection)', () => {
  it('should strip $gt from query', () => {
    const req = mockReq({ query: { age: { $gt: '' } } });
    sanitizeInput(req, {}, next);
    expect(req.query.age).toEqual({});
  });

  it('should strip $ne from body', () => {
    const req = mockReq({ body: { password: { $ne: '' } } });
    sanitizeInput(req, {}, next);
    expect(req.body.password).toEqual({});
  });

  it('should strip $where from params', () => {
    const req = mockReq({ params: { id: { $where: 'function(){}' } } });
    sanitizeInput(req, {}, next);
    expect(req.params.id).toEqual({});
  });

  it('should preserve normal string values', () => {
    const req = mockReq({ body: { email: 'test@test.com', name: 'John' } });
    sanitizeInput(req, {}, next);
    expect(req.body.email).toBe('test@test.com');
    expect(req.body.name).toBe('John');
  });

  it('should preserve nested objects without $ keys', () => {
    const req = mockReq({ body: { metadata: { score: 95, level: 'advanced' } } });
    sanitizeInput(req, {}, next);
    expect(req.body.metadata.score).toBe(95);
    expect(req.body.metadata.level).toBe('advanced');
  });
});

// ══════════════════════════════════════════════
// XSS Sanitization
// ══════════════════════════════════════════════

describe('sanitizeXSS', () => {
  it('should strip script tags', () => {
    const req = mockReq({ body: { title: 'Hello <script>alert("xss")</script> World' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.title).toBe('Hello  World');
    expect(req.body.title).not.toContain('<script>');
  });

  it('should strip onclick handlers', () => {
    const req = mockReq({ body: { desc: '<div onclick="alert(1)">Click</div>' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.desc).not.toContain('onclick');
  });

  it('should strip javascript: URLs', () => {
    const req = mockReq({ body: { url: 'javascript:alert(1)' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.url).not.toContain('javascript:');
  });

  it('should strip onerror handlers', () => {
    const req = mockReq({ body: { img: '<img onerror="alert(1)" src="x">' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.img).not.toContain('onerror');
  });

  it('should preserve safe HTML', () => {
    const req = mockReq({ body: { content: '<b>Bold</b> and <i>italic</i>' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.content).toContain('<b>Bold</b>');
    expect(req.body.content).toContain('<i>italic</i>');
  });

  it('should handle arrays', () => {
    const req = mockReq({ body: { tags: ['<script>x</script>', 'safe'] } });
    sanitizeXSS(req, {}, next);
    expect(req.body.tags[0]).toBe('');
    expect(req.body.tags[1]).toBe('safe');
  });

  it('should handle nested objects recursively', () => {
    const req = mockReq({ body: { nested: { deep: { value: '<script>x</script>' } } } });
    sanitizeXSS(req, {}, next);
    expect(req.body.nested.deep.value).toBe('');
  });

  it('should preserve numbers and booleans', () => {
    const req = mockReq({ body: { count: 42, active: true, name: null } });
    sanitizeXSS(req, {}, next);
    expect(req.body.count).toBe(42);
    expect(req.body.active).toBe(true);
    expect(req.body.name).toBeNull();
  });

  it('should strip data:text/html payloads', () => {
    const req = mockReq({ body: { link: 'data:text/html,<h1>evil</h1>' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.link).not.toContain('data:text/html');
  });

  it('should strip vbscript', () => {
    const req = mockReq({ body: { payload: 'vbscript:MsgBox("xss")' } });
    sanitizeXSS(req, {}, next);
    expect(req.body.payload).not.toContain('vbscript:');
  });
});

// ══════════════════════════════════════════════
// Magic Bytes Validation
// ══════════════════════════════════════════════

describe('validateFileMagicBytes', () => {
  it('should pass when no file uploaded', () => {
    const req = mockReq();
    const res = mockRes();
    let called = false;
    validateFileMagicBytes(req, res, () => { called = true; });
    expect(called).toBe(true);
  });

  it('should pass for text file types (no magic check)', () => {
    const req = mockReq({ file: { mimetype: 'text/plain', path: '/fake' } });
    const res = mockRes();
    let called = false;
    validateFileMagicBytes(req, res, () => { called = true; });
    expect(called).toBe(true);
  });
});

// ══════════════════════════════════════════════
// Audit Logging
// ══════════════════════════════════════════════

describe('Audit Logging', () => {
  it('should log audit event', () => {
    logAuditEvent('user123', 'AUTH_LOGIN', { ip: '127.0.0.1' });
    const log = getAuditLog(1);
    expect(log).toHaveLength(1);
    expect(log[0].userId).toBe('user123');
    expect(log[0].action).toBe('AUTH_LOGIN');
    expect(log[0].ip).toBe('127.0.0.1');
  });

  it('should return logs in reverse chronological order', () => {
    logAuditEvent('user1', 'FIRST');
    logAuditEvent('user2', 'SECOND');
    const log = getAuditLog(2);
    expect(log[0].action).toBe('SECOND');
    expect(log[1].action).toBe('FIRST');
  });

  it('should handle anonymous userId', () => {
    logAuditEvent(null, 'ANON_ACTION');
    const log = getAuditLog(1);
    expect(log[0].userId).toBe('anonymous');
  });

  it('should limit log size', () => {
    const log = getAuditLog(1000);
    expect(log.length).toBeLessThanOrEqual(1000);
  });
});
