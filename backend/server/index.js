import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import config from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';

const app = express();

// ──── Security ────
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// ──── Body Parsing ────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ──── Rate Limiting ────
app.use('/api/', generalLimiter);

// ──── Health Check ────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NEUROVAULT API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ──── API Routes ────
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

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
║         NEUROVAULT API Gateway               ║
║         Running on port ${config.port}                ║
║         Environment: development             ║
╚══════════════════════════════════════════════╝
    `);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
