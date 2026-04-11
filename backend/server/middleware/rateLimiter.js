import rateLimit from 'express-rate-limit';

// General API rate limit: 100 requests / 15 minutes
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limit: 20 requests / 15 minutes (anti brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI inference rate limit: 30 requests / minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'AI request rate limit exceeded. Please wait a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});
