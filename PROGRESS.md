# 📊 NEUROVAULT — TIẾN ĐỘ DỰ ÁN (PROGRESS TRACKER)

> **⚠️ QUY TẮC BẮT BUỘC:** Mỗi khi hoàn thành một nhiệm vụ, AI Agent PHẢI quay lại file này và đánh dấu `[x]`.
> Nếu đang làm dở, đánh dấu `[/]`. Nếu chưa bắt đầu, để `[ ]`.
> 
> **KÝ HIỆU:**
> - `[ ]` = Chưa bắt đầu
> - `[/]` = Đang làm
> - `[x]` = Hoàn thành
> - `[!]` = Blocked / Có vấn đề

**Cập nhật lần cuối:** 2026-04-12 01:23 (GMT+7)

> **✅ HARDWARE XÁC NHẬN:** NVIDIA GeForce GTX 1650, 4GB VRAM, CUDA 12.0 — GPT-nano training khả thi trên GPU.  
> **CPU:** Intel i5-11320H | **RAM:** 16GB | **OS:** Windows 11 25H2

---

## TỔNG QUAN TIẾN ĐỘ

| Pha | Tên | Tổng Tasks | Hoàn thành | % |
|---|---|---|---|---|
| 0 | Frontend Shell (Legacy) | 8 | 8 | 100% |
| 1 | Data Foundation | 15 | 15 | 100% |
| 2 | Embedding & Retrieval | 12 | 0 | 0% |
| 3 | NLP & Knowledge Graph | 14 | 0 | 0% |
| 4 | GPT-nano & Generation | 13 | 0 | 0% |
| 5 | Learning Intelligence | 14 | 0 | 0% |
| 6 | Polish & Production | 12 | 0 | 0% |
| **TỔNG** | | **88** | **23** | **26%** |

---

## PHA 0: FRONTEND SHELL (LEGACY) ✅

> Đã hoàn thành trước khi bắt đầu lộ trình chính thức

- [x] Khởi tạo React + Vite project
- [x] Cấu hình TailwindCSS
- [x] Trang Login (UI mock)
- [x] Trang Register (UI mock)
- [x] Layout: Sidebar + Header
- [x] Trang Dashboard (mock card)
- [x] Trang DocumentDetail + ChatBox (mock response)
- [x] Trang Profile (UI)

---

## PHA 1: DATA FOUNDATION (Tuần 1-3)

> 📄 Chi tiết: [docs/PHASE_1_DATA_FOUNDATION.md](docs/PHASE_1_DATA_FOUNDATION.md)

### 1.1 Khởi tạo Backend Infrastructure
- [x] Tạo thư mục `backend/server/` (Node.js Express)
- [x] Tạo thư mục `backend/ai_core/` (Python)
- [x] Setup `package.json` cho Node.js server
- [x] Setup `requirements.txt` cho Python AI core
- [x] Cấu hình `vite.config.js` proxy tới backend

### 1.2 Database & Authentication
- [x] Cài đặt MongoDB local + tạo database `neurovault`
- [x] Tạo Mongoose schemas (User, Document, KnowledgeNode, QuizSession)
- [x] Implement JWT Authentication (register, login, refresh token)
- [x] Kết nối frontend auth store → backend thật (thay mock)

### 1.3 Document Processing Pipeline (Python)
- [x] Implement `pdf_parser.py` — PyMuPDF text extraction + layout analysis
- [x] Implement `text_cleaner.py` — Unicode normalization, whitespace, entities
- [x] Implement `sentence_splitter.py` — Rule-based + Punkt-style
- [x] Implement `language_detector.py` — Trigram frequency fingerprinting
- [x] Implement `semantic_chunker.py` — Sliding window + cosine similarity drop
- [x] Unit tests cho toàn bộ preprocessing pipeline

### 1.4 File Upload & Storage
- [x] Document upload API endpoint (Node.js)
- [x] File storage service (local disk)
- [x] Processing queue: Upload → Parse → Clean → Chunk → Save to DB

---

## PHA 2: EMBEDDING & RETRIEVAL (Tuần 4-6)

> 📄 Chi tiết: [docs/PHASE_2_EMBEDDING_RETRIEVAL.md](docs/PHASE_2_EMBEDDING_RETRIEVAL.md)

### 2.1 Tokenizer & Word Embedding
- [ ] Implement `bpe_tokenizer.py` — BPE training trên Vietnamese + English corpus
- [ ] Download & preprocess Wikipedia dumps (VI + EN)
- [ ] Implement `word2vec_trainer.py` — Skip-gram + Negative Sampling (NumPy thuần)
- [ ] Train Word2Vec trên corpus → lưu word vectors

### 2.2 Sentence Embedding
- [ ] Download `all-MiniLM-L6-v2` (hoặc multilingual variant) dạng ONNX
- [ ] Implement `sentence_embedder.py` — ONNX Runtime local inference
- [ ] Mean pooling + L2 normalization
- [ ] Benchmark embedding quality

### 2.3 Retrieval System
- [ ] Implement `bm25.py` — Custom BM25 scoring từ inverted index
- [ ] Implement `tfidf.py` — TF-IDF vectorizer tự viết
- [ ] Setup FAISS (faiss-cpu) cho dense vector indexing
- [ ] Implement `hybrid_ranker.py` — Reciprocal Rank Fusion (Dense + Sparse)
- [ ] API endpoint: semantic search within document
- [ ] Benchmark retrieval (Recall@5, MRR)

---

## PHA 3: NLP PIPELINE & KNOWLEDGE GRAPH (Tuần 7-10)

> 📄 Chi tiết: [docs/PHASE_3_NLP_KNOWLEDGE_GRAPH.md](docs/PHASE_3_NLP_KNOWLEDGE_GRAPH.md)

### 3.1 NLP Pipeline
- [ ] Implement custom tokenization rules cho tiếng Việt
- [ ] Train POS Tagger — BiLSTM-CRF trên UD_Vietnamese + UD_English
- [ ] Train NER model — BiLSTM-CRF cho educational domain
- [ ] Implement `keyword_extractor.py` — RAKE + TextRank hybrid
- [ ] Implement `concept_extractor.py` — NER + noun phrase chunking

### 3.2 Knowledge Graph
- [ ] Implement `graph_builder.py` — Từ concepts → graph nodes
- [ ] Implement `relation_miner.py` — Hearst patterns + co-occurrence + dependency
- [ ] Implement `community_detector.py` — Louvain algorithm cho topic clustering
- [ ] Centrality analysis — Xác định "core concepts" của tài liệu
- [ ] API endpoints: concepts, relations, graph traversal

### 3.3 Frontend Knowledge Graph
- [ ] Cài đặt D3.js
- [ ] Implement Knowledge Graph visualization (force-directed graph)
- [ ] Interactive: click node → xem concept detail
- [ ] Color coding theo mastery level
- [ ] Trang `KnowledgeExplorer.jsx`

---

## PHA 4: GPT-NANO & GENERATION (Tuần 11-15)

> 📄 Chi tiết: [docs/PHASE_4_GPT_NANO_GENERATION.md](docs/PHASE_4_GPT_NANO_GENERATION.md)

### 4.1 Model Architecture
- [ ] Implement `MultiHeadSelfAttention` — Scaled dot-product + causal mask
- [ ] Implement `TransformerBlock` — Pre-norm (GPT-2 style)
- [ ] Implement `GPTNano` — Full model (6-12M params, tuỳ VRAM)
- [ ] Weight tying (embedding ↔ output head)

### 4.2 Training
- [ ] Chuẩn bị training data pipeline (Wikipedia + educational text)
- [ ] Implement training loop — Mixed precision, gradient accumulation
- [ ] Train GPT-nano (ước tính 3-7 ngày trên GTX 1650 / CPU)
- [ ] Evaluate: perplexity, generation quality
- [ ] Export model → ONNX cho inference nhanh

### 4.3 AI Orchestrator & RAG
- [ ] Implement `intent_classifier.py` — BiLSTM lightweight classifier
- [ ] Implement `orchestrator.py` — Query routing logic
- [ ] Implement RAG pipeline: retrieve → context build → generate → fact-check
- [ ] WebSocket streaming response

### 4.4 Frontend Chat Upgrade
- [ ] Kết nối ChatBox → backend WebSocket
- [ ] Streaming text display (token by token)
- [ ] Source citation display (hiển thị chunk nguồn)
- [ ] Confidence score indicator

---

## PHA 5: LEARNING INTELLIGENCE (Tuần 16-19)

> 📄 Chi tiết: [docs/PHASE_5_LEARNING_INTELLIGENCE.md](docs/PHASE_5_LEARNING_INTELLIGENCE.md)

### 5.1 Spaced Repetition Engine
- [ ] Implement `spaced_repetition.py` — Enhanced SM-2+ algorithm
- [ ] Cá nhân hóa forgetting curve per-user (half-life regression)
- [ ] Cross-concept interference modeling
- [ ] Cognitive load adjustment

### 5.2 Quiz Generator
- [ ] Implement MCQ generation — Stem + correct answer + smart distractors
- [ ] Implement Fill-in-the-blank generation
- [ ] Implement True/False với reasoning
- [ ] Implement Socratic questioning (dẫn dắt tư duy)
- [ ] API endpoints: generate quiz, submit answers, get results

### 5.3 Learning Path Optimizer
- [ ] Implement topological sort trên prerequisite graph (Kahn's algorithm)
- [ ] Implement interleaving strategy (xen kẽ chủ đề)
- [ ] Dynamic re-ordering based on mastery

### 5.4 Frontend Learning UIs
- [ ] Trang `QuizArena.jsx` — Quiz interface + timer + explanations
- [ ] Trang `FlashcardDeck.jsx` — Flip animation + SR indicator
- [ ] Trang `Analytics.jsx` — Charts retention curve, strength map
- [ ] Neural Profile widget trên Dashboard

---

## PHA 6: POLISH & PRODUCTION (Tuần 20-24)

> 📄 Chi tiết: [docs/PHASE_6_POLISH_PRODUCTION.md](docs/PHASE_6_POLISH_PRODUCTION.md)

### 6.1 Frontend Redesign
- [ ] Premium dark mode toàn diện
- [ ] Micro-animations + transitions
- [ ] Neural Dashboard (3D Knowledge Graph + strength heatmap)
- [ ] Document Studio (PDF viewer + AI annotations)
- [ ] Responsive design (tablet + mobile)

### 6.2 Performance & Security
- [ ] Model quantization (INT8) cho inference nhanh hơn
- [ ] Response caching (Redis hoặc in-memory)
- [ ] Input sanitization + XSS prevention
- [ ] Rate limiting
- [ ] CORS configuration

### 6.3 Production Readiness
- [ ] End-to-end integration testing
- [ ] Error logging + monitoring
- [ ] User onboarding flow
- [ ] Technical documentation hoàn chỉnh
- [ ] Performance benchmarks
- [ ] Stress testing (concurrent users)

---

## 📝 GHI CHÚ VẬN HÀNH

### Cách cập nhật file này:
1. Khi **bắt đầu** một task: đổi `[ ]` → `[/]`
2. Khi **hoàn thành** một task: đổi `[/]` → `[x]`
3. Khi task bị **blocked**: đổi → `[!]` và ghi lý do bên cạnh
4. Cập nhật **bảng tổng quan** ở đầu file (số hoàn thành + %)
5. Cập nhật **ngày giờ** ở dòng "Cập nhật lần cuối"

### ⚠️ CẢNH BÁO CHO AI AGENT:
> **Trước khi bắt đầu BẤT KỲ task nào, PHẢI đọc file này để biết:**
> 1. Task nào đã xong → KHÔNG làm lại
> 2. Task nào đang dở → tiếp tục
> 3. Task nào cần làm tiếp → bắt đầu
> 4. **TUYỆT ĐỐI** không nhảy pha — hoàn thành pha trước rồi mới sang pha sau
