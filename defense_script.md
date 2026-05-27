# NEUROVAULT — KỊCH BẢN BẢO VỆ ĐỒ ÁN CHUYÊN NGÀNH

> **Triết lý cốt lõi:** 100% White-Box AI — Mọi thuật toán tự viết, không dùng API trả phí, không dùng thư viện AI chuyên dụng.

---

## I. PHÂN CÔNG THUYẾT TRÌNH (3 NGƯỜI)

### 👤 Người 1 — Data Foundation & NLP Pipeline (Slide 1–5)
**Thời lượng:** ~5 phút

**Nội dung chính:**
1. **Giới thiệu hệ thống** — NeuroVault là nền tảng học tập AI-driven, 100% self-hosted
2. **PDF Parser** — Heuristic multi-column layout detection (gap analysis trên tọa độ `x0`), title extraction qua font-size ratio
3. **Text Cleaner** — Pipeline: Unicode NFC → HTML unescape → smart quotes → control char removal
4. **Semantic Chunker** — Sliding window + TF-IDF cosine similarity drop detection. Khi `sim(w_i, w_{i+1}) < threshold`, đánh dấu boundary
5. **Vietnamese NLP** — Longest Match First segmenter tự viết (greedy forward matching trên dictionary 78K+ compound words). BPE Tokenizer train từ đầu (iterative frequency-based merge)

**Điểm nhấn kỹ thuật:**
- Giải thích tại sao dùng heuristic thay vì ML cho PDF layout (deterministic, không cần training data)
- So sánh Semantic Chunking vs Fixed-size chunking (cosine similarity boundary vs arbitrary 512-token split)
- Demo compound word: `"học sinh"` vs `"học"` + `"sinh"` — tầm quan trọng của word segmentation cho tiếng Việt

---

### 👤 Người 2 — Core AI Architecture (Slide 6–10)
**Thời lượng:** ~5 phút

**Nội dung chính:**
1. **Embedding Engine** — TF-IDF → Randomized Truncated SVD (thuật toán Halko-Martinsson-Tropp). Công thức Power Iteration: `Q = orth(A × Ω)`, lặp `Q = orth(A × Aᵀ × Q)` n_iter lần, rồi SVD trên `B = Qᵀ × A`
2. **BM25 Retrieval** — Sparse retrieval tự implement. `score(q,d) = Σ IDF(t) × (tf × (k1+1)) / (tf + k1 × (1-b+b×|d|/avgdl))`
3. **Hybrid Ranker** — Reciprocal Rank Fusion: `RRF(d) = Σ 1/(k + rank_i(d))` kết hợp dense + sparse
4. **Cross-Encoder Reranker** — Multi-signal scoring: semantic (TF-IDF cosine), lexical overlap, position bias, concept overlap. Weighted sum: `0.35×sem + 0.25×lex + 0.15×pos + 0.15×concept + 0.10×hybrid`
5. **Knowledge Graph** — PageRank cho node centrality, Louvain modularity cho community detection, NPMI edge pruning

**Điểm nhấn kỹ thuật:**
- Tại sao Truncated SVD thay vì word2vec/BERT? → Chạy được trên CPU, 16GB RAM, không cần GPU
- NPMI pruning: `NPMI = PMI / -log₂(P(A,B))` — giảm 435 edges → 60-90 meaningful edges
- Louvain vs Label Propagation: LP collapse thành 1 cluster trên dense graph, Louvain tối ưu modularity Q

---

### 👤 Người 3 — Adaptive Learning & System Integration (Slide 11–15)
**Thời lượng:** ~5 phút

**Nội dung chính:**
1. **RAG Pipeline** — Reformulate → Retrieve → Rerank → Generate → Verify. Query Reformulation giải quyết coreference (đại từ) + ellipsis. Grounding verification chống hallucination (keyword overlap > 30%)
2. **LLM Engine** — Kết nối Ollama local (Qwen3 1.7B). Circuit Breaker pattern (CLOSED→OPEN→HALF_OPEN), exponential backoff retry with jitter, connection pooling
3. **Adaptive Quiz (IRT)** — Rasch Model: `P(correct|θ,b) = 1/(1+exp(-(θ-b)))`. Newton-Raphson MLE cho θ estimation. Question selection maximize Fisher Information `I(θ) = P(1-P)`
4. **FSRS v6 Spaced Repetition** — 17 trainable parameters. Forgetting curve: `R(t,S) = (1 + 19/81 × t/S)^(-0.5)`. Stability after success/failure formulas
5. **Deep Knowledge Tracer** — BKT + EMA + temporal decay + cross-concept transfer learning. Zone of Proximal Development targeting ~70% success
6. **Agent Orchestrator** — Supervisor-Worker pattern. Intent classification (rule-based + LLM fallback). Multi-agent chaining, safety guardrails, 4-layer memory (Working → Short-term → Episodic → Long-term)

**Điểm nhấn kỹ thuật:**
- IRT vs fixed difficulty: adaptive targeting tại `θ ≈ b` (maximum information point)
- FSRS v6 vs Anki SM-2: 17-param model vs heuristic, stability-based vs interval-based
- Circuit Breaker: tại sao cần cho production (tránh cascade failure khi Ollama down)

---

## II. CẤU TRÚC 15 SLIDE

| # | Tiêu đề | Nội dung chính | Người |
|---|---------|---------------|-------|
| 1 | **Title Slide** | NeuroVault — AI Learning Platform. Tên nhóm, GVHD, ngày | 1 |
| 2 | **Motivation & Problem** | Học thụ động, không cá nhân hóa, phụ thuộc API trả phí → White-Box AI | 1 |
| 3 | **System Architecture** | Sơ đồ 3-tier: React Frontend → Node.js Gateway → FastAPI AI Core | 1 |
| 4 | **Data Ingestion Pipeline** | PDF Parser (multi-column) → Text Cleaner → Semantic Chunker | 1 |
| 5 | **Vietnamese NLP Engine** | Word Segmenter (LMF) + BPE Tokenizer + Stopword Filter | 1 |
| 6 | **Embedding Engine** | TF-IDF + Randomized Truncated SVD (Halko algorithm) | 2 |
| 7 | **Retrieval System** | BM25 (sparse) + Vector Search (dense) + RRF Hybrid Fusion | 2 |
| 8 | **Cross-Encoder Reranking** | Multi-signal scoring: semantic, lexical, position, concept | 2 |
| 9 | **Knowledge Graph** | Concept extraction + PageRank centrality + Louvain community + NPMI pruning | 2 |
| 10 | **RAG Pipeline** | Query Reformulation → Hybrid Retrieval → LLM Generation → Grounding Verification | 2 |
| 11 | **LLM Infrastructure** | Ollama local inference, Circuit Breaker, retry, streaming, thinking mode | 3 |
| 12 | **Adaptive Quiz Engine** | IRT Rasch Model, MLE ability estimation, Fisher Information selection | 3 |
| 13 | **Spaced Repetition (FSRS v6)** | 17-param scheduler, forgetting curves, DKT integration | 3 |
| 14 | **Multi-Agent System** | Orchestrator + specialized agents, intent classification, memory layers | 3 |
| 15 | **Demo & Conclusion** | Live demo, kết quả, hạn chế, hướng phát triển | 3 |

---

## III. NỘI DUNG CHI TIẾT TỪNG SLIDE

### Slide 1 — Title
- Logo/tên dự án: **NeuroVault — AI-Driven Learning Platform**
- Tagline: *"100% White-Box AI · Self-Hosted · Privacy-First"*
- Tên nhóm, GVHD, ngày bảo vệ

### Slide 2 — Motivation
- **Vấn đề:** (1) Học thụ động — đọc tài liệu nhưng không kiểm tra hiểu biết. (2) Không cá nhân hóa — mọi người học cùng 1 lộ trình. (3) Phụ thuộc cloud API — tốn chi phí, không kiểm soát data
- **Giải pháp:** Nền tảng AI tự viết 100%, chạy local, tối ưu cho phần cứng consumer-grade (RTX 3050 4GB, 16GB RAM)
- **White-Box:** Mọi thuật toán có thể giải thích, debug, và tune — không phải "black-box magic"

### Slide 3 — Architecture
```
┌──────────────────────────────────────────────────┐
│  Frontend (React + Vite)                         │
│  Dashboard · Reader · Quiz · Knowledge Graph     │
├──────────────────────────────────────────────────┤
│  API Gateway (Node.js + Express)                 │
│  Auth · Rate Limiting · Routing                  │
├──────────────────────────────────────────────────┤
│  AI Core (FastAPI + Python)                      │
│  ┌─────────┐ ┌──────────┐ ┌────────────────────┐│
│  │Preproc. │ │Embedding │ │Retrieval (BM25+Vec)││
│  │NLP      │ │TF-IDF+SVD│ │Hybrid+Rerank       ││
│  ├─────────┤ ├──────────┤ ├────────────────────┤│
│  │Knowledge│ │Inference │ │Adaptive Learning   ││
│  │Graph    │ │LLM+RAG   │ │IRT+FSRS+DKT        ││
│  └─────────┘ └──────────┘ └────────────────────┘│
├──────────────────────────────────────────────────┤
│  Data Layer (SQLite/JSON + VectorStore)           │
└──────────────────────────────────────────────────┘
```

### Slide 4 — Data Ingestion
- **PDF Parser:** PyMuPDF blocks → gap analysis (`median_x > threshold`) → multi-column detection → reading order reconstruction
- **Text Cleaner:** `unicodedata.normalize('NFC')` → `html.unescape()` → smart quotes `''"" → ''""`  → control chars removal
- **Semantic Chunker:** Sliding window TF-IDF vectors → cosine similarity giữa windows liên tiếp → drop dưới `mean - std` = boundary
- Diagram: `PDF → Blocks → Columns → Text → Clean → Chunks`

### Slide 5 — Vietnamese NLP
- **Word Segmenter:** Longest Match First — scan forward, thử match compound dài nhất trước (e.g., `"trí tuệ nhân tạo"` trước `"trí tuệ"`)
- **BPE Tokenizer:** Train loop: count pair frequencies → merge most frequent → update vocab → repeat until `vocab_size` reached
- **Tại sao tự viết?** VnCoreNLP/Underthesea cần Java/model lớn. LMF segmenter chỉ cần dictionary file, <1MB, chạy nhanh

### Slide 6 — Embedding
- **TF-IDF:** `tfidf(t,d) = tf(t,d) × log((N+1)/(df(t)+1)) + 1` — L2 normalized
- **Truncated SVD:** Giảm chiều từ `|V|` (hàng ngàn) xuống `dim=128`. Thuật toán Halko: random projection `Ω` → `Y = A×Ω` → QR → Power iteration `Q = orth(A×Aᵀ×Q)` → `B = Qᵀ×A` → SVD(B)
- **Tại sao không BERT?** BERT cần GPU + 400MB model. SVD chạy trên CPU trong <1s cho 1000 documents

### Slide 7 — Retrieval
- **BM25:** Okapi BM25 với `k1=1.5, b=0.75`. Index: precompute document lengths, term frequencies, IDF
- **Vector Search:** Cosine similarity trên SVD embeddings. Brute-force (đủ nhanh cho <10K chunks)
- **RRF Fusion:** `score(d) = Σ 1/(60 + rank_sparse(d)) + 1/(60 + rank_dense(d))` — k=60 cân bằng 2 signals

### Slide 8 — Reranking
- Cross-Encoder Reranker (multi-signal):
  - `semantic = cosine(tfidf(query), tfidf(chunk))` — 35%
  - `lexical = |words(q) ∩ words(c)| / |words(q)|` — 25%
  - `position = 1 / (1 + pos × 0.1)` — 15% (chunks đầu document quan trọng hơn)
  - `concept = |concepts(q) ∩ concepts(c)| / |concepts(q)|` — 15%
  - `hybrid_prior` — 10% (score từ RRF stage)

### Slide 9 — Knowledge Graph
- **Concept Extraction:** TF-IDF scoring + ngram extraction + position/specificity bonus + LLM enhancement
- **Relation Detection:** Pattern-based (is-a, part-of, prerequisite, related) cho cả EN + VI
- **PageRank:** `PR(v) = (1-d)/N + d × Σ PR(u)×w(u,v)/out(u)` — d=0.85, max 50 iterations
- **Louvain Community:** Optimize modularity `ΔQ` — local moves until convergence
- **NPMI Pruning:** `NPMI = log₂(P(A,B)/(P(A)×P(B))) / -log₂(P(A,B))` — giữ edges có statistical significance

### Slide 10 — RAG Pipeline
- **Query Reformulation:** Detect pronouns/ellipsis → LLM rewrite (hoặc rule-based fallback replace pronoun bằng last topic)
- **Retrieval:** Dense + Sparse → RRF → Cross-Encoder Rerank
- **Generation:** Assemble context + system prompt (bilingual) + conversation memory (sliding window 3 turns)
- **Grounding Verification:** Split response → check keyword overlap per sentence → `score > 0.5` = grounded (anti-hallucination)

### Slide 11 — LLM Infrastructure
- **Ollama Local:** Qwen3 1.7B (fits RTX 3050 4GB VRAM). Zero API cost, full privacy
- **Circuit Breaker:** `CLOSED → (5 failures) → OPEN → (60s timeout) → HALF_OPEN → (1 success) → CLOSED`
- **Retry:** Exponential backoff `delay = min(30, 2^attempt + random(0,1))` with jitter
- **Streaming:** SSE with `<think>...</think>` tag separation for thinking mode
- **Connection Pooling:** `httpx.Client` with keep-alive (5 connections, 30s expiry)

### Slide 12 — Adaptive Quiz (IRT)
- **Rasch Model:** `P(correct|θ,b) = σ(θ-b) = 1/(1+e^(-(θ-b)))`
- **MLE via Newton-Raphson:** `θ_{n+1} = θ_n + Σ(x_i - P_i) / Σ(P_i×Q_i)` — converge khi `|δ| < 0.001`
- **Question Selection:** Maximize Fisher Information `I(θ) = P×(1-P)` → chọn item có `b ≈ θ`
- **Stopping:** `SE(θ) = 1/√(ΣI(θ)) < 0.4` hoặc max 15 questions
- **Quiz Generator:** LLM-first + template fallback. Bloom's Taxonomy (6 levels). Source grounding verification

### Slide 13 — Spaced Repetition
- **FSRS v6:** 17 trainable parameters `w0-w16`
- **Forgetting Curve:** `R(t,S) = (1 + 19/81 × t/S)^(-0.5)` — power law decay
- **Stability Update (success):** `S' = S × (1 + e^w6 × (11-D) × S^(-w7) × (e^((1-R)×w8) - 1) × hard/easy)`
- **Deep Knowledge Tracer:** BKT Bayesian update `P(mastered|correct) = (1-p_slip)×P / P_correct` + EMA smoothing + temporal decay `R = P_init + (P - P_init) × e^(-λt/stability)`
- **Integration:** DKT feeds prior θ to IRT quiz. FSRS schedules flashcard reviews. Priority queue by urgency score

### Slide 14 — Multi-Agent System
- **Orchestrator:** Supervisor-Worker pattern (tự viết, không dùng LangGraph/CrewAI)
- **Intent Classification:** Rule-based keyword matching (score ≥ 2) → LLM fallback
- **Agents:** Tutor, Assessment, Feedback, Safety, Content Generation, Analytics, Path Planning
- **Memory:** 4-layer: Working (current turn) → Short-term (session) → Episodic (past sessions) → Long-term (learner facts)
- **Safety:** Content moderation agent chạy parallel, fail-open for education
- **Handoff:** Agent A → Agent B → Agent C, max depth = 3

### Slide 15 — Demo & Conclusion
- **Live Demo:** Upload PDF → xem chunks + concepts → Knowledge Graph → hỏi đáp RAG → làm quiz adaptive
- **Kết quả:** Toàn bộ hệ thống chạy trên 1 laptop (i7 + RTX 3050 + 16GB RAM)
- **Hạn chế:** (1) SVD embedding chưa capture semantic depth như BERT. (2) LLM 1.7B giới hạn reasoning phức tạp. (3) Chưa benchmark trên dataset chuẩn
- **Hướng phát triển:** (1) Fine-tune embedding model nhỏ. (2) Collaborative learning. (3) Mobile app. (4) FSRS weight personalization per learner

---

## IV. CANVA AI PROMPT

```
Create a 15-slide graduation project defense presentation for "NeuroVault — AI-Driven Learning Platform".

Style: Dark mode with deep navy (#0a0f1e) background. Accent colors: electric blue (#3b82f6) and emerald (#10b981). Use glassmorphism cards with subtle borders. Modern sans-serif font (Inter or similar). Clean, minimal, professional academic style.

Slide layout guidelines:
- Title slide: Large bold title centered, subtitle below, team info at bottom
- Content slides: Left-aligned heading, 2-column layout where appropriate
- Architecture slides: Use block diagrams with rounded corners and connecting arrows
- Algorithm slides: Show mathematical formulas in clean notation with visual flow
- Use icons for each major component (brain icon for AI, database for storage, etc.)
- Include subtle gradient accents and thin separator lines
- Keep text minimal — bullet points only, no paragraphs
- Use code-style monospace font for formulas and technical terms

Color coding for components:
- Preprocessing/NLP: Blue (#3b82f6)
- Embedding/Retrieval: Purple (#8b5cf6)
- Knowledge Graph: Emerald (#10b981)
- LLM/RAG: Amber (#f59e0b)
- Adaptive Learning: Rose (#f43f5e)
- Agent System: Cyan (#06b6d4)

Each slide should feel premium, modern, and technically sophisticated — suitable for a computer science thesis defense before an expert committee.
```

---

## V. CÂU HỎI PHẢN BIỆN DỰ KIẾN & GỢI Ý TRẢ LỜI

| # | Câu hỏi | Gợi ý trả lời |
|---|---------|---------------|
| 1 | Tại sao không dùng BERT/Sentence-Transformers? | Mục tiêu white-box + resource constraint (4GB VRAM). SVD đủ cho retrieval task, trade-off accuracy vs deployability |
| 2 | Đánh giá retrieval quality bằng metric nào? | Chưa benchmark formal (hạn chế). Có grounding verification score ~0.5-0.8 trên test cases |
| 3 | FSRS v6 train weights thế nào? | Dùng default weights từ nghiên cứu gốc (optimized trên 100M+ reviews). Chưa personalize per user |
| 4 | IRT có bao nhiêu tham số? | 1PL Rasch — 1 parameter (difficulty b). Đủ cho education context, 2PL/3PL cần nhiều data hơn |
| 5 | Knowledge Graph có bao nhiêu nodes tối đa? | Max 30 concepts/document. Louvain + NPMI pruning giữ graph readable |
| 6 | Tại sao Louvain thay vì Label Propagation? | LP collapse thành 1 cluster trên dense co-occurrence graphs. Louvain optimize modularity Q explicitly |
| 7 | Semantic Chunker threshold chọn thế nào? | `mean(similarities) - std(similarities)` — adaptive per document, không hardcode |
| 8 | Anti-hallucination hoạt động thế nào? | 2 tầng: (1) Source grounding khi generate quiz (answer phải có trong source). (2) Grounding verification cho RAG (keyword overlap > 30% per sentence) |
