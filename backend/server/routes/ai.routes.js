import { Router } from 'express';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import config from '../config/env.js';
import axios from 'axios';

const router = Router();

/**
 * GET /api/ai/health
 * Check AI Core connection status
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${config.aiCoreUrl}/health`, { timeout: 3000 });
    res.json({
      ai_core: 'online',
      ...response.data,
    });
  } catch {
    res.json({
      ai_core: 'offline',
      message: 'AI Core server is not running. Start with: python ai_server.py',
    });
  }
});

/**
 * GET /api/ai/stats
 * Get AI Core stats for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const response = await axios.get(`${config.aiCoreUrl}/api/stats`, { timeout: 3000 });
    res.json(response.data);
  } catch {
    res.json({
      total_documents: 0,
      total_chunks: 0,
      total_concepts: 0,
      llm_available: false,
      llm_model: 'unknown',
    });
  }
});

/**
 * POST /api/ai/chat
 * RAG-powered chat with document
 */
router.post('/chat', auth, aiLimiter, async (req, res, next) => {
  try {
    const { document_id, query, chat_history = [] } = req.body;

    if (!document_id || !query) {
      return res.status(400).json({ error: 'document_id and query are required.' });
    }

    const response = await axios.post(`${config.aiCoreUrl}/api/chat`, {
      document_id,
      query,
      chat_history,
    }, { timeout: 60000 });

    res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'AI Core server is offline.',
        message: 'Ensure the Python AI server is running on port 8000.',
      });
    }
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

/**
 * POST /api/ai/quiz
 * Generate quiz from document
 */
router.post('/quiz', auth, async (req, res, next) => {
  try {
    const { document_id, num_questions = 10, difficulty = 0.5 } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.' });
    }

    const response = await axios.post(`${config.aiCoreUrl}/api/quiz`, {
      document_id,
      num_questions,
      difficulty,
    });

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

/**
 * POST /api/ai/flashcards
 * Generate flashcards from document
 */
router.post('/flashcards', auth, async (req, res, next) => {
  try {
    const { document_id, max_cards = 20 } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.' });
    }

    const response = await axios.post(`${config.aiCoreUrl}/api/flashcards`, {
      document_id,
      max_cards,
    });

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

/**
 * POST /api/ai/knowledge-graph
 * Build knowledge graph for document
 */
router.post('/knowledge-graph', auth, async (req, res, next) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.' });
    }

    const response = await axios.post(`${config.aiCoreUrl}/api/knowledge-graph`, {
      document_id,
      file_path: '',
    });

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

/**
 * GET /api/ai/concepts/:documentId
 * Get extracted concepts for document
 */
router.get('/concepts/:documentId', auth, async (req, res, next) => {
  try {
    const response = await axios.get(`${config.aiCoreUrl}/api/concepts/${req.params.documentId}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

/**
 * POST /api/ai/spaced-repetition/review
 * Schedule next review using FSRS
 */
router.post('/spaced-repetition/review', auth, async (req, res, next) => {
  try {
    const response = await axios.post(`${config.aiCoreUrl}/api/spaced-repetition/review`, req.body);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

export default router;
