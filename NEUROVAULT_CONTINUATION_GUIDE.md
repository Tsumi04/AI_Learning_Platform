# 🧠 NEUROVAULT — CONTINUATION GUIDE FOR AI ASSISTANTS
> **ĐỌC FILE NÀY ĐẦU TIÊN** khi bắt đầu phiên chat mới.
> Cập nhật lần cuối: 23/05/2026 (Phase 3.5 — Bug Fixes + Streaming Refactor)

---

## 📍 DỰ ÁN LÀ GÌ?

**NeuroVault** là hệ sinh thái AI Giáo dục (AI Learning Platform) với:
- **Frontend:** React 18 + Vite + Zustand (port 5173)
- **Backend Gateway:** Node.js/Express (port 5001)
- **AI Core:** Python/FastAPI (port 8000)
- **Database:** MongoDB Atlas
- **LLM:** Qwen3 1.7B via Ollama local (port 11434)
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
│       ├── nlp/                 # bpe_tokenizer, vietnamese.py
│       ├── learning/            # path_optimizer
│       ├── agents/              # Multi-agent Orchestrator Framework
│       │   ├── __init__.py      # Package exports
│       │   ├── agent_message.py # Message passing (typed, traceable)
│       │   ├── agent_state.py   # State machine (lifecycle management)
│       │   ├── agent_context.py # Shared context (memory layers)
│       │   ├── base_agent.py    # Abstract base agent (Template Method)
│       │   ├── registry.py      # Agent registry (capability-based lookup)
│       │   ├── orchestrator.py  # Supervisor-Worker orchestrator
│       │   └── stream_handler.py # Shared SSE/WebSocket streaming logic
│       ├── data/
│       │   ├── doc_stores/      # Persisted document indexes (pickle)
│       │   ├── bpe_vocab.json   # Trained BPE vocabulary (8K tokens)
│       │   └── safety_patterns.json # Safety patterns database (100+ patterns)
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
# ollama pull qwen3:1.7b  (nếu chưa có model)

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
- [x] 0.2 Install Ollama + Qwen3 1.7B (config updated, default model = qwen3:1.7b) — 09/05/2026
- [x] 0.3 Fix AI Server startup (encoding fix, lifespan, StreamingResponse, health_check v2) — 09/05/2026
- [x] 0.4 Fix Backend Server (EADDRINUSE handling, rate limiter dev mode, axios consistency) — 16/05/2026
- [x] 0.5 Fix Frontend build & runtime (CSS @import order fix, build clean) — 16/05/2026
- [ ] 0.6 E2E smoke test (upload→chat→quiz→flashcard) — cần Ollama chạy
- [x] 0.7 Security cleanup (.env.example, .gitignore đã đúng) — 16/05/2026
- [x] 0.8 Dev scripts (dev.bat + dev.ps1, 1-command startup) — 16/05/2026

### PHASE 1: AI Core Enhancement (Target: 60%)
- [x] 1.1 LLM Engine v3 (circuit breaker, retry+jitter, metrics, connection pool, streaming thinking) — 16/05/2026 ✅
- [x] 1.2 Embedding v2 (Truncated SVD + subword hashing, Vietnamese support) — 16/05/2026 ✅
- [x] 1.3 BPE Tokenizer (self-built, EN/VI, 8K-16K vocab, save/load, special tokens) — 16/05/2026 ✅
- [x] 1.4 Vietnamese NLP module (segmenter 500+ stopwords, compound words, normalizer) — 16/05/2026 ✅
- [x] 1.5 RAG Pipeline v2 (cross-encoder rerank, query expansion, memory) — 16/05/2026 ✅
- [x] 1.6 Knowledge Graph v2 (relation extraction, PageRank, prerequisites) — 16/05/2026 ✅
- [x] 1.7 Quiz Generator v2 (Bloom's taxonomy 6 levels, T/F, explanations) — 16/05/2026 ✅
- [x] 1.8 Flashcard Generator v2 (reverse cards, FSRS metadata, difficulty estimate) — 16/05/2026 ✅
- [x] 1.9 Summary Generator v2 (TextRank+MMR, keyword extraction, abstractive) — 16/05/2026 ✅
- [x] 1.10 FSRS v6 (17 weights, short-term stability, fuzz factor, simulate) — 16/05/2026 ✅
- [x] 1.11 DKT v2 (forgetting curves, learning velocity, session analytics, streaks) — 16/05/2026 ✅
- [x] 1.12 Learning Path Optimizer (topological sort, ZPD, study plans) — 16/05/2026 ✅

### PHASE 2: Frontend Premium (Target: 72%)
- [x] 2.1 Design System overhaul (dark/light, Inter font, animations) — 19/05/2026 ✅
- [x] 2.2 Dashboard v2 (StreakCard, ActivityHeatmap, WeeklyChart, MasteryDonut, StatsGrid, RecentActivity) — 21/05/2026 ✅
- [x] 2.3 Document Viewer v2 (PDF inline, annotate, side chat) — 21/05/2026 ✅
- [x] 2.4 AI Studio v2 (tabs, streaming chat, history) — 21/05/2026 ✅
- [x] 2.5 Knowledge Graph v2 (Barnes-Hut force-directed, mastery colors, minimap, particles, search, full-page route) — 21/05/2026 ✅
- [x] 2.6 Quiz Interface v2 (timer, Bloom's badges, T/F support, explanations, score board, difficulty selector, activity recording) — 21/05/2026 ✅
- [x] 2.7 Flashcard Interface v2 (3D flip CSS perspective, touch/mouse swipe gestures, FSRS v6 rating buttons with interval preview, card stack deck visual, keyboard shortcuts Space/1-4, session stats, activity recording) — 21/05/2026 ✅
- [x] 2.8 Profile v2 (ProfileHeader gradient ring + level badge, LearningStatsGrid 6 cards, MasteryOverviewCard stacked bar + top concepts, ActivityBreakdownCard horizontal bars, MilestonesCard achieved/locked, PreferencesCard theme/language/notifications, AccountSettingsCard form, DataExportCard JSON download, responsive CSS, empty state fallback, backend /api/learning/profile-stats + /api/learning/export-data endpoints) — 21/05/2026 ✅
- [x] 2.9 Responsive design (Layout class-based refactor, mobile sidebar overlay + hamburger menu, MobileBottomNav auto-hide scroll, vite-plugin-pwa + Workbox precache 17 entries + runtime caching Google Fonts + API NetworkFirst, manifest + icon-512, service worker auto-update, 100dvh iOS safe area, touch-friendly 44px tap targets, responsive breakpoints 1024/768/480) — 21/05/2026 ✅
- [x] 2.10 Loading/Error states (Skeleton components: basic rect/text/circle + specialized card/documentList/statsGrid/chat/quiz/page, ToastProvider global context with useToast hook success/error/warning/info + auto-dismiss progress bar + stacking + mobile responsive, ErrorBoundary class component full-page + minimal inline mode + retry + developer details toggle, barrel export components/ui, per-route minimal error boundaries) — 21/05/2026 ✅

### PHASE 3: Agentic AI (Target: 82%)
- [x] 3.1 Agent Orchestrator framework (BaseAgent abstract + AgentState state machine + AgentMessage typed messaging + AgentContext shared memory + AgentRegistry capability-based lookup + AgentOrchestrator supervisor-worker with intent classification rule-based+LLM, safety guardrails, handoff protocol, conversation management, bilingual EN/VI, 26+ tests passing) — 21/05/2026 ✅
- [x] 3.2 Tutor Agent (Socratic, adaptive) — 21/05/2026 ✅
- [x] 3.3 Assessment Agent (auto-generate, rubric, refactored with phases & strict tools) — 21/05/2026 ✅
- [x] 3.4 Feedback Agent (analysis, recommendations) — 21/05/2026 ✅
- [x] 3.5 Path Planning Agent (dynamic, "what next") — 21/05/2026 ✅
- [x] 3.6 Safety Agent (moderation, guardrails) — 21/05/2026 ✅
- [x] 3.7 Agent Memory system (short/long/episodic/working) — 21/05/2026 ✅
- [x] 3.8 Agent API endpoints + WebSocket (Unified /api/agent/ask + /api/agent/ws) — 21/05/2026 ✅

### PHASE 3.5: Bug Fixes (added 23/05/2026)
- [x] Fix-1 Refactor agent streaming — extracted stream_handler.py, eliminated ~300 dòng SSE+WS duplicate code — 23/05/2026 ✅
- [x] Fix-2 Train BPE tokenizer — trained EN/VI corpus, saved bpe_vocab.json (902 tokens, 0 UNKs) — 23/05/2026 ✅
- [x] Fix-3 Agent Memory deep integration — Orchestrator learns facts, tracks concepts/frustration/scaffolding in long-term memory — 23/05/2026 ✅
- [x] Fix-4 Expand Safety Agent — rewritten with 100+ compiled regex patterns, 6 categories, self-harm support, PII warnings — 23/05/2026 ✅
- [x] Fix-5 Update documentation — corrected LLM model reference, added new files to structure — 23/05/2026 ✅

### PHASE 4: Ecosystem (Target: 92%)
- [x] 4.1 Gamification (XP sqrt leveling, 5-tier system Bronze→Diamond, 15 badges w/ conditions, daily challenges, leaderboard, XP toast popups, Gamification.model.js + gamification.routes.js, XPBar + DailyChallenge + BadgeGrid + XPToast components, auto-XP hook in record-activity, Zustand store) — 23/05/2026 ✅
- [x] 4.2 Analytics Dashboard (10-dimension data: study trends, quiz performance, session/time distribution, concept mastery strong/weak, flashcard analysis, study patterns peak hour/day, predictions, gamification summary; 6 chart components, range selector 7-90d, sidebar nav) — 23/05/2026 ✅
- [x] 4.3 Real-time Collaboration (ws package, WebSocket server /ws/collab, room-based architecture, user presence tracking, Live Quiz system with speed-bonus scoring + leaderboard, useCollaboration hook, LiveQuizPanel + PresenceBar components, collab REST stats endpoint, Vite WS proxy) — 23/05/2026 ✅
- [x] 4.4 Notification system (Notification.model.js with TTL 30d, NotificationService EventEmitter bus + 7 templates, REST CRUD + SSE real-time stream with query-param JWT, NotificationDropdown replacing static bell, useNotificationStore with SSE auto-connect, hooked into gamification level-up/challenge/quiz events) — 23/05/2026 ✅
- [x] 4.5 Content Library (SharedContent.model.js with ratings/likes/views/tags/subjects, library.routes.js with browse/publish/like/rate/detail/unpublish/my-published, text search index, subject filtering, sort by recent/popular/rating, LibraryPage with card grid + pagination + search + filters, sidebar nav) — 23/05/2026 ✅
- [x] 4.6 Voice features (useSpeechRecognition STT hook with vi/en, continuous mode, interim results; useSpeechSynthesis TTS hook with voice selection, rate/pitch/volume, pause/resume, word boundary; VoiceControls components — VoiceInputButton with pulse animation, TTSButton, VoiceLanguageSelector; integrated into StreamingChatBox — mic input + read-aloud on AI messages; CSS voice-pulse + blink-cursor keyframes) — 23/05/2026 ✅
- [x] 4.7 OCR module (Tesseract.js with eng+vie worker pool, ocr.service.js with extractTextFromImage/extractTextFromImages/confidence scoring/language detection, ocr.routes.js with /extract and /upload-as-document endpoints, upload middleware extended for images, OCRPage with drag-drop/preview/extract-or-document mode/confidence badge/monospace output/copy, sidebar nav) — 23/05/2026 ✅
- [x] 4.8 Export/Import (export.service.js with 6 formats: Anki TSV, flashcards CSV, concepts CSV, sessions CSV, document Markdown, full JSON backup; export.routes.js with download endpoints + import flashcards with dedup + stats; exportAPI with blob download helper; ExportPage with stats bar + 5 export cards + CSV/TSV import with parser, sidebar nav) — 23/05/2026 ✅
- [x] 4.9 Multi-language UI (useI18nStore with Zustand persist + nested key resolution + {{param}} interpolation; en.js + vi.js translation files covering all pages — sidebar/header/dashboard/documents/AI studio/chat/analytics/library/OCR/export/gamification/common; LanguageSwitcher component in Header; Sidebar menu items translated via i18n keys; localStorage persistence + auto-restore) — 23/05/2026 ✅
- [x] 4.10 Offline PWA (useOfflineStore with online/offline detection + SW update notification + PWA install prompt + offline action queue + IndexedDB document cache; PWAComponents — OfflineBanner/UpdateToast/InstallButton/PWAProvider; enhanced vite.config.js with multi-size icons, shortcuts, navigateFallback, uploads cache, API GET-only caching; integrated PWAProvider in App root) — 23/05/2026 ✅

### PHASE 5: Enterprise (Target: 100%)
- [~] 5.1 Testing suite — Backend: vitest + mongodb-memory-server + supertest; 5 test files (gamification 20 tests, notification 14 tests, library 9 tests, errorHandler 13 tests, export 14 tests) = 70 tests ALL PASS; Frontend tests pending — 23/05/2026 🔧
- [x] 5.2 Performance — Backend: gzip compression middleware (skip SSE), AI rate limiter per-route, in-memory response cache (analytics 5min, leaderboard 2min, library 2min, export stats 3min with per-user isolation + auto-cleanup), analytics single-pass aggregation O(n→1). Frontend: React.lazy() 10 pages code-split (21 chunks vs 1), Vite manualChunks (vendor-react/router/icons/state), Suspense PageLoader. Build: 966KB → same total but split 21 chunks — 23/05/2026 ✅
- [x] 5.3 Security Hardening — Helmet CSP (11 directives: script/style/font/img/connect/frame/form/base), mongo-sanitize injection protection ($gt/$ne/$where), recursive XSS stripping (script tags, event handlers, javascript: URLs, data:text/html, vbscript, expression()), HPP query pollution, file magic bytes validation (JPEG/PNG/WebP/BMP/TIFF/PDF header check), audit logging on auth routes (register/login/password/logout), 21 security tests ALL PASS — 23/05/2026 ✅
- [ ] 5.4 Multi-tenant (Org/School accounts, RBAC)
- [x] 5.5 Instructor Portal — User role 'instructor' added, Course.model.js (modules with document linking + completion requirements, enrollments with progress/grades, course settings with capacity/approval, aggregated stats, text search index), roleAuth middleware (requireRole factory + requireInstructor + requireAdmin), instructor.routes.js 12 endpoints (Course CRUD, Module CRUD, enrollment with capacity check, gradebook with letter grades, instructor dashboard stats, self-promote, public course browse), 24 tests ALL PASS — 23/05/2026 ✅
- [x] 5.6 Monitoring & Observability — metrics.service.js (CircularBuffer for memory-safe storage, request throughput RPM, latency percentiles p50/p95/p99, per-route stats with error rates, memory usage, time-series chart data), metricsMiddleware (auto-track all requests), monitor.routes.js 6 endpoints (/metrics, /timeseries, /audit, /cache, /database collection stats, /overview consolidated), role-gated (instructor/admin), 12 tests ALL PASS — 23/05/2026 ✅
- [x] 5.7 Docker Production Deployment — Multi-stage Dockerfiles (API: deps→runtime, non-root neurovault user, health check, test file removal; Frontend: build→nginx:1.27-alpine, server_tokens off), .dockerignore for both services, production nginx.conf (upstream keepalive, security headers X-Frame/XSS/Content-Type/Referrer/Permissions-Policy, SSE proxy without buffering, WebSocket support, immutable asset caching, service worker no-cache, gzip 11 types, dotfile blocking), docker-compose.yml (dedicated bridge network, named volumes, JSON log rotation 10MB×3, resource limits 128M-1G, env var ports, health check start_period), .env.production template — 23/05/2026 ✅
- [x] 5.8 Documentation — docs/API_REFERENCE.md (80+ endpoints: 14 route groups, request/response examples, auth/rate-limit/cache annotations, error codes), docs/DEPLOYMENT_GUIDE.md (local dev setup, Docker deployment, env vars table, architecture diagram, monitoring, backup/restore, troubleshooting), docs/ARCHITECTURE.md (technology stack rationale, 7 key design decisions with tradeoffs, 11 data models, 7 security layers, performance optimizations, testing strategy) — 23/05/2026 ✅

---

## 🔴 KNOWN ISSUES (CẬP NHẬT LIÊN TỤC)

1. ~~`rag_pipeline.py` dùng relative imports~~ → ĐÃ FIX (09/05/2026)
2. `.env` chứa MongoDB password + Google OAuth secrets hardcoded
3. `ai_core/rag/`, `nlp/`, `learning/` directories are EMPTY
4. `models/minilm-multilingual/` is EMPTY (no model weights)
5. ~~Frontend `DEV_BYPASS_AUTH = true`~~ → ĐÃ SET false (16/05/2026)
6. ~~FSRS đang dùng v4.5 (13 weights)~~ → ĐÃ UPGRADE v6 (16/05/2026)
7. Ollama cần chạy + pull gemma4:e4b trước khi test LLM features
8. `document.controller.js` — đã chuyển sang axios, nhất quán với ai.routes.js
9. Rate limiter đã phân biệt dev/prod (dev: 10x limit)
10. Login/Register page hiển thị ThemeToggle ở góc trên phải (19/05/2026)
11. Dashboard v2: khi viewport < 1200px, row Streak+Weekly+Mastery stack 2 cột thay vì 3 (responsive design — intentional) (21/05/2026)
12. Annotation trên PDF chưa hỗ trợ (chỉ text documents TXT/MD/extracted text) — cần PDF.js cho PDF annotation layer (21/05/2026)
13. Side chat panel chỉ hiện khi đang ở tab Document (intentional UX) (21/05/2026)
14. AI Studio v2: StreamingChatBox dùng fetch SSE, fallback JSON khi backend không hỗ trợ streaming (21/05/2026)
15. AI Studio v2: Chat history lưu sessionStorage (mất khi đóng browser) — cần chuyển sang MongoDB nếu muốn persist (21/05/2026)
16. AI Studio v2: SummaryView gọi `/api/ai/summary` — cần AI Core chạy để hoạt động (21/05/2026)
17. Knowledge Graph v2: Barnes-Hut quadtree giả định nodes nằm trong viewport bounds — nếu node bị kéo ra ngoài biên thì cần reheat (21/05/2026)
18. Knowledge Graph v2: Mastery data chỉ hiện khi AI Core trả về field `mastery` trong graph nodes — hiện tại dùng fallback color palette (21/05/2026)
19. Quiz v2: Timer countdown chỉ chạy khi user bật toggle "Timer per question" — mặc định tắt (21/05/2026)
20. Quiz v2: AI Core cần hỗ trợ `question_types` param và trả `explanation`, `bloom_level` fields — nếu thiếu thì component dùng fallback (21/05/2026)
21. Quiz v2: Fill-in-blank so sánh case-insensitive, nhưng chưa hỗ trợ fuzzy matching (21/05/2026)
22. Flashcard v2: FSRS interval preview hiện static text ("~3 ngày") — cần tích hợp FSRS API response để hiện interval thực tế (21/05/2026)
23. Flashcard v2: Swipe gesture chỉ trigger flip, chưa map sang rating trực tiếp (intentional UX — user nên chọn rating chính xác) (21/05/2026)
24. Flashcard v2: card.explanation field phụ thuộc AI Core trả về — nếu không có thì ẩn (21/05/2026)
25. Profile v2: Join date hiện "N/A" khi backend không trả joinDate (cần MongoDB kết nối) (21/05/2026)
26. Profile v2: Theme preference lưu localStorage — nếu user chuyển browser thì mất setting (21/05/2026)
27. Profile v2: Export Data cần backend chạy + MongoDB kết nối — nếu không sẽ báo lỗi (21/05/2026)
28. PWA: vite-plugin-pwa devOptions.enabled = false (tắt trong dev mode) — bật khi cần test offline capability (21/05/2026)
29. PWA: Service worker chỉ generate khi build production — dev mode không có SW (21/05/2026)
30. Toast: Mobile toast hiển thị phía dưới (trên bottom nav) — desktop hiển thị top-right (21/05/2026)
31. Layout: Sidebar overlay trên mobile dùng backdrop-filter blur — có thể lag trên thiết bị yếu (21/05/2026)
32. PHASE 2 HOÀN THÀNH 100% — sẵn sàng chuyển sang Phase 3: Agentic AI (21/05/2026)
33. Agent Orchestrator Framework: 7 files (agent_message, agent_state, agent_context, base_agent, registry, orchestrator, __init__) — tất cả tests pass (21/05/2026)
34. BaseAgent sử dụng Template Method pattern: subclass chỉ cần implement process(), get_system_prompt(), get_tools() (21/05/2026)
35. Intent classification 2 tầng: rule-based keyword matching (EN+VI) → LLM fallback khi ambiguous (21/05/2026)
36. Assessment Agent: Đã refactor lại với AssessmentPhase, fallback khi LLM offline, cập nhật rubric nghiêm ngặt bắt buộc gọi update_mastery, và thêm file tests `test_assessment_agent.py` đạt 100% pass (21/05/2026)
37. Feedback Agent: Đã kiểm tra kỹ và làm lại (Task 3.4). Bổ sung error handling, offline fallback, xử lý empty query, ghi log vào context memory. Viết file test `test_feedback_agent.py` đạt 100% pass (21/05/2026)
38. Safety Agent: Đã implement kiểm duyệt nội dung (Task 3.6) theo 2 tầng (rule-based và LLM fallback), tích hợp vào Agent Orchestrator, kiểm tra với unit test đạt kết quả chuẩn (21/05/2026)
39. Path Planning Agent: Đã kiểm tra kỹ và làm lại (Task 3.5). Bổ sung error handling, xử lý empty query, offline fallback, đổi thinking_mode sang True. Viết file test `test_path_planning_agent.py` đạt 100% pass (21/05/2026)
40. Agent Memory: Đã implement `MemoryManager` với 4 tầng (Working, ShortTerm, Episodic, LongTerm) lưu trữ qua local JSON (100% offline). Viết file test `test_agent_memory.py` đạt 100% pass (21/05/2026)
41. Agent API: Đã chuyển đổi endpoint `/api/agent/tutor` thành unified `/api/agent/ask` (hỗ trợ JSON & SSE) trong Node.js và AI Core, cho phép tự động định tuyến bởi orchestrator. Đã bổ sung endpoint WebSocket `@app.websocket("/api/agent/ws")` hỗ trợ real-time chat với agentic platform (21/05/2026)
42. ~~BUG: Library route `/:id` catch `/my/published`~~ → ĐÃ FIX — di chuyển `/my/published` lên trước `/:id` (23/05/2026)
43. ~~BUG: OCR Tesseract workers không terminate khi shutdown~~ → ĐÃ FIX — thêm `terminateOCR()` vào graceful shutdown (23/05/2026)
44. ~~BUG: Offline queue lưu functions vào localStorage (mất sau reload)~~ → ĐÃ FIX — chuyển sang serializable descriptors (23/05/2026)
45. ~~BUG: SSE notification reconnect loop vô hạn khi token expired~~ → ĐÃ FIX — thêm guard kiểm tra token + online (23/05/2026)
46. ~~BUG: Export stats dùng dynamic import() mỗi request~~ → ĐÃ FIX — chuyển sang static import (23/05/2026)
47. ~~BUG: App.jsx nesting order PWAProvider/ToastProvider~~ → ĐÃ FIX (23/05/2026)
48. ~~BUG: OCR extract endpoint không cleanup file~~ → ĐÃ FIX — thêm `fs.unlinkSync` sau response + on error (23/05/2026)

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
