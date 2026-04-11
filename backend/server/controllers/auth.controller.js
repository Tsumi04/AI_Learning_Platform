import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import config from '../config/env.js';

/**
 * Tạo access + refresh token pair
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expire });
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpire });
  return { accessToken, refreshToken };
};

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check duplicate
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Create user (password_hash field — pre-save hook sẽ hash)
    const user = new User({
      email,
      password_hash: password,
      name,
      avatar: name.charAt(0).toUpperCase(),
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refresh_token = refreshToken;
    await user.save();

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user (include password_hash for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    // Find user and verify stored token matches
    const user = await User.findById(decoded.userId);
    if (!user || user.refresh_token !== token) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    // Generate new token pair
    const newTokens = generateTokens(user._id);

    // Update stored refresh token (rotation)
    user.refresh_token = newTokens.refreshToken;
    await user.save();

    res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Requires: auth middleware
 */
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      user.refresh_token = null;
      await user.save();
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};
