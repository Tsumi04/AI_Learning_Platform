# NEUROVAULT Architecture & Design Decisions

> Technical decisions, patterns, and rationale behind the NeuroVault platform.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 18 + Vite 5 | Fast HMR, code splitting, modern JSX |
| **State** | Zustand 4 | Minimal boilerplate, no Redux overhead |
| **Routing** | React Router 6 | Standard SPA routing |
| **Styling** | Vanilla CSS + CSS Variables | Full control, no utility class bloat |
| **Icons** | Lucide React | Tree-shakeable, consistent design |
| **PWA** | vite-plugin-pwa + Workbox | Offline-first, installable |
| **Backend** | Express 4 (Node.js 20) | Mature, middleware ecosystem |
| **Database** | MongoDB 7 + Mongoose 8 | Flexible schemas, embedded documents |
| **AI Core** | FastAPI (Python 3.11) | Async, ML library ecosystem |
| **LLM** | Ollama + Qwen3 1.7B | Local-only, privacy-first, no API keys |
| **Auth** | JWT + bcrypt + Passport | Stateless, scalable, OAuth support |
| **Testing** | Vitest + mongodb-memory-server | Fast, isolated, zero-side-effect |
| **Deployment** | Docker + Nginx | Portable, reproducible |

---

## Key Design Decisions

### 1. Local-Only AI (No Cloud APIs)

**Decision:** All AI inference runs locally via Ollama.  
**Rationale:** Privacy-first education platform. Student data never leaves the machine.  
**Tradeoff:** Smaller model (1.7B params) vs. cloud GPT-4 quality.

### 2. Embedded MongoDB Documents

**Decision:** Store chunks, embeddings, and concepts inside Document schema.  
**Rationale:** Single query retrieves everything. No JOINs needed.  
**Tradeoff:** Document size limit (16MB). Large PDFs are chunk-split.

### 3. In-Memory Cache (Not Redis)

**Decision:** Custom TTL cache middleware instead of Redis.  
**Rationale:** Zero infrastructure overhead for single-server deployment.  
**Migration path:** `cacheResponse()` API is Redis-compatible for future swap.

### 4. Monorepo Structure

```
AI_Learning_Platform/
├── frontend/          # React SPA
├── backend/
│   ├── server/        # Express API Gateway
│   └── ai_core/       # Python AI Service
├── docker-compose.yml # Orchestration
└── docs/              # Documentation
```

**Rationale:** Shared types, single git history, coordinated deployments.

### 5. Agentic AI Architecture

**Decision:** Multi-agent system with Orchestrator, Tutor, Assessment, Feedback, Path Planner agents.  
**Pattern:** State machine per agent, shared memory context.  
**Rationale:** Separation of concerns for different pedagogical capabilities.

### 6. JWT with Short-Lived Access Tokens

**Decision:** 15-minute access tokens + 7-day refresh tokens.  
**Rationale:** Minimizes window for stolen token abuse.  
**Implementation:** Automatic refresh on frontend via Axios interceptors.

---

## Data Models

### Core Models (10)

| Model | Purpose | Key Indexes |
|-------|---------|-------------|
| User | Authentication + neural profile | email (unique) |
| Document | Uploaded content + chunks + embeddings | user_id + createdAt |
| StudySession | Learning activity records | user_id + createdAt, user_id + session_type |
| QuizSession | Quiz attempts + answers | user_id + createdAt |
| LearnerProgress | Flashcard mastery + spaced repetition | user_id (unique) |
| KnowledgeNode | Concept graph nodes | user_id + document_id, concept (text) |
| Gamification | XP, levels, badges, challenges | user_id (unique), xp (desc) |
| Notification | User notification queue | user_id + createdAt, user_id + read, TTL 30d |
| SharedContent | Community library items | status + createdAt, title+desc+tags (text) |
| Course | Instructor courses + enrollment | instructor_id + createdAt, enrollments.student_id |
| Annotation | Document highlights + notes | user_id + document_id + createdAt |

---

## Security Layers (7)

```
Request → Rate Limiter → Helmet (CSP/Headers) → CORS
    → Body Parser → Mongo Sanitize → XSS Strip → HPP
    → Auth (JWT) → Role Check → Handler
    → Error Handler → Response
```

1. **Rate Limiting**: express-rate-limit (general, auth, AI-specific)
2. **Helmet CSP**: 11 directives for Content Security Policy
3. **Mongo Sanitize**: Strips `$gt`, `$ne`, `$where` from inputs
4. **XSS Strip**: Recursive HTML/JS stripping from req.body
5. **HPP**: HTTP Parameter Pollution protection
6. **Magic Bytes**: Validates file content matches MIME type
7. **Audit Log**: Tracks auth events with IP + user agent

---

## Performance Optimizations

### Backend
- **Compression**: gzip level 6, threshold 1KB, skip SSE
- **Response Cache**: TTL-based per-user cache (analytics 5min, leaderboard 2min, library 2min)
- **Query Optimization**: Single-pass aggregation (O(n) vs O(8n))
- **AI Rate Limiting**: Separate limit for expensive LLM calls

### Frontend
- **Code Splitting**: React.lazy() for 10 pages → 21 separate chunks
- **Vendor Chunks**: react, router, icons, state separated for caching
- **PWA**: Service worker + Workbox runtime caching
- **Immutable Assets**: 1-year cache for hashed JS/CSS

---

## Testing Strategy

```
Unit Tests (Vitest)
├── Model validation (Gamification, Course, SharedContent, Notification)
├── Middleware (errorHandler, security, roleAuth)
├── Services (export formats, metrics collector)
└── Integration (full request→response with in-memory MongoDB)

Coverage: 127 tests / 8 files / 100% pass rate
```

**Key principle:** Zero-side-effect tests using `mongodb-memory-server` — each test file gets a fresh database.

---

*NeuroVault v2.1 — Architecture Document — 2026-05-23*
