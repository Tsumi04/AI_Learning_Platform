import { Router } from 'express';
import auth from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import config from '../config/env.js';
import axios from 'axios';

const router = Router();

/**
 * Helper: Proxy request tới AI Core với error handling chuẩn
 * @param {string} method - HTTP method
 * @param {string} path - Đường dẫn API trên AI Core
 * @param {object} data - Body data (cho POST)
 * @param {number} timeoutMs - Timeout tính bằng ms
 * @returns {Promise<object>} Response data từ AI Core
 */
async function proxyToAICore(method, path, data = null, timeoutMs = 30000) {
  const url = `${config.aiCoreUrl}${path}`;
  const options = {
    method,
    url,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json' },
  };

  if (data) {
    options.data = data;
  }

  return axios(options);
}

/**
 * Middleware: Kiểm tra AI Core availability trước khi proxy
 */
const checkAICoreAvailable = async (req, res, next) => {
  try {
    await axios.get(`${config.aiCoreUrl}/health`, { timeout: 3000 });
    next();
  } catch {
    return res.status(503).json({
      error: 'AI Core server is offline.',
      message: 'Ensure the Python AI server is running on port 8000.',
      code: 'AI_CORE_OFFLINE',
      hint: 'cd backend/ai_core && python api/ai_server.py',
    });
  }
};

// ──────────────────────────────────────────────
// Health & Stats
// ──────────────────────────────────────────────

/**
 * GET /api/ai/health
 * Check AI Core + Ollama connection status
 */
router.get('/health', async (req, res) => {
  const result = {
    ai_core: 'offline',
    ollama: 'offline',
    model: config.ollama.model,
  };

  // Check AI Core
  try {
    const response = await axios.get(`${config.aiCoreUrl}/health`, { timeout: 3000 });
    result.ai_core = 'online';
    result.ai_core_details = response.data;
  } catch {
    result.ai_core = 'offline';
  }

  // Check Ollama
  try {
    const response = await axios.get(`${config.ollama.url}/api/tags`, { timeout: 3000 });
    const models = response.data?.models?.map(m => m.name) || [];
    result.ollama = 'online';
    result.ollama_models = models;
    result.gemma4_ready = models.some(m => m.includes('gemma4'));
  } catch {
    result.ollama = 'offline';
  }

  res.json(result);
});

/**
 * GET /api/ai/stats
 * Get AI Core stats for dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const response = await proxyToAICore('get', '/api/stats');
    res.json(response.data);
  } catch {
    res.json({
      total_documents: 0,
      total_chunks: 0,
      total_concepts: 0,
      llm_available: false,
      llm_model: config.ollama.model,
    });
  }
});

// ──────────────────────────────────────────────
// Chat — RAG-powered với SSE streaming support
// ──────────────────────────────────────────────

/**
 * POST /api/ai/chat
 * RAG-powered chat với document — hỗ trợ cả JSON response và SSE streaming
 * Body: { document_id, query, chat_history?, stream? }
 */
router.post('/chat', auth, aiLimiter, async (req, res, next) => {
  try {
    const { document_id, query, chat_history = [], stream = false } = req.body;

    if (!document_id || !query) {
      return res.status(400).json({
        error: 'document_id and query are required.',
        code: 'MISSING_PARAMS',
      });
    }

    if (query.length > 5000) {
      return res.status(400).json({
        error: 'Query too long. Maximum 5000 characters.',
        code: 'QUERY_TOO_LONG',
      });
    }

    // ── SSE Streaming Mode ──
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Nginx compatibility

      try {
        const streamResponse = await axios.post(
          `${config.aiCoreUrl}/api/chat/stream`,
          { document_id, query, chat_history },
          {
            timeout: 120000, // 2 phút cho streaming
            responseType: 'stream',
          }
        );

        // Pipe SSE stream trực tiếp từ AI Core
        streamResponse.data.on('data', (chunk) => {
          res.write(chunk);
        });

        streamResponse.data.on('end', () => {
          res.write('data: [DONE]\n\n');
          res.end();
        });

        streamResponse.data.on('error', (err) => {
          console.error('[AI Chat Stream] Error:', err.message);
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          res.end();
        });

        // Client disconnect
        req.on('close', () => {
          streamResponse.data.destroy();
        });
      } catch (err) {
        // Fallback: gửi error qua SSE format
        res.write(`data: ${JSON.stringify({ error: 'AI Core streaming failed: ' + err.message })}\n\n`);
        res.end();
      }

      return; // Đã xử lý streaming, không cần tiếp
    }

    // ── JSON Mode (mặc định) ──
    const response = await proxyToAICore('post', '/api/chat', {
      document_id,
      query,
      chat_history,
    }, 60000);

    res.json(response.data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: 'AI Core server is offline.',
        code: 'AI_CORE_OFFLINE',
      });
    }
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Quiz Generation
// ──────────────────────────────────────────────

/**
 * POST /api/ai/quiz
 * Generate quiz questions from document
 * Body: { document_id, num_questions?, difficulty?, question_types? }
 */
router.post('/quiz', auth, checkAICoreAvailable, async (req, res, next) => {
  try {
    const {
      document_id,
      num_questions = 10,
      difficulty = 0.5,
      question_types = ['mcq', 'fill_blank', 'true_false'],
    } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.', code: 'MISSING_PARAMS' });
    }

    if (num_questions < 1 || num_questions > 50) {
      return res.status(400).json({ error: 'num_questions must be 1-50.', code: 'INVALID_PARAMS' });
    }

    const response = await proxyToAICore('post', '/api/quiz', {
      document_id,
      num_questions: Math.min(Math.max(num_questions, 1), 50),
      difficulty: Math.min(Math.max(difficulty, 0), 1),
      question_types,
    }, 60000);

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Flashcard Generation
// ──────────────────────────────────────────────

/**
 * POST /api/ai/flashcards
 * Generate flashcards from document
 * Body: { document_id, max_cards? }
 */
router.post('/flashcards', auth, checkAICoreAvailable, async (req, res, next) => {
  try {
    const { document_id, max_cards = 20 } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.', code: 'MISSING_PARAMS' });
    }

    const response = await proxyToAICore('post', '/api/flashcards', {
      document_id,
      max_cards: Math.min(Math.max(max_cards, 1), 100),
    }, 60000);

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Knowledge Graph
// ──────────────────────────────────────────────

/**
 * POST /api/ai/knowledge-graph
 * Build knowledge graph for document
 * Body: { document_id }
 */
router.post('/knowledge-graph', auth, checkAICoreAvailable, async (req, res, next) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.', code: 'MISSING_PARAMS' });
    }

    const response = await proxyToAICore('post', '/api/knowledge-graph', {
      document_id,
      file_path: '',
    }, 60000);

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Concepts
// ──────────────────────────────────────────────

/**
 * GET /api/ai/concepts/:documentId
 * Get extracted concepts for document
 */
router.get('/concepts/:documentId', auth, async (req, res, next) => {
  try {
    const response = await proxyToAICore('get', `/api/concepts/${req.params.documentId}`);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Spaced Repetition (FSRS)
// ──────────────────────────────────────────────

/**
 * POST /api/ai/spaced-repetition/review
 * Schedule next review using FSRS algorithm
 * Body: { card_id, rating (1-4), ...card_state }
 */
router.post('/spaced-repetition/review', auth, async (req, res, next) => {
  try {
    const { card_id, rating } = req.body;

    if (!card_id || !rating) {
      return res.status(400).json({ error: 'card_id and rating are required.', code: 'MISSING_PARAMS' });
    }

    if (rating < 1 || rating > 4) {
      return res.status(400).json({ error: 'rating must be 1-4 (Again/Hard/Good/Easy).', code: 'INVALID_PARAMS' });
    }

    const response = await proxyToAICore('post', '/api/spaced-repetition/review', req.body);
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

// ──────────────────────────────────────────────
// Summary Generation
// ──────────────────────────────────────────────

/**
 * POST /api/ai/summary
 * Generate summary for document
 * Body: { document_id, max_sentences?, summary_type? }
 */
router.post('/summary', auth, checkAICoreAvailable, async (req, res, next) => {
  try {
    const { document_id, max_sentences = 5, summary_type = 'extractive' } = req.body;

    if (!document_id) {
      return res.status(400).json({ error: 'document_id is required.', code: 'MISSING_PARAMS' });
    }

    const response = await proxyToAICore('post', '/api/summary', {
      document_id,
      max_sentences: Math.min(Math.max(max_sentences, 1), 20),
      summary_type,
    }, 60000);

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    next(err);
  }
});

export default router;
