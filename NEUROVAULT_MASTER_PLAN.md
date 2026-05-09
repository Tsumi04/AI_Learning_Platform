# 🧠 NEUROVAULT — MASTER IMPLEMENTATION PLAN v4.0
> **Ngày:** 07/05/2026 | **Model:** Gemma 4 E4B (Ollama local) | **License:** Apache 2.0

---

## 🤖 LỰA CHỌN MODEL: GEMMA 4

| Tiêu chí | Lựa chọn | Lý do |
|---|---|---|
| **Model chính** | `gemma4:e4b` (4B) | 6GB RAM, 70+ tok/s, multimodal, Apache 2.0 |
| **Model nâng cao** | `gemma4:26b` (MoE) | Reasoning sâu khi cần, 12GB+ VRAM |
| **Runtime** | Ollama local | 100% offline, HTTP API `localhost:11434` |
| **Thinking Mode** | ✅ | Step-by-step reasoning cho tutoring |
| **Function Calling** | ✅ Native | Agentic workflows built-in |
| **Context** | 128K tokens | Tài liệu dài |

---

## 📋 6 PHASES — 56 TASKS

### PHASE 0: FOUNDATION FIX (2-3 ngày → 45%)

| # | Task | Mô tả | Files |
|---|---|---|---|
| 0.1 | Fix Python imports | Chuyển relative→absolute imports trong rag_pipeline.py | `inference/rag_pipeline.py` |
| 0.2 | Install Gemma 4 | `ollama pull gemma4:e4b`, update `.env` LLM_MODEL | `.env` files |
| 0.3 | Fix AI Server startup | Encoding, error handling, verify 18 modules load | `api/ai_server.py` |
| 0.4 | Fix Backend Server | MongoDB connection, port config, health check | `server/index.js`, `.env` |
| 0.5 | Fix Frontend | `npm install`, verify proxy, fix missing components | `frontend/` |
| 0.6 | E2E Smoke Test | Upload PDF → Chat → Quiz → Flashcard all working | All |
| 0.7 | Security cleanup | `.env.example`, `.gitignore`, rotate secrets | Config files |
| 0.8 | Dev scripts | `dev.bat`/`dev.sh` khởi động 3 services 1 lệnh | Root scripts |

### PHASE 1: AI CORE ENHANCEMENT (5-7 ngày → 60%)

| # | Task | Mô tả | Files |
|---|---|---|---|
| 1.1 | LLM Engine v2 | Gemma 4 Thinking Mode, Function Calling, streaming SSE, JSON mode | `inference/llm_engine.py` |
| 1.2 | Embedding v2 | Truncated SVD tự viết thay Random Projection, Vietnamese segmenter | `embedding/embedding_engine.py` |
| 1.3 | BPE Tokenizer | Byte-Pair Encoding tự viết 100%, train EN/VI, 8K-16K vocab | `nlp/bpe_tokenizer.py` NEW |
| 1.4 | Vietnamese NLP | Word segmenter, stopwords, diacritics normalizer | `nlp/vietnamese.py` NEW |
| 1.5 | RAG Pipeline v2 | Cross-encoder rerank, query expansion, context compression, memory | `inference/rag_pipeline.py` |
| 1.6 | Knowledge Graph v2 | Relation extraction, PageRank, prerequisite detection | `knowledge/` rewrite |
| 1.7 | Quiz Generator v2 | LLM-powered, smart distractors, Bloom's taxonomy | `generation/quiz_generator.py` |
| 1.8 | Flashcard Gen v2 | LLM definitions, FSRS metadata, multimodal | `generation/flashcard_generator.py` |
| 1.9 | Summary Gen v2 | TextRank+MMR, abstractive via Gemma 4, multi-granularity | `generation/summary_generator.py` |
| 1.10 | FSRS v6 | 13→17 weights, per-card optimization | `adaptive/spaced_repetition.py` |
| 1.11 | DKT v2 | Forgetting curves, performance prediction, velocity | `adaptive/deep_knowledge_tracer.py` |
| 1.12 | Path Optimizer | Topological sort prerequisites, ZPD targeting | `adaptive/path_optimizer.py` NEW |

### PHASE 2: FRONTEND PREMIUM (5-7 ngày → 72%)

| # | Task | Mô tả |
|---|---|---|
| 2.1 | Design System | Dark/light mode, CSS variables, Inter font, micro-animations |
| 2.2 | Dashboard v2 | Streak tracker, mastery heatmap, study charts, real-time status |
| 2.3 | Document Viewer v2 | PDF inline viewer, annotate, side-by-side AI chat |
| 2.4 | AI Studio v2 | Tab UI (Chat/Quiz/Flash/Graph/Summary), streaming, history |
| 2.5 | Knowledge Graph Viz | Force-directed Canvas, interactive, mastery color-coded |
| 2.6 | Quiz Interface v2 | Timer, progress, explanations, score summary |
| 2.7 | Flashcard Interface v2 | 3D flip, swipe gestures, FSRS buttons |
| 2.8 | Profile v2 | Stats, preferences, data export |
| 2.9 | Responsive | Mobile-first, touch, PWA manifest |
| 2.10 | Loading/Error States | Skeletons, toast notifications, error boundaries |

### PHASE 3: AGENTIC AI (7-10 ngày → 82%)

| # | Task | Mô tả |
|---|---|---|
| 3.1 | Agent Orchestrator | Base class, message passing, state machine |
| 3.2 | Tutor Agent | Socratic questioning, adaptive depth, encouragement |
| 3.3 | Assessment Agent | Auto-generate from DKT weak concepts, rubric evaluation |
| 3.4 | Feedback Agent | Performance analysis, study recommendations, misconceptions |
| 3.5 | Path Planning Agent | Dynamic path adjustment, "what to study next" |
| 3.6 | Safety Agent | Content moderation, prompt injection protection |
| 3.7 | Agent Memory | Short/long-term, episodic, working memory |
| 3.8 | Agent API | Unified `/api/agent/ask`, WebSocket real-time |

### PHASE 4: ECOSYSTEM (7-10 ngày → 92%)

| # | Task | Mô tả |
|---|---|---|
| 4.1 | Gamification | XP, levels (Bronze→Diamond), badges, daily challenges |
| 4.2 | Analytics Dashboard | Mastery charts, study time, predictions, forgetting curves |
| 4.3 | Real-time Collab | WebSocket shared sessions, live quiz, chat rooms |
| 4.4 | Notifications | In-app, review reminders, streak alerts |
| 4.5 | Content Library | Public sharing, community materials, search/filter |
| 4.6 | Voice Features | Web Speech API input, SpeechSynthesis output |
| 4.7 | OCR Module | Scanned PDF, Gemma 4 image→text |
| 4.8 | Export/Import | PDF/Markdown/Anki/CSV export |
| 4.9 | Multi-language UI | i18n Vietnamese/English |
| 4.10 | Offline PWA | Service worker, offline flashcards, sync |

### PHASE 5: ENTERPRISE (7-10 ngày → 100%)

| # | Task | Mô tả |
|---|---|---|
| 5.1 | Testing | pytest + vitest + Playwright, 80%+ coverage |
| 5.2 | Performance | Redis cache, DB indexes, lazy loading |
| 5.3 | Security | Input validation, injection prevention, CSRF |
| 5.4 | Multi-tenant | Org accounts, RBAC (Admin/Teacher/Student) |
| 5.5 | Instructor Portal | Course creation, student monitoring, gradebook |
| 5.6 | Monitoring | Health dashboard, error tracking, metrics |
| 5.7 | Docker Deploy | Production compose, SSL, nginx |
| 5.8 | Documentation | OpenAPI docs, dev guide, user manual |

---

## 📅 TIMELINE: ~6-8 TUẦN

```
Tuần 1:     ████ Phase 0 + Phase 1 bắt đầu
Tuần 2:     ████████ Phase 1 hoàn thành
Tuần 3:     ████████ Phase 2
Tuần 4:     ████████ Phase 3 bắt đầu
Tuần 5:     ████████ Phase 3 + Phase 4
Tuần 6:     ████████ Phase 4
Tuần 7-8:   ████████ Phase 5 → PRODUCTION
```

## 📌 QUY TẮC BẤT BIẾN
1. **KHÔNG gọi API bên thứ 3** — Gemma 4 chạy local qua Ollama
2. **Thuật toán tự viết** — BM25, VectorStore, FSRS, DKT, TextRank, BPE, SVD
3. **Bilingual EN/VI** — Mọi module hỗ trợ cả 2 ngôn ngữ
4. **Data sovereignty** — Dữ liệu không rời server
5. **Apache 2.0 only** — Chỉ dùng open-source licenses
