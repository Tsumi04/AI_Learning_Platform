/**
 * NEUROVAULT — Error Handler + Auth Middleware Tests
 * Tests all error categories: Mongoose, Multer, JWT, Axios, JSON parse.
 */
import { describe, it, expect } from 'vitest';
import errorHandler from '../middleware/errorHandler.js';

// Mock res object
function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res.body = data; return res; },
  };
  return res;
}

const mockReq = { method: 'GET', path: '/test' };
const noop = () => {};

describe('Error Handler Middleware', () => {
  it('should handle Mongoose ValidationError', () => {
    const err = new Error();
    err.name = 'ValidationError';
    err.errors = {
      email: { message: 'Email is required' },
      name: { message: 'Name is required' },
    };

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toContain('Email is required');
  });

  it('should handle duplicate key error (11000)', () => {
    const err = new Error();
    err.code = 11000;
    err.keyPattern = { email: 1 };

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_KEY');
    expect(res.body.error).toContain('email');
  });

  it('should handle CastError (invalid ObjectId)', () => {
    const err = new Error();
    err.name = 'CastError';
    err.path = '_id';
    err.value = 'invalid123';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });

  it('should handle LIMIT_FILE_SIZE', () => {
    const err = new Error();
    err.code = 'LIMIT_FILE_SIZE';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(413);
    expect(res.body.code).toBe('FILE_TOO_LARGE');
  });

  it('should handle file type not allowed', () => {
    const err = new Error('File type not allowed: .exe');

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('should handle TokenExpiredError', () => {
    const err = new Error();
    err.name = 'TokenExpiredError';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
  });

  it('should handle JsonWebTokenError', () => {
    const err = new Error();
    err.name = 'JsonWebTokenError';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_TOKEN');
  });

  it('should handle ECONNREFUSED (AI Core offline)', () => {
    const err = new Error();
    err.code = 'ECONNREFUSED';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('AI_CORE_OFFLINE');
  });

  it('should handle ECONNABORTED (timeout)', () => {
    const err = new Error();
    err.code = 'ECONNABORTED';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(504);
    expect(res.body.code).toBe('AI_CORE_TIMEOUT');
  });

  it('should handle entity.parse.failed (invalid JSON)', () => {
    const err = new Error();
    err.type = 'entity.parse.failed';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(400);
    expect(res.body.code).toBe('INVALID_JSON');
  });

  it('should handle generic 500 errors', () => {
    const err = new Error('Something broke');

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe('SERVER_ERROR');
    // Should NOT expose internal message to client in production
    expect(res.body.error).toBe('Internal server error');
  });

  it('should handle custom statusCode', () => {
    const err = new Error('Custom error');
    err.statusCode = 422;

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toBe('Custom error');
  });

  it('should handle MongooseServerSelectionError (DB down)', () => {
    const err = new Error();
    err.name = 'MongooseServerSelectionError';

    const res = mockRes();
    errorHandler(err, mockReq, res, noop);

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('DB_UNAVAILABLE');
  });
});
