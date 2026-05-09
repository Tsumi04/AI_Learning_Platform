# 🧠 NEUROVAULT — CONTINUATION GUIDE FOR AI ASSISTANTS
> **ĐỌC FILE NÀY ĐẦU TIÊN** khi bắt đầu phiên chat mới.
> Cập nhật lần cuối: 09/05/2026

---

## 📍 DỰ ÁN LÀ GÌ?

**NeuroVault** là hệ sinh thái AI Giáo dục (AI Learning Platform) với:
- **Frontend:** React 18 + Vite + Zustand (port 5173)
- **Backend Gateway:** Node.js/Express (port 5001)
- **AI Core:** Python/FastAPI (port 8000)
- **Database:** MongoDB Atlas
- **LLM:** Google Gemma 4 E4B via Ollama local (port 11434)
- **License:** Apache 2.0 — KHÔNG dùng API bên thứ 3

---

## 📂 CẤU TRÚC DỰ ÁN

```
AI_Learning_Platform/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── App.jsx              # Router + ProtectedRoute
│   │   ├── main.jsx             # Entry point
│   │   ├── index.css            # Design system (~27KB)
│   │   ├── pages/               # Dashboard, Documents, AIStudio, Login...
│   │   ├── components/          # chat/, quiz/, flashcard/, knowledge/, layout/
│   │   ├── services/api.js      # HTTP client + token management
│   │   └── store/useAuthStore.js # Zustand auth state
│   ├── vite.config.js           # Proxy /api → localhost:5001
│   └── package.json             # react, zustand, lucide-react, react-router-dom
│
├── backend/
│   ├── server/                  # Node.js API Gateway
│   │   ├── index.js             # Express server entry
│   │   ├── config/              # db.js, env.js, passport.js
│   │   ├── controllers/         # auth.controller.js, document.controller.js
│   │   ├── routes/              # auth.routes.js, document.routes.js, ai.routes.js
│   │   ├── middleware/          # auth.js, upload.js, rateLimiter.js, errorHandler.js
│   │   ├── models/              # User, Document, KnowledgeNode, LearnerProgress...
│   │   └── .env                 # PORT=5001, MONGODB_URI, JWT secrets, AI_CORE_URL
│   │
│   └── ai_core/                 # Python AI Engine
│       ├── api/ai_server.py     # FastAPI server (port 8000) — MAIN ENTRY
│       ├── preprocessing/       # pdf_parser, text_cleaner, sentence_splitter,
│       │                        # language_detector, semantic_chunker
│       ├── embedding/           # embedding_engine (TF-IDF → dense vectors)
│       ├── retrieval/           # bm25, vector_store, hybrid_ranker, cross_encoder
│       ├── inference/           # llm_engine (Ollama client), rag_pipeline
│       ├── knowledge/           # concept_extractor, graph_builder
│       ├── generation/          # quiz_generator, flashcard_generator, summary_generator
│       ├── adaptive/            # spaced_repetition (FSRS), deep_knowledge_tracer
│       ├── nlp/                 # [EMPTY — cần tạo bpe_tokenizer, vietnamese.py]
│       ├── learning/            # [EMPTY — cần tạo path_optimizer]
│       ├── agents/              # [CHƯA TỒN TẠI — Phase 3]
│       ├── data/doc_stores/     # Persisted document indexes (pickle)
│       └── requirements.txt     # fastapi, uvicorn, PyMuPDF, numpy, scipy, httpx
│
├── NEUROVAULT_CONTINUATION_GUIDE.md  # ← FILE NÀY
└── docker-compose.yml
```

---

## 🔧 CÁCH CHẠY DỰ ÁN

```bash
# Terminal 1: Ollama (LLM)
ollama serve
# ollama pull gemma4:e4b  (nếu chưa có model)

# Terminal 2: AI Core (Python)
cd backend/ai_core
pip install -r requirements.txt
python api/ai_server.py          # → port 8000

# Terminal 3: Backend (Node.js)
cd backend/server
npm install
npm run dev                      # → port 5001

# Terminal 4: Frontend (React)
cd frontend
npm install
npm run dev                      # → port 5173
```

---

## ✅ PROGRESS TRACKER — CẬP NHẬT SAU MỖI PHIÊN

### PHASE 0: Foundation Fix (Target: 45%)
- [x] 0.1 Fix Python imports (rag_pipeline + graph_builder: relative→absolute) — 09/05/2026
- [x] 0.2 Install Ollama + Gemma 4 E4B (config updated, default model = gemma4:e4b) — 09/05/2026
- [x] 0.3 Fix AI Server startup (encoding fix, lifespan, StreamingResponse, health_check v2) — 09/05/2026
- [ ] 0.4 Fix Backend Server (MongoDB, port config)
- [ ] 0.5 Fix Frontend build & runtime
- [ ] 0.6 E2E smoke test (upload→chat→quiz→flashcard)
- [ ] 0.7 Security cleanup (.env.example, rotate secrets)
- [ ] 0.8 Dev scripts (1-command startup)

### PHASE 1: AI Core Enhancement (Target: 60%)
- [ ] 1.1 LLM Engine v2 (Gemma 4 Thinking Mode, streaming, function calling)
- [ ] 1.2 Embedding v2 (Truncated SVD, Vietnamese segmenter)
- [ ] 1.3 BPE Tokenizer (self-built, EN/VI, 8K-16K vocab)
- [ ] 1.4 Vietnamese NLP module (segmenter, stopwords, normalizer)
- [ ] 1.5 RAG Pipeline v2 (cross-encoder rerank, query expansion, memory)
- [ ] 1.6 Knowledge Graph v2 (relation extraction, PageRank, prerequisites)
- [ ] 1.7 Quiz Generator v2 (LLM-powered, Bloom's taxonomy)
- [ ] 1.8 Flashcard Generator v2 (LLM definitions, multimodal)
- [ ] 1.9 Summary Generator v2 (TextRank+MMR, abstractive)
- [ ] 1.10 FSRS v6 (17 weights upgrade)
- [ ] 1.11 DKT v2 (forgetting curves, predictions, velocity)
- [ ] 1.12 Learning Path Optimizer (topological sort, ZPD)

### PHASE 2: Frontend Premium (Target: 72%)
- [ ] 2.1 Design System overhaul (dark/light, Inter font, animations)
- [ ] 2.2 Dashboard v2 (streaks, heatmap, charts)
- [ ] 2.3 Document Viewer v2 (PDF inline, annotate, side chat)
- [ ] 2.4 AI Studio v2 (tabs, streaming chat, history)
- [ ] 2.5 Knowledge Graph visualizer (force-directed, interactive)
- [ ] 2.6 Quiz Interface v2 (timer, explanations, scores)
- [ ] 2.7 Flashcard Interface v2 (3D flip, swipe, FSRS buttons)
- [ ] 2.8 Profile v2 (stats, preferences, export)
- [ ] 2.9 Responsive design (mobile-first, PWA)
- [ ] 2.10 Loading/Error states (skeletons, toasts, boundaries)

### PHASE 3: Agentic AI (Target: 82%)
- [ ] 3.1 Agent Orchestrator framework
- [ ] 3.2 Tutor Agent (Socratic, adaptive)
- [ ] 3.3 Assessment Agent (auto-generate, rubric)
- [ ] 3.4 Feedback Agent (analysis, recommendations)
- [ ] 3.5 Path Planning Agent (dynamic, "what next")
- [ ] 3.6 Safety Agent (moderation, guardrails)
- [ ] 3.7 Agent Memory system (short/long/episodic/working)
- [ ] 3.8 Agent API endpoints + WebSocket

### PHASE 4: Ecosystem (Target: 92%)
- [ ] 4.1 Gamification (XP, levels, badges, challenges)
- [ ] 4.2 Analytics Dashboard (charts, predictions)
- [ ] 4.3 Real-time Collaboration (WebSocket, live quiz)
- [ ] 4.4 Notification system
- [ ] 4.5 Content Library (public sharing, community)
- [ ] 4.6 Voice features (Web Speech API)
- [ ] 4.7 OCR module (scanned PDF, Gemma 4 multimodal)
- [ ] 4.8 Export/Import (PDF, Anki, CSV)
- [ ] 4.9 Multi-language UI (i18n)
- [ ] 4.10 Offline PWA

### PHASE 5: Enterprise (Target: 100%)
- [ ] 5.1 Testing suite (80%+ coverage)
- [ ] 5.2 Performance (Redis, indexes, lazy loading)
- [ ] 5.3 Security hardening
- [ ] 5.4 Multi-tenant (Org/School accounts, RBAC)
- [ ] 5.5 Instructor Portal
- [ ] 5.6 Monitoring & observability
- [ ] 5.7 Docker production deployment
- [ ] 5.8 Documentation (API docs, guides)

---

## 🔴 KNOWN ISSUES (CẬP NHẬT LIÊN TỤC)

1. ~~`rag_pipeline.py` dùng relative imports~~ → ĐÃ FIX (09/05/2026)
2. `.env` chứa MongoDB password + Google OAuth secrets hardcoded
3. `ai_core/rag/`, `nlp/`, `learning/` directories are EMPTY
4. `models/minilm-multilingual/` is EMPTY (no model weights)
5. Frontend `DEV_BYPASS_AUTH = true` (skip login cho dev)
6. FSRS đang dùng v4.5 (13 weights), cần upgrade v6 (17 weights)
7. Ollama cần chạy + pull gemma4:e4b trước khi test LLM features

---

## 📐 KEY ARCHITECTURE DECISIONS

1. **Gemma 4 E4B** via Ollama — local, 6GB RAM, Apache 2.0, multimodal
2. **Tất cả thuật toán AI tự viết** — BM25, VectorStore, FSRS, DKT, TextRank, BPE, SVD, HybridRanker
3. **3-tier architecture** — React → Node.js Gateway → Python AI Core
4. **MongoDB** cho persistence, **pickle** cho AI Core document stores
5. **JWT** auth với access + refresh tokens
6. **Agentic AI** — Multi-agent system (Tutor, Assessment, Feedback, Path, Safety)

---

## 🎯 CHỈ DẪN CHO AI ASSISTANT

Khi user yêu cầu tiếp tục phát triển:
1. **ĐỌC FILE NÀY** để hiểu trạng thái dự án
2. **Kiểm tra Progress Tracker** ở trên → xác định task tiếp theo chưa hoàn thành
3. **ĐỌC CODE THẬT** (không đọc .md files khác) để hiểu implementation hiện tại
4. **Thực hiện task** theo thứ tự Phase → Task number
5. **CẬP NHẬT Progress Tracker** sau khi hoàn thành (đánh [x])
6. **CẬP NHẬT Known Issues** nếu phát hiện vấn đề mới

**QUY TẮC:**
- KHÔNG sử dụng API bên thứ 3 (OpenAI, Anthropic, Google Cloud AI...)
- Gemma 4 chạy LOCAL qua Ollama là OK (Apache 2.0, data không rời server)
- Thuật toán core phải TỰ VIẾT (BM25, FSRS, DKT, TextRank, Embedding...)
- Trả lời TIẾNG VIỆT
- ĐỌC CODEBASE THẬT, không đọc markdown docs
