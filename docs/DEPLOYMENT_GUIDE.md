# NEUROVAULT Deployment Guide

> Complete guide for deploying NeuroVault in development and production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Environment Variables](#environment-variables)
5. [Architecture Overview](#architecture-overview)
6. [Monitoring](#monitoring)
7. [Backup & Restore](#backup--restore)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥ 20.x | API Gateway + Frontend build |
| Python | ≥ 3.11 | AI Core (FastAPI) |
| MongoDB | ≥ 7.x | Primary database |
| Ollama | Latest | Local LLM inference |

### Optional (Production)
| Software | Version | Purpose |
|----------|---------|---------|
| Docker | ≥ 24.x | Container deployment |
| Docker Compose | ≥ 2.x | Multi-service orchestration |

---

## Local Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd AI_Learning_Platform

# Backend API
cd backend/server
npm install

# Frontend
cd ../../frontend
npm install

# AI Core
cd ../backend/ai_core
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# backend/server/.env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/neurovault
JWT_SECRET=dev-secret-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-min-32-chars
AI_CORE_URL=http://127.0.0.1:8000
OLLAMA_URL=http://127.0.0.1:11434
LLM_MODEL=qwen3:1.7b
CLIENT_URL=http://localhost:5173
```

### 3. Start Services

**Option A: Using dev.bat (Windows)**
```bash
dev.bat
```

**Option B: Manual start**
```bash
# Terminal 1: MongoDB (if not running as service)
mongod --dbpath ./data/db

# Terminal 2: Ollama
ollama serve
ollama pull qwen3:1.7b

# Terminal 3: AI Core
cd backend/ai_core
python api/ai_server.py

# Terminal 4: API Gateway
cd backend/server
npm run dev

# Terminal 5: Frontend
cd frontend
npm run dev
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:5001 |
| AI Core | http://localhost:8000 |
| Health Check | http://localhost:5001/api/health |

---

## Docker Deployment

### Quick Start

```bash
# 1. Copy and edit environment file
cp .env.production .env

# 2. IMPORTANT: Change JWT secrets!
# Edit .env and set strong random secrets

# 3. Build and start
docker compose up -d --build

# 4. Check status
docker compose ps
docker compose logs -f api-gateway
```

### Services

| Container | Port | Resource Limit |
|-----------|------|---------------|
| neurovault-mongo | 27017 | 512 MB |
| neurovault-api | 5000 | 512 MB |
| neurovault-ai | 8000 | 1 GB |
| neurovault-frontend | 3000 | 128 MB |

### Common Operations

```bash
# View logs
docker compose logs -f api-gateway
docker compose logs -f --tail=100 ai-core

# Restart single service
docker compose restart api-gateway

# Rebuild after code changes
docker compose up -d --build api-gateway frontend

# Stop all
docker compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker compose down -v
```

### Ollama Setup (Host Machine)

Ollama runs on the **host machine** (not in Docker) for GPU access:

```bash
# Install Ollama
# https://ollama.com/download

# Pull required model
ollama pull qwen3:1.7b

# Verify
ollama list
```

Docker containers access Ollama via `host.docker.internal:11434`.

---

## Environment Variables

### API Gateway (backend/server)

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | 5001 | ❌ | API server port |
| `NODE_ENV` | development | ❌ | Environment mode |
| `MONGODB_URI` | mongodb://127.0.0.1:27017/neurovault | ✅ | MongoDB connection |
| `JWT_SECRET` | — | ✅ | Access token secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | — | ✅ | Refresh token secret (≥32 chars) |
| `JWT_EXPIRE` | 15m | ❌ | Access token TTL |
| `JWT_REFRESH_EXPIRE` | 7d | ❌ | Refresh token TTL |
| `AI_CORE_URL` | http://127.0.0.1:8000 | ❌ | AI Core service URL |
| `OLLAMA_URL` | http://127.0.0.1:11434 | ❌ | Ollama API URL |
| `LLM_MODEL` | qwen3:1.7b | ❌ | Target LLM model |
| `CLIENT_URL` | http://localhost:5173 | ❌ | Frontend URL (CORS) |
| `UPLOAD_DIR` | ./uploads | ❌ | File upload directory |
| `MAX_FILE_SIZE` | 52428800 | ❌ | Max upload (bytes, 50MB) |
| `GOOGLE_CLIENT_ID` | — | ❌ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | — | ❌ | Google OAuth secret |

### AI Core (backend/ai_core)

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | http://127.0.0.1:11434 | Ollama API URL |
| `LLM_MODEL` | qwen3:1.7b | Target LLM model |
| `MONGODB_URI` | — | MongoDB connection |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│                  (React SPA + PWA)                        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/WS/SSE
┌─────────────────────▼───────────────────────────────────┐
│              Nginx Reverse Proxy (:3000)                 │
│  ┌─── Static Assets (immutable cache)                    │
│  ├─── /api/* → API Gateway                               │
│  ├─── /ws   → WebSocket                                  │
│  └─── /api/notifications/stream → SSE (no buffering)     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│           Node.js Express API Gateway (:5000)            │
│  ┌─── Security: Helmet, CORS, Sanitize, HPP              │
│  ├─── Auth: JWT + Google OAuth + Rate Limiting            │
│  ├─── Metrics: Request tracking, Latency percentiles      │
│  ├─── Cache: In-memory TTL (analytics, library, export)   │
│  └─── Compression: gzip level 6                          │
├──────────────┬──────────────────────────────────────────┘
│              │
│  ┌───────────▼──────────┐   ┌──────────────────────────┐
│  │    MongoDB 7 (:27017) │   │  Python AI Core (:8000)  │
│  │  ┌─ Users            │   │  ┌─ NLP Pipeline          │
│  │  ├─ Documents        │   │  ├─ Knowledge Graph       │
│  │  ├─ StudySessions    │   │  ├─ Spaced Repetition     │
│  │  ├─ QuizSessions     │   │  ├─ DKT Engine            │
│  │  ├─ Gamification     │   │  └─ Agentic AI            │
│  │  ├─ Courses          │   │      ├─ Tutor Agent        │
│  │  ├─ SharedContent    │   │      ├─ Assessment Agent   │
│  │  ├─ Notifications    │   │      ├─ Feedback Agent     │
│  │  └─ KnowledgeNodes   │   │      └─ Path Planner      │
│  └──────────────────────┘   └─────────────┬────────────┘
│                                            │
│                              ┌─────────────▼────────────┐
│                              │   Ollama (Host Machine)   │
│                              │   qwen3:1.7b (Local LLM)  │
│                              └──────────────────────────┘
```

---

## Monitoring

### Endpoints

Access monitoring at `GET /api/monitor/overview` (requires instructor/admin role).

### Metrics Available

| Category | Metrics |
|----------|---------|
| Throughput | RPM, total requests, active connections |
| Latency | p50, p95, p99, average (global + per-route) |
| Errors | Rate %, 2xx/4xx/5xx breakdown, recent errors |
| Memory | Heap used/total/%, RSS |
| Cache | Hit/miss ratio, active entries |
| Database | Collection document counts |
| Audit | Login/register/password change events |

### Health Check

```bash
curl http://localhost:5000/api/health | jq .
```

---

## Backup & Restore

### Export User Data

```bash
# Via API (per-user)
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/export/backup > backup.json
```

### MongoDB Backup

```bash
# Full database dump
docker exec neurovault-mongo mongodump \
  --db neurovault --out /data/db/backup

# Copy backup to host
docker cp neurovault-mongo:/data/db/backup ./backups/

# Restore
docker exec neurovault-mongo mongorestore \
  --db neurovault /data/db/backup/neurovault
```

### Upload Files Backup

```bash
# Docker volume backup
docker run --rm -v neurovault-uploads:/data -v $(pwd):/backup \
  alpine tar czf /backup/uploads-backup.tar.gz -C /data .
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED :27017` | MongoDB not running | Start MongoDB or check `MONGODB_URI` |
| `AI Core offline` | Python service down | Check `python api/ai_server.py` |
| `Ollama offline` | Ollama not serving | Run `ollama serve` |
| `JWT expired` | Token TTL exceeded | Client should auto-refresh via `/auth/refresh` |
| `Rate limit exceeded` | Too many requests | Wait 15 minutes or increase limits in dev |
| `File type not allowed` | Unsupported upload | Check allowed MIME types in `upload.js` |
| `Magic bytes mismatch` | File extension spoofed | Upload genuine file matching extension |

### Logs

```bash
# Docker logs
docker compose logs -f api-gateway --tail=200

# Local development (auto-logged to console)
# 🟢 GET /api/documents → 200 (12ms)
# 🔴 POST /api/auth/login → 401 (3ms)
```

### Test Suite

```bash
cd backend/server
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Current test status: **127 tests across 8 files, 100% pass rate**.

---

*NeuroVault v2.1 — Last updated: 2026-05-23*
