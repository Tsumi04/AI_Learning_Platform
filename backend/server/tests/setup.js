/**
 * NEUROVAULT — Test Setup
 * MongoDB Memory Server lifecycle for isolated integration tests.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongod;

/**
 * Start in-memory MongoDB before all tests.
 */
export async function setupTestDB() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
}

/**
 * Drop all collections between tests.
 */
export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Disconnect and stop memory server.
 */
export async function teardownTestDB() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

/**
 * Create a test user directly in DB and return { user, accessToken, refreshToken }.
 */
export async function createTestUser(overrides = {}) {
  const User = (await import('../models/User.model.js')).default;

  const userData = {
    email: overrides.email || `test${Date.now()}@test.com`,
    password_hash: overrides.password || 'TestPass123',
    name: overrides.name || 'Test User',
    ...overrides,
  };

  const user = new User(userData);
  await user.save();

  const secret = 'test_jwt_secret';
  const accessToken = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user._id.toString() }, secret, { expiresIn: '7d' });

  user.refresh_token = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
}

/**
 * Build express app for testing (isolated from index.js server start).
 */
export async function createTestApp() {
  const { default: express } = await import('express');
  const { default: errorHandler } = await import('../middleware/errorHandler.js');

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return { app, errorHandler };
}

/**
 * Mock auth middleware — bypasses JWT and injects userId directly.
 */
export function mockAuth(userId) {
  return (req, _res, next) => {
    req.userId = userId;
    req.user = { _id: userId, name: 'Test User', email: 'test@test.com' };
    next();
  };
}
