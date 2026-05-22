# NEUROVAULT API Reference v2.1

> **Base URL:** `http://localhost:5000/api`  
> **Authentication:** Bearer Token (JWT) in `Authorization` header  
> **Content-Type:** `application/json` unless specified  

---

## Table of Contents

1. [Authentication](#authentication)
2. [Documents](#documents)
3. [AI Studio](#ai-studio)
4. [Learning & Progress](#learning--progress)
5. [Gamification](#gamification)
6. [Notifications](#notifications)
7. [Library (Community)](#library-community)
8. [Annotations](#annotations)
9. [Analytics](#analytics)
10. [Export](#export)
11. [OCR](#ocr)
12. [Instructor Portal](#instructor-portal)
13. [Monitoring](#monitoring)
14. [Error Codes](#error-codes)

---

## Authentication

All endpoints except auth require `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| `POST` | `/auth/register` | ❌ | 20/15min | Register new account |
| `POST` | `/auth/login` | ❌ | 20/15min | Login with email/password |
| `POST` | `/auth/refresh` | ❌ | — | Refresh access token |
| `GET` | `/auth/me` | ✅ | — | Get current user profile |
| `PUT` | `/auth/profile` | ✅ | — | Update profile (name, avatar) |
| `PUT` | `/auth/password` | ✅ | — | Change password |
| `POST` | `/auth/logout` | ✅ | — | Logout (clear refresh token) |
| `GET` | `/auth/google` | ❌ | — | Initiate Google OAuth flow |
| `GET` | `/auth/google/callback` | ❌ | — | Google OAuth callback |

### POST /auth/register
```json
// Request
{ "email": "user@example.com", "password": "securePass123", "name": "John Doe" }
// Response 201
{ "user": { "_id", "email", "name", "role" }, "accessToken": "...", "refreshToken": "..." }
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "securePass123" }
// Response 200
{ "user": { ... }, "accessToken": "...", "refreshToken": "..." }
```

---

## Documents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/documents/upload` | ✅ | Upload document (multipart/form-data, field: `file`) |
| `GET` | `/documents` | ✅ | List user's documents |
| `GET` | `/documents/:id` | ✅ | Get document detail |
| `GET` | `/documents/:id/status` | ✅ | Get processing status |
| `GET` | `/documents/:id/file` | ✅ | Serve original file (inline) |
| `DELETE` | `/documents/:id` | ✅ | Delete document |

**Supported file types:** PDF, TXT, MD, DOCX, JPG, PNG, TIFF, BMP, WebP  
**Max file size:** 50MB (configurable via `MAX_FILE_SIZE`)

---

## AI Studio

| Method | Endpoint | Auth | Rate Limit | Description |
|--------|----------|------|------------|-------------|
| `GET` | `/ai/health` | ❌ | — | AI Core + Ollama health check |
| `GET` | `/ai/stats` | ❌ | — | AI system statistics |
| `POST` | `/ai/chat` | ✅ | 30/min | Chat with AI about a document |
| `POST` | `/ai/quiz` | ✅ | 30/min | Generate quiz from document |
| `POST` | `/ai/flashcards` | ✅ | 30/min | Generate flashcards |
| `POST` | `/ai/knowledge-graph` | ✅ | 30/min | Build knowledge graph |
| `GET` | `/ai/concepts/:documentId` | ✅ | — | Get document concepts |
| `POST` | `/ai/spaced-repetition/review` | ✅ | — | Submit flashcard review |
| `POST` | `/ai/summary` | ✅ | 30/min | Generate document summary |
| `POST` | `/ai/agent/ask` | ✅ | 30/min | Ask agentic AI (tutor/assessment/feedback) |
| `POST` | `/ai/agent/ask/stream` | ✅ | 30/min | Streaming agent response (SSE) |
| `GET` | `/ai/agent/status` | ❌ | — | Agent orchestrator status |

### POST /ai/chat
```json
// Request
{ "documentId": "...", "message": "Explain chapter 3", "history": [] }
// Response 200
{ "response": "...", "sources": [...], "model": "qwen3:1.7b" }
```

### POST /ai/quiz
```json
// Request
{ "documentId": "...", "count": 5, "difficulty": "medium" }
// Response 200
{ "questions": [{ "question_text", "question_type", "correct_answer", "distractors" }] }
```

---

## Learning & Progress

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/learning/dashboard-stats` | ✅ | Dashboard overview (study time, quizzes, streaks) |
| `POST` | `/learning/record-activity` | ✅ | Record study session activity |
| `GET` | `/learning/profile-stats` | ✅ | Detailed profile statistics |
| `GET` | `/learning/export-data` | ✅ | Export learning data as JSON |

### POST /learning/record-activity
```json
// Request
{
  "document_id": "...",
  "session_type": "quiz|flashcard|chat|reading",
  "duration_seconds": 300,
  "quiz_results": { "total_questions": 5, "correct_answers": 4, "score_percentage": 80 },
  "concepts_covered": ["React", "Hooks"]
}
```

---

## Gamification

| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/gamification/profile` | ✅ | — | Get XP, level, tier, badges |
| `POST` | `/gamification/award-xp` | ✅ | — | Award XP (internal) |
| `GET` | `/gamification/badges` | ✅ | — | List all available/earned badges |
| `GET` | `/gamification/leaderboard` | ✅ | 2min | Top 10 users by XP |

### XP Formula
```
level = floor(sqrt(xp / 100))
Tiers: Bronze(1-5) → Silver(6-10) → Gold(11-15) → Platinum(16-20) → Diamond(21+)
```

---

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/notifications` | ✅ | List notifications (paginated) |
| `GET` | `/notifications/unread-count` | ✅ | Get unread notification count |
| `PUT` | `/notifications/:id/read` | ✅ | Mark single notification as read |
| `PUT` | `/notifications/read-all` | ✅ | Mark all as read |
| `DELETE` | `/notifications/:id` | ✅ | Delete notification |
| `GET` | `/notifications/stream` | ✅* | SSE real-time stream |

> \*SSE stream uses query param `?token=<jwt>` for auth

---

## Library (Community)

| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/library` | ✅ | 2min (shared) | Browse published content |
| `POST` | `/library/publish` | ✅ | — | Publish document to library |
| `POST` | `/library/:id/like` | ✅ | — | Toggle like |
| `POST` | `/library/:id/rate` | ✅ | — | Rate content (1-5) |
| `GET` | `/library/my/published` | ✅ | — | List user's published content |
| `GET` | `/library/:id` | ✅ | — | Get shared content detail |
| `DELETE` | `/library/:id` | ✅ | — | Unpublish content |

### GET /library?page=1&limit=12&subject=cs&search=react&sort=popular&tag=javascript

---

## Annotations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/annotations/:documentId` | ✅ | Get annotations for document |
| `POST` | `/annotations` | ✅ | Create annotation |
| `PUT` | `/annotations/:id` | ✅ | Update annotation |
| `DELETE` | `/annotations/:id` | ✅ | Delete annotation |

---

## Analytics

| Method | Endpoint | Auth | Cache | Description |
|--------|----------|------|-------|-------------|
| `GET` | `/analytics/overview` | ✅ | 5min | Full analytics dashboard |
| `GET` | `/analytics/concepts` | ✅ | — | Concept mastery breakdown |

### GET /analytics/overview?range=30
Returns: study time trends, quiz performance, concept mastery, session distribution, predictions.

---

## Export

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/export/flashcards/:format` | ✅ | Export flashcards (anki/csv) |
| `GET` | `/export/concepts/csv` | ✅ | Export concepts as CSV |
| `GET` | `/export/sessions/csv` | ✅ | Export study sessions as CSV |
| `GET` | `/export/document/:id/markdown` | ✅ | Export document as Markdown |
| `GET` | `/export/backup` | ✅ | Full data backup (JSON) |
| `POST` | `/export/import/flashcards` | ✅ | Import flashcards from CSV |
| `GET` | `/export/stats` | ✅ | Export count summary |

---

## OCR

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/ocr/extract` | ✅ | OCR image → text (multipart, field: `file`) |
| `POST` | `/ocr/upload-as-document` | ✅ | OCR image → create document |

**Magic bytes validation:** File content verified against MIME type.

---

## Instructor Portal

### Course Management (requires `instructor` or `admin` role)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/instructor/courses` | ✅ | instructor | List instructor's courses |
| `POST` | `/instructor/courses` | ✅ | instructor | Create course |
| `GET` | `/instructor/courses/:id` | ✅ | instructor | Get course detail |
| `PUT` | `/instructor/courses/:id` | ✅ | instructor | Update course |
| `DELETE` | `/instructor/courses/:id` | ✅ | instructor | Delete course (no active students) |

### Module Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `POST` | `/instructor/courses/:id/modules` | ✅ | instructor | Add module |
| `PUT` | `/instructor/courses/:id/modules/:mid` | ✅ | instructor | Update module |
| `DELETE` | `/instructor/courses/:id/modules/:mid` | ✅ | instructor | Delete module |

### Enrollment & Gradebook

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/instructor/courses/:id/students` | ✅ | instructor | List enrolled students |
| `POST` | `/instructor/courses/:id/enroll` | ✅ | any | Student self-enroll |
| `GET` | `/instructor/courses/:id/gradebook` | ✅ | instructor | Full gradebook |
| `GET` | `/instructor/stats` | ✅ | instructor | Dashboard overview |
| `POST` | `/instructor/promote` | ✅ | any | Self-promote to instructor |
| `GET` | `/instructor/browse` | ✅ | any | Browse published courses |

---

## Monitoring

All monitoring endpoints require `instructor` or `admin` role.

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/monitor/metrics` | ✅ | instructor+ | System metrics snapshot |
| `GET` | `/monitor/timeseries` | ✅ | instructor+ | Chart data (RPM, latency) |
| `GET` | `/monitor/audit` | ✅ | instructor+ | Security audit log |
| `GET` | `/monitor/cache` | ✅ | instructor+ | Response cache stats |
| `GET` | `/monitor/database` | ✅ | instructor+ | MongoDB collection stats |
| `GET` | `/monitor/overview` | ✅ | instructor+ | Consolidated dashboard |

### GET /monitor/metrics — Response
```json
{
  "system": { "uptime": 3600, "uptimeHuman": "1h 0m 0s", "nodeVersion": "v20.x" },
  "throughput": { "rpm": 45, "totalRequests": 12000, "activeConnections": 3 },
  "latency": { "p50": 12, "p95": 85, "p99": 230, "avg": 28 },
  "errors": { "rate": 0.5, "total": 60, "breakdown": { "2xx": 11500, "4xx": 440, "5xx": 60 } },
  "memory": { "heapUsed": "45.2 MB", "heapPercent": 35 },
  "routes": [{ "path": "GET /api/documents", "count": 500, "avgMs": 15 }]
}
```

---

## Health Check

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | System health (DB, AI Core, Ollama) |

### Response
```json
{
  "status": "healthy|degraded",
  "service": "NEUROVAULT API Gateway v2.1",
  "uptime": 3600,
  "components": {
    "database": { "status": "connected" },
    "ai_core": { "status": "online" },
    "ollama": { "status": "online", "model_target": "qwen3:1.7b" }
  }
}
```

---

## Error Codes

| HTTP Code | Meaning | When |
|-----------|---------|------|
| `400` | Bad Request | Missing/invalid fields |
| `401` | Unauthorized | Missing/expired JWT |
| `403` | Forbidden | Insufficient role permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate (already enrolled, already published) |
| `413` | Payload Too Large | File exceeds size limit |
| `415` | Unsupported Media | File type not allowed / magic bytes mismatch |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Server Error | Unexpected backend error |

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { }
}
```

---

## Rate Limits

| Scope | Development | Production |
|-------|-------------|------------|
| General API | 1000/15min | 100/15min |
| Auth endpoints | 200/15min | 20/15min |
| AI inference | 300/min | 30/min |

---

## Security

- **JWT**: Access tokens expire in 15m, refresh tokens in 7d
- **Password**: bcrypt with salt rounds 12
- **Input**: MongoDB injection sanitization + XSS stripping
- **Upload**: MIME type filter + magic bytes validation
- **Headers**: Helmet CSP, X-Frame-Options DENY, noSniff
- **Compression**: gzip level 6, skip SSE streams
- **Audit**: Login/register/password/logout events logged

---

*Generated: 2026-05-23 | NeuroVault v2.1 | Total endpoints: 80+*
