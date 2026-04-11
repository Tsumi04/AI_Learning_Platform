import { Router } from 'express';
import { register, login, refreshToken, getMe, logout } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.get('/me', auth, getMe);
router.post('/logout', auth, logout);

export default router;
