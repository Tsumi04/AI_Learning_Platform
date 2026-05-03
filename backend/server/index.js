import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import connectDB from './config/db.js';
import config from './config/env.js';
import setupGoogleAuth from './config/passport.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// ──── Security ────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', config.clientUrl],
  credentials: true,
}));

// ──── Body Parsing ────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──── Passport (Google OAuth) ────
app.use(passport.initialize());
setupGoogleAuth();

// ──── Rate Limiting ────
app.use('/api/', generalLimiter);

// ──── Health Check ────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NEUROVAULT API Gateway v2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: ['auth', 'google-oauth', 'documents', 'ai-chat', 'quiz', 'flashcards', 'knowledge-graph', 'spaced-repetition'],
  });
});

// ──── API Routes ────
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);

// ──── 404 Handler ────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ──── Error Handler ────
app.use(errorHandler);

// ──── Start Server ────
const startServer = async () => {
  await connectDB();

  app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║         NEUROVAULT API Gateway v2.0          ║
║         Running on port ${config.port}                ║
║         Environment: development             ║
║                                              ║
║  Routes:                                     ║
║    /api/auth     — Auth + Google OAuth        ║
║    /api/documents — Document CRUD            ║
║    /api/ai       — Chat, Quiz, Flashcards    ║
╚══════════════════════════════════════════════╝
    `);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
