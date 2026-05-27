# NEUROVAULT — KỊCH BẢN BẢO VỆ ĐỒ ÁN CHUYÊN NGÀNH

> **Triết lý cốt lõi:** 100% White-Box AI — Mọi thuật toán tự viết, không dùng API trả phí, không dùng thư viện AI chuyên dụng.

---

## I. PHÂN CÔNG THUYẾT TRÌNH (3 NGƯỜI)

### 👤 Người 1 — Data Foundation & NLP Pipeline (Slide 1–5)
**Thời lượng:** ~5 phút

---

#### 📌 SLIDE 1: GIỚI THIỆU HỆ THỐNG

**Lời mở đầu (gợi ý nói):**
> "Kính chào Hội đồng. Hôm nay nhóm chúng em xin trình bày đồ án NeuroVault — một nền tảng học tập thông minh dựa trên AI, được xây dựng hoàn toàn từ đầu theo triết lý White-Box AI."

**3 điểm cốt lõi cần nêu:**

1. **Vấn đề thực tế:**
   - Sinh viên đọc tài liệu nhưng KHÔNG có công cụ kiểm tra mức độ hiểu biết thực sự
   - Các nền tảng AI hiện tại (ChatGPT, Quizlet) phụ thuộc API trả phí, dữ liệu gửi lên cloud → không kiểm soát được privacy
   - Không có hệ thống nào cá nhân hóa lộ trình học dựa trên năng lực thực sự của từng người

2. **Giải pháp NeuroVault:**
   - Upload tài liệu PDF → AI tự động phân tích, trích xuất kiến thức, tạo Knowledge Graph
   - Hỏi đáp thông minh (RAG) dựa trên NỘI DUNG tài liệu, không bịa đặt
   - Quiz adaptive điều chỉnh độ khó real-time theo năng lực người học (IRT)
   - Flashcard với lịch ôn tập tối ưu (FSRS v6 — thuật toán spaced repetition mới nhất)

3. **Triết lý White-Box:**
   - **KHÔNG dùng** OpenAI API, Anthropic API, hay bất kỳ cloud AI nào
   - **KHÔNG dùng** thư viện AI chuyên dụng: LangChain, LlamaIndex, Sentence-Transformers
   - **KHÔNG dùng** framework agent: LangGraph, CrewAI, AutoGen
   - **TỰ VIẾT 100%** mọi thuật toán: BPE Tokenizer, TF-IDF, SVD, BM25, PageRank, IRT, FSRS, Agent Orchestrator
   - LLM inference chạy **100% local** qua Ollama (Qwen3 1.7B) — zero API cost

**Câu nói mạnh cho slide này:**
> "Mọi dòng code AI trong hệ thống này đều có thể trace back tới công thức toán học cụ thể. Đó là tinh thần White-Box — không có 'black-box magic' nào cả."

---

#### 📌 SLIDE 2: KIẾN TRÚC HỆ THỐNG (System Architecture)

**Kiến trúc 3 tầng — giải thích từng layer:**

**Tầng 1 — Frontend (React 18 + Vite):**
- Single Page Application, responsive design
- Các module giao diện chính:
  - **DocumentReader:** hiển thị tài liệu đã xử lý, highlight chunks
  - **KnowledgeGraph:** force-directed graph visualization (D3.js style)
  - **QuizEngine:** giao diện làm quiz adaptive với thanh tiến trình năng lực
  - **ChatInterface:** hỏi đáp RAG với streaming response
  - **FlashcardDeck:** ôn tập spaced repetition với FSRS scheduling

**Tầng 2 — API Gateway (Node.js + Express):**
- **Vai trò:** proxy layer giữa Frontend và AI Core
- Authentication (JWT), rate limiting, request validation
- Route `/api/ai/*` → forward tới FastAPI AI Core (port 8100)
- Route `/api/documents/*`, `/api/users/*` → xử lý CRUD trực tiếp
- **Tại sao tách riêng?** Separation of concerns — Node.js xử lý I/O nhanh, Python xử lý AI compute

**Tầng 3 — AI Core (FastAPI + Python):**
- Đây là **trái tim** của hệ thống, chứa toàn bộ thuật toán AI
- 6 module chính (sẽ trình bày chi tiết ở các slide tiếp):

| Module | File chính | Chức năng |
|--------|-----------|-----------|
| `preprocessing/` | `pdf_parser.py`, `text_cleaner.py`, `semantic_chunker.py` | Xử lý đầu vào |
| `nlp/` | `vietnamese.py`, `stopword_filter.py` | Xử lý ngôn ngữ tiếng Việt |
| `tokenizer/` | `bpe_tokenizer.py` | Byte Pair Encoding tự viết |
| `embedding/` | `embedding_engine.py` | TF-IDF + Truncated SVD |
| `retrieval/` | `bm25.py`, `vector_store.py`, `hybrid_ranker.py`, `cross_encoder_reranker.py` | Tìm kiếm hybrid |
| `knowledge/` | `concept_extractor.py`, `graph_builder.py` | Knowledge Graph |
| `inference/` | `llm_engine.py`, `rag_pipeline.py` | LLM + RAG |
| `adaptive/` | `adaptive_quiz.py`, `spaced_repetition.py`, `deep_knowledge_tracer.py` | Học thích ứng |
| `agents/` | `orchestrator.py`, `base_agent.py`, registry, memory | Multi-agent system |

**Tầng 4 — Data Layer:**
- SQLite cho metadata (documents, users, quiz results)
- JSON files cho cấu hình và vocab
- VectorStore in-memory (cosine similarity search)
- Tất cả chạy local, không cần database server riêng

---

#### 📌 SLIDE 3: DATA INGESTION PIPELINE (Chi tiết kỹ thuật)

**Flow tổng quát:**
```
PDF File → [PDF Parser] → Raw Text Blocks
         → [Text Cleaner] → Clean Text
         → [Language Detector] → vi/en
         → [Semantic Chunker] → Semantic Chunks
         → [Vietnamese NLP] → Segmented + Tokenized
```

##### 3.1 PDF Parser (`pdf_parser.py` — 288 dòng code)

**Vấn đề cần giải quyết:**
- PDF không phải plain text — nó chứa các "block" với tọa độ (x0, y0, x1, y1)
- Tài liệu học thuật thường có **multi-column layout** (2 cột) → đọc sai thứ tự nếu không xử lý
- Tiêu đề, heading cần được nhận diện để phân cấp nội dung

**Thuật toán Multi-Column Detection (tự viết, heuristic-based):**

```
Bước 1: Lấy tất cả text blocks từ PyMuPDF
        blocks = page.get_text("dict")["blocks"]
        → Mỗi block có: (x0, y0, x1, y1, text, font_size)

Bước 2: Phân tích phân bố tọa độ x0 (left margin)
        x_positions = [block.x0 for block in blocks]
        
Bước 3: Tính median gap giữa các blocks
        gaps = sorted(x_positions)
        median_gap = median(gaps)
        
Bước 4: Nếu có cluster rõ ràng ở 2 vùng x0 khác nhau
        → Đánh dấu là multi-column
        left_blocks  = [b for b in blocks if b.x0 < page_width * 0.45]
        right_blocks = [b for b in blocks if b.x0 > page_width * 0.45]
        
Bước 5: Đọc theo thứ tự: left column (top→bottom) → right column (top→bottom)
        → Thay vì đọc ngang (sai nghĩa)
```

**Title Extraction (heuristic font-size ratio):**
```python
# Trong code thực tế (pdf_parser.py, line ~180-220):
font_sizes = [span["size"] for block in blocks for span in block["spans"]]
median_size = sorted(font_sizes)[len(font_sizes) // 2]

# Block nào có font_size > 1.3 × median → khả năng cao là heading
for block in blocks:
    if block.font_size > median_size * 1.3:
        block.role = "heading"
    elif block.font_size > median_size * 1.1:
        block.role = "subheading"
    else:
        block.role = "body"
```

**Tại sao dùng heuristic thay vì ML?**
- ML cần training data (hàng ngàn PDF đã label) → không có sẵn
- Heuristic **deterministic** — cùng input luôn cho cùng output, dễ debug
- Hoạt động tốt cho 90%+ tài liệu học thuật thông thường
- Không cần GPU hay model file

---

##### 3.2 Text Cleaner (`text_cleaner.py` — 121 dòng code)

**Pipeline 6 bước tuần tự — mỗi bước giải quyết 1 vấn đề cụ thể:**

| Bước | Hàm | Mục đích | Ví dụ |
|------|-----|----------|-------|
| 1 | `unicodedata.normalize('NFC')` | Chuẩn hóa Unicode — đảm bảo `é` (1 ký tự) = `é` (e + combining accent) | `café` → thống nhất encoding |
| 2 | `html.unescape()` | Chuyển HTML entities về ký tự thường | `&amp;` → `&`, `&lt;` → `<` |
| 3 | Smart quotes → ASCII quotes | Chuẩn hóa dấu ngoặc kép | `''"" → ''"\"` |
| 4 | Control chars removal | Xóa ký tự điều khiển (U+0000-U+001F) | `\x00`, `\x0B` → removed |
| 5 | Whitespace normalization | Gộp nhiều khoảng trắng thành 1 | `"hello   world"` → `"hello world"` |
| 6 | Empty line collapse | Gộp nhiều dòng trống liên tiếp | `\n\n\n\n` → `\n\n` |

**Tại sao cần pipeline này?**
- PDF text extraction thường tạo ra text "bẩn" — có control characters, encoding lỗi
- Nếu không clean, các bước sau (tokenization, TF-IDF) sẽ cho kết quả sai
- Ví dụ thực tế: `"Trí tuệ\x00 nhân\x0Btạo"` → sau clean → `"Trí tuệ nhân tạo"`

---

##### 3.3 Semantic Chunker (`semantic_chunker.py` — 301 dòng code)

**Vấn đề với Fixed-size Chunking:**
- Chia text thành đoạn 512 token cố định → CẮT NGANG câu, CẮT NGANG ý → mất ngữ cảnh
- Ví dụ: đoạn nói về "photosynthesis" bị cắt giữa chừng, nửa ở chunk A, nửa ở chunk B

**Giải pháp: Semantic Boundary Detection**

Thuật toán chi tiết (bám sát code thực tế):

```
Bước 1: Chia text thành sentences (regex split: [.!?])

Bước 2: Tạo sliding windows (mỗi window = 3 câu liên tiếp)
        window_1 = [sent_1, sent_2, sent_3]
        window_2 = [sent_2, sent_3, sent_4]
        ...

Bước 3: Với mỗi window, tính TF-IDF vector
        vec_i = tfidf_vectorize(window_i)

Bước 4: Tính cosine similarity giữa 2 windows liên tiếp
        sim_i = cosine(vec_i, vec_{i+1})
        
        cosine(A, B) = (A · B) / (||A|| × ||B||)

Bước 5: Phát hiện "similarity drop" = ranh giới ngữ nghĩa
        threshold = mean(all_similarities) - std(all_similarities)
        
        Nếu sim_i < threshold → ĐÂY LÀ BOUNDARY
        (nghĩa là nội dung đang chuyển sang chủ đề mới)

Bước 6: Cắt text tại các boundary → thu được semantic chunks
        Mỗi chunk chứa nội dung về 1 chủ đề coherent
```

**Ví dụ minh họa trực quan:**
```
Similarities: [0.82, 0.79, 0.81, 0.35, 0.78, 0.80, 0.31, 0.77]
                                     ↑ DROP              ↑ DROP
Mean = 0.68, Std = 0.22
Threshold = 0.68 - 0.22 = 0.46

→ 0.35 < 0.46 → BOUNDARY (chuyển chủ đề)
→ 0.31 < 0.46 → BOUNDARY (chuyển chủ đề)

Kết quả: 3 chunks, mỗi chunk về 1 topic riêng
```

**Constraints trong code thực tế:**
- `min_chunk_size = 100` chars — tránh chunk quá nhỏ
- `max_chunk_size = 2000` chars — tránh chunk quá lớn (force split nếu vượt)
- `overlap = 50` chars — overlap giữa chunks để giữ context continuity

---

#### 📌 SLIDE 4: VIETNAMESE NLP ENGINE (Chi tiết kỹ thuật)

##### 4.1 Word Segmenter — Longest Match First (`vietnamese.py` — 361 dòng code)

**Vấn đề đặc thù tiếng Việt:**
- Tiếng Việt là ngôn ngữ **đơn lập** (isolating language)
- Ranh giới từ KHÔNG được đánh dấu bằng dấu cách
- `"học sinh giỏi"` = 1 concept hay 2? (`"học_sinh" + "giỏi"` hay `"học" + "sinh" + "giỏi"`?)
- Nếu tách sai → TF-IDF, BM25, concept extraction đều cho kết quả sai

**Thuật toán Longest Match First (Greedy Forward Matching):**

```
Input:  "trí tuệ nhân tạo đang phát triển"
Dict:   {"trí tuệ nhân tạo": 4, "trí tuệ": 2, "nhân tạo": 2, 
         "phát triển": 2, "đang": 1}

Bước 1: Cursor ở vị trí 0 → "trí"
        Thử match dài nhất:
          "trí tuệ nhân tạo" (4 từ) → CÓ trong dict ✓ → MATCH!
        Output: ["trí tuệ nhân tạo"]
        Cursor nhảy 4 vị trí

Bước 2: Cursor ở vị trí 4 → "đang"
        Thử match dài nhất:
          "đang phát triển" (3 từ) → KHÔNG có ✗
          "đang phát" (2 từ) → KHÔNG có ✗
          "đang" (1 từ) → CÓ ✓ → MATCH!
        Output: ["trí tuệ nhân tạo", "đang"]

Bước 3: Cursor ở vị trí 5 → "phát"
        "phát triển" (2 từ) → CÓ ✓ → MATCH!
        Output: ["trí tuệ nhân tạo", "đang", "phát triển"]

Final: "trí_tuệ_nhân_tạo đang phát_triển"
```

**Dictionary source:**
- Tự xây dựng từ nhiều nguồn (compound words tiếng Việt)
- Lưu trữ dạng `Set[str]` cho O(1) lookup
- Hỗ trợ compound words 2-4 syllables (e.g., `"trường đại học"`, `"kỹ thuật số"`)

**Tại sao KHÔNG dùng VnCoreNLP / Underthesea?**

| Tiêu chí | VnCoreNLP | Underthesea | NeuroVault LMF |
|----------|-----------|-------------|----------------|
| Dependencies | Java + 300MB model | PyTorch + model | Dictionary file < 1MB |
| Speed | ~100 words/sec | ~500 words/sec | ~50,000 words/sec |
| GPU needed | No (nhưng chậm) | Optional | No |
| Install size | ~400MB | ~200MB | ~1MB |
| White-box | ✗ (model opaque) | ✗ (neural opaque) | ✓ (mọi bước trace được) |

---

##### 4.2 BPE Tokenizer (`bpe_tokenizer.py` — 449 dòng code)

**Byte Pair Encoding — tự implement 100%, không dùng `tokenizers` hay `sentencepiece`**

**Mục đích:** Chia text thành subword units — giải quyết vấn đề OOV (Out-of-Vocabulary)
- Từ phổ biến (`"học"`) → giữ nguyên
- Từ hiếm (`"electroencephalography"`) → chia thành subwords (`"electro" + "encephalo" + "graphy"`)

**Thuật toán Training (bám sát `bpe_tokenizer.py`):**

```
Input corpus: ["học sinh", "sinh viên", "học viện", "sinh học"]

Bước 0: Khởi tạo vocab = tất cả ký tự đơn lẻ
        vocab = {'h', 'ọ', 'c', ' ', 's', 'i', 'n', 'v', 'ê', ...}

Bước 1: Đếm tần suất tất cả cặp ký tự liền kề (byte pairs)
        pairs = {('h','ọ'): 3, ('ọ','c'): 3, ('s','i'): 2, 
                 ('i','n'): 2, ('n','h'): 2, ('v','i'): 2, ...}

Bước 2: Merge cặp có tần suất cao nhất
        Best pair: ('h','ọ') freq=3
        Merge: 'h' + 'ọ' → 'họ'  (thêm vào vocab)
        Cập nhật corpus: ["học sinh", "sinh viên", "học viện", "sinh học"]

Bước 3: Lặp lại — đếm pairs mới
        pairs = {('họ','c'): 3, ('si','nh'): ..., ...}
        Best: ('họ','c') → merge thành 'học'

Bước 4: Tiếp tục merge cho đến khi đạt vocab_size mong muốn
        'si' + 'nh' → 'sinh'
        'vi' + 'ên' → 'viên'
        ...

Kết quả vocab: {'học', 'sinh', 'viên', 'học sinh', ...}
```

**Encoding (tokenize text mới):**
```
Input: "học sinh giỏi"
1. Chia thành characters: ['h','ọ','c',' ','s','i','n','h',' ','g','i','ỏ','i']
2. Áp dụng merge rules theo thứ tự đã học:
   'h'+'ọ' → 'họ' → 'họ'+'c' → 'học'
   's'+'i' → 'si' → 'si'+'nh' → 'sinh'
   'g'+'i' → 'gi' → 'gi'+'ỏ' → 'giỏ' → 'giỏ'+'i' → 'giỏi'
3. Output tokens: ['học', 'sinh', 'giỏi']
   Token IDs: [42, 67, 128]
```

**Điểm mạnh so với character-level tokenization:**
- Giữ được meaningful subwords → tốt hơn cho TF-IDF
- Vocab size kiểm soát được (mặc định 8192)
- Persistent: save/load vocab dạng JSON (`bpe_vocab.json`)
- Dùng cho LLM Engine token counting (`LLMEngine.estimate_tokens()`)

---

##### 4.3 Stopword Filter (`stopword_filter.py`)

**Bilingual stopword list (EN + VI):**
- **English:** ~200 stopwords (`the, a, an, is, are, was, were, of, in, to, for...`)
- **Vietnamese:** ~80 stopwords (`là, và, của, có, trong, được, cho, này, với, các, không, một, những...`)
- Merged set `_STOPWORDS = _STOPWORDS_EN | _STOPWORDS_VI` cho bilingual documents

**Vai trò trong pipeline:**
- Loại bỏ noise trước khi tính TF-IDF (stopwords có TF cao nhưng không mang nghĩa)
- Cải thiện quality của concept extraction (không trích xuất `"của"`, `"trong"` làm concept)
- Giảm dimensionality của TF-IDF vector → SVD nhanh hơn

---

#### 📌 ĐIỂM NHẤN KỸ THUẬT CHO NGƯỜI 1

**3 câu "đánh" mạnh để gây ấn tượng với Hội đồng:**

1. > "Toàn bộ NLP pipeline xử lý tiếng Việt — từ word segmentation đến BPE tokenization — đều tự viết từ đầu. Chúng em không dùng VnCoreNLP, Underthesea, hay bất kỳ thư viện NLP nào. Mỗi bước đều có thể trace back tới thuật toán cụ thể."

2. > "Semantic Chunker sử dụng cosine similarity drop detection thay vì chia cố định — nghĩa là hệ thống tự 'hiểu' khi nào nội dung chuyển chủ đề, và cắt đúng ranh giới ngữ nghĩa."

3. > "PDF Parser xử lý được multi-column layout — một bài toán mà nhiều hệ thống PDF-to-text bỏ qua, dẫn đến text bị đọc sai thứ tự."

**Câu hỏi phản biện dự kiến cho Người 1:**

| Câu hỏi | Trả lời gợi ý |
|---------|---------------|
| LMF segmenter có xử lý được từ mới (OOV) không? | Từ không có trong dictionary sẽ giữ nguyên dạng syllable. BPE Tokenizer bổ sung bằng cách chia thành subwords — không bao giờ gặp OOV hoàn toàn. |
| Semantic Chunker threshold có quá đơn giản? | `mean - std` là adaptive per document — threshold tự điều chỉnh theo độ khó/đồng nhất của text. Đây là design choice cân bằng simplicity vs effectiveness. |
| Tại sao không dùng OCR cho scanned PDF? | Hệ thống hiện hỗ trợ OCR qua Tesseract (module riêng). Slide này focus vào digital PDF vì đó là use case chính của sinh viên. |
| BPE vocab size 8192 có đủ? | Cho tiếng Việt + English mixed text, 8192 subwords cover ~95% tokens thường gặp. Có thể tăng lên 16K nếu cần. |

---

### 👤 Người 2 — Trí Tuệ Hệ Thống: RAG + LLM + Knowledge Graph (Slide 6–10)
**Thời lượng:** ~5 phút
**Chủ đề:** Hệ thống "hiểu" tài liệu và trả lời câu hỏi như thế nào?

**Nội dung chính:**
1. **LLM Engine** — Kết nối Ollama local (Qwen3 1.7B). Circuit Breaker pattern, exponential backoff retry with jitter, connection pooling, streaming with thinking mode
2. **RAG Pipeline** — Reformulate → Retrieve → Rerank → Generate → Verify. Query Reformulation giải quyết coreference (đại từ) + ellipsis. Grounding verification chống hallucination
3. **Retrieval System** — BM25 (sparse) + TF-IDF/SVD embedding (dense) → Hybrid RRF Fusion → Cross-Encoder Reranking (5 signals)
4. **Knowledge Graph** — Concept extraction (TF-IDF + LLM) → Relation detection (pattern-based EN+VI) → PageRank centrality → Louvain community detection → NPMI edge pruning
5. **Quiz Generator** — LLM-first + template fallback. Bloom's Taxonomy (6 levels). Source grounding verification chống hallucination

**Điểm nhấn kỹ thuật:**
- RAG 5-stage pipeline: Reformulate → Retrieve → Rerank → Generate → Verify — mỗi stage giải quyết 1 vấn đề cụ thể
- Hybrid Search kết hợp sparse (BM25) + dense (SVD embedding) qua RRF — tốt hơn cả 2 khi dùng riêng lẻ
- Circuit Breaker pattern cho LLM — production-grade error handling, không để 1 lỗi cascade toàn hệ thống

---

### 👤 Người 3 — Học Thích Ứng & Hệ Thống Agent (Slide 11–15)
**Thời lượng:** ~5 phút
**Chủ đề:** Hệ thống cá nhân hóa việc học và thích ứng theo năng lực người học như thế nào?

**Nội dung chính:**
1. **Adaptive Quiz (IRT)** — Rasch Model: `P(correct|θ,b) = 1/(1+exp(-(θ-b)))`. Newton-Raphson MLE cho θ estimation. Question selection maximize Fisher Information `I(θ) = P(1-P)`
2. **FSRS v6 Spaced Repetition** — 17 trainable parameters. Forgetting curve: `R(t,S) = (1 + 19/81 × t/S)^(-0.5)`. Stability after success/failure formulas
3. **Deep Knowledge Tracer** — BKT Bayesian update + EMA smoothing + temporal decay + cross-concept transfer learning. Zone of Proximal Development targeting ~70% success
4. **Agent Orchestrator** — Supervisor-Worker pattern tự viết (không LangGraph/CrewAI). Intent classification (rule-based + LLM fallback). 4-layer memory (Working → Short-term → Episodic → Long-term)
5. **Demo & Kết luận** — Live demo toàn bộ flow, kết quả, hạn chế, hướng phát triển

**Điểm nhấn kỹ thuật:**
- IRT vs fixed difficulty: adaptive targeting tại `θ ≈ b` (maximum information point)
- FSRS v6 vs Anki SM-2: 17-param model vs heuristic, stability-based vs interval-based
- Multi-Agent Orchestrator tự viết 100% — chứng minh không cần framework ngoài

---

## II. CẤU TRÚC 15 SLIDE (ĐÃ CHIA LẠI)

| # | Tiêu đề | Nội dung chính | Người |
|---|---------|---------------|-------|
| 1 | **Title Slide** | NeuroVault — AI Learning Platform. Tên nhóm, GVHD, ngày | 1 |
| 2 | **Motivation & Problem** | Học thụ động, không cá nhân hóa, phụ thuộc API trả phí → White-Box AI | 1 |
| 3 | **System Architecture** | Sơ đồ 3-tier: React Frontend → Node.js Gateway → FastAPI AI Core | 1 |
| 4 | **Data Ingestion Pipeline** | PDF Parser (multi-column) → Text Cleaner → Semantic Chunker | 1 |
| 5 | **Vietnamese NLP Engine** | Word Segmenter (LMF) + BPE Tokenizer + Stopword Filter | 1 |
| 6 | **LLM Infrastructure** | Ollama local inference, Circuit Breaker, retry, streaming, thinking mode | 2 |
| 7 | **RAG Pipeline** | Query Reformulation → Hybrid Retrieval → Rerank → Generate → Grounding Verify | 2 |
| 8 | **Retrieval & Reranking** | BM25 + SVD embedding → RRF Fusion → Cross-Encoder multi-signal reranking | 2 |
| 9 | **Knowledge Graph** | Concept extraction + PageRank + Louvain community + NPMI pruning | 2 |
| 10 | **Quiz Generator** | LLM-first + template fallback, Bloom's Taxonomy, source grounding verification | 2 |
| 11 | **Adaptive Quiz (IRT)** | Rasch Model, MLE ability estimation, Fisher Information selection | 3 |
| 12 | **Spaced Repetition (FSRS v6)** | 17-param scheduler, forgetting curves, DKT integration | 3 |
| 13 | **Deep Knowledge Tracer** | BKT + EMA + temporal decay + cross-concept transfer, forgetting curve | 3 |
| 14 | **Multi-Agent System** | Orchestrator + specialized agents, intent classification, 4-layer memory | 3 |
| 15 | **Demo & Conclusion** | Live demo, kết quả, hạn chế, hướng phát triển | 3 |

---

## III. NỘI DUNG CHI TIẾT TỪNG SLIDE

### Slide 1 — Title
- Logo/tên dự án: **NeuroVault — AI-Driven Learning Platform**
- Tagline: *"100% White-Box AI · Self-Hosted · Privacy-First"*
- Tên nhóm, GVHD, ngày bảo vệ

### Slide 2 — Motivation
- **Vấn đề:** (1) Học thụ động — đọc tài liệu nhưng không kiểm tra hiểu biết. (2) Không cá nhân hóa — mọi người học cùng 1 lộ trình. (3) Phụ thuộc cloud API — tốn chi phí, không kiểm soát data
- **Giải pháp:** Nền tảng AI tự viết 100%, thiết kế khép kín tối ưu tài nguyên, vận hành độc lập trên máy tính cá nhân
- **White-Box:** Mọi thuật toán có thể giải thích, debug, và trace back tới công thức toán học — không phải "black-box magic"

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
- **Text Cleaner:** `unicodedata.normalize('NFC')` → `html.unescape()` → smart quotes → control chars removal
- **Semantic Chunker:** Sliding window TF-IDF vectors → cosine similarity giữa windows liên tiếp → drop dưới `mean - std` = boundary

### Slide 5 — Vietnamese NLP
- **Word Segmenter:** Longest Match First — scan forward, thử match compound dài nhất trước
- **BPE Tokenizer:** Train loop: count pair frequencies → merge most frequent → update vocab → repeat
- **Tại sao tự viết?** VnCoreNLP/Underthesea cần Java/model lớn. LMF segmenter chỉ cần dictionary file, <1MB

### Slide 6 — LLM Infrastructure (NGƯỜI 2 BẮT ĐẦU)
- **Ollama Local:** Mô hình Qwen3 1.7B self-hosted. Zero API cost, full data privacy
- **Circuit Breaker:** `CLOSED → (5 failures) → OPEN → (60s timeout) → HALF_OPEN → (1 success) → CLOSED`
- **Retry:** Exponential backoff `delay = min(30, 2^attempt + random(0,1))` with jitter
- **Streaming & Thinking Mode:** Tách riêng quá trình "suy luận" (`<think>`) và câu trả lời chính thức
- **Connection Pooling:** `httpx.Client` với keep-alive để tối ưu overhead kết nối
- **Token Counting:** BPE Tokenizer tự viết ước lượng token (không phụ thuộc tiktoken)

### Slide 7 — RAG Pipeline
- **Query Reformulation:** Detect pronouns/ellipsis → LLM rewrite (hoặc rule-based fallback replace pronoun bằng last topic)
- **Retrieval:** Dense (SVD embedding) + Sparse (BM25) → RRF Hybrid Fusion → Cross-Encoder Rerank
- **Generation:** Assemble context + system prompt (bilingual EN/VI) + conversation memory (sliding window 3 turns)
- **Grounding Verification:** Split response thành sentences → check keyword overlap per sentence → `score > 0.5` = grounded (anti-hallucination)

### Slide 8 — Retrieval & Reranking
- **BM25:** Sparse retrieval tìm chính xác từ khóa `score(q,d) = Σ IDF(t) × (tf×(k1+1)) / (tf + k1×(1-b+b×|d|/avgdl))`
- **SVD Embedding:** Dense retrieval qua TF-IDF → Halko Randomized SVD (dim=128)
- **Vì sao không dùng BERT?** Tối ưu tốc độ (<1s cho 1000 docs) thay vì đòi hỏi tài nguyên tính toán lớn
- **RRF Fusion:** Cân bằng tín hiệu `score(d) = Σ 1/(60 + rank_i(d))`
- **Cross-Encoder (5 signals):**
  - `semantic = cosine(tfidf(q), tfidf(c))` — 35%
  - `lexical = |words(q) ∩ words(c)| / |words(q)|` — 25%
  - `position = 1/(1 + pos×0.1)` — 15%
  - `concept = |concepts(q) ∩ concepts(c)|` — 15%
  - `hybrid_prior` — 10%

### Slide 9 — Knowledge Graph
- **Concept Extraction:** TF-IDF scoring + ngram (bigram/trigram) + position/specificity bonus + LLM enhancement
- **Relation Detection:** Pattern-based (is-a, part-of, prerequisite, related) cho cả EN + VI
- **PageRank:** `PR(v) = (1-d)/N + d × Σ PR(u)×w(u,v)/out(u)` — d=0.85, max 50 iterations
- **Louvain Community:** Optimize modularity `ΔQ` — local moves until convergence
- **NPMI Pruning:** `NPMI = PMI / -log₂(P(A,B))` — giảm 435 → 60-90 edges có statistical significance

### Slide 10 — Quiz Generator
- **LLM-first strategy:** Few-shot prompt với 3 ví dụ mẫu (MCQ, fill_blank, true_false) → LLM generate full questions
- **Template fallback:** Khi LLM không khả dụng, dùng template + concept extraction
- **Bloom's Taxonomy:** difficulty 0-0.2→Remember, 0.2-0.5→Apply, 0.5-0.85→Evaluate, 0.85-1.0→Create
- **Anti-hallucination:** Source grounding verification — fill_blank answer PHẢI có trong source text, MCQ answer ≥50% keyword overlap
- **Smart Distractors:** LLM generate đáp án sai nhưng plausible, fallback dùng concept substitution

### Slide 11 — Adaptive Quiz IRT (NGƯỜI 3 BẮT ĐẦU)
- **Rasch Model:** `P(correct|θ,b) = σ(θ-b) = 1/(1+e^(-(θ-b)))`
- **MLE via Newton-Raphson:** `θ_{n+1} = θ_n + Σ(x_i - P_i) / Σ(P_i×Q_i)` — converge khi `|δ| < 0.001`
- **Question Selection:** Maximize Fisher Information `I(θ) = P×(1-P)` → chọn item có `b ≈ θ`
- **Stopping:** `SE(θ) = 1/√(ΣI(θ)) < 0.4` hoặc max 15 questions
- **DKT Integration:** Prior θ từ DeepKnowledgeTracer → warm-start IRT, không cần cold-start

### Slide 12 — Spaced Repetition (FSRS v6)
- **FSRS v6:** 17 trainable parameters `w0-w16`, tự implement 100%
- **Forgetting Curve:** `R(t,S) = (1 + 19/81 × t/S)^(-0.5)` — power law decay
- **Stability Update (success):** `S' = S × (1 + e^w6 × (11-D) × S^(-w7) × (e^((1-R)×w8) - 1) × hard/easy)`
- **Stability Update (failure):** `S' = w11 × D^(-w15×0.1) × ((S+1)^w16 - 1) × e^((1-R)×w14)`
- **Scheduler:** Priority queue by urgency = `(1-R) × overdue_factor × state_bonus × difficulty_factor`

### Slide 13 — Deep Knowledge Tracer
- **BKT Bayesian Update:** `P(mastered|correct) = (1-p_slip)×P / P_correct` + learning rate per correct
- **EMA Smoothing:** `ema = α×score + (1-α)×ema_prev` — α=0.3, smooth out noise
- **Temporal Decay:** `R = P_init + (P - P_init) × e^(-λt/stability)` — forgetting curve per concept
- **Cross-concept Transfer:** Correct answer on concept A boosts related concept B by `transfer_rate × (P_A - P_B)`
- **Learning Velocity:** `velocity = mastery_gained / hours_elapsed` — theo dõi tốc độ học

### Slide 14 — Multi-Agent System
- **Orchestrator:** Supervisor-Worker pattern (tự viết, không dùng LangGraph/CrewAI)
- **Intent Classification:** Rule-based keyword matching (score ≥ 2) → LLM fallback → default CHAT
- **Agents:** Tutor, Assessment, Feedback, Safety, Content Generation, Analytics, Path Planning
- **Memory:** 4-layer: Working (current turn) → Short-term (session) → Episodic (past sessions) → Long-term (learner facts)
- **Safety:** Content moderation agent chạy parallel, fail-open for education
- **Handoff:** Agent A → Agent B → Agent C, max depth = 3

### Slide 15 — Demo & Conclusion
- **Live Demo:** Upload PDF → Text Chunks → Knowledge Graph → Hỏi đáp RAG → Quiz Adaptive → Spaced Repetition
- **Kết quả:** Toàn bộ pipeline hoạt động độc lập, khép kín, tối ưu tài nguyên tính toán
- **Hạn chế:** SVD chưa bắt được độ sâu ngữ nghĩa như BERT; LLM 1.7B giới hạn suy luận logic phức tạp; Chưa benchmark trên dataset chuẩn
- **Hướng phát triển:** (1) Fine-tune embedding model nhỏ. (2) Collaborative learning. (3) Mobile app. (4) FSRS weight personalization per learner

---

## IV. CANVA AI PROMPT (MAGIC DESIGN)

Bạn hãy copy chính xác đoạn text dưới đây và paste vào công cụ Canva AI (Magic Design cho Presentation):

```text
Tạo cho tôi một bản thuyết trình bảo vệ đồ án tốt nghiệp chuyên ngành Công nghệ thông tin gồm 15 slide về đề tài: "NeuroVault — AI-Driven Learning Platform (Nền tảng Học tập Thông minh dựa trên AI)".

YÊU CẦU THIẾT KẾ:
- Phong cách (Style): Chuyên nghiệp, mang tính học thuật cao, tập trung vào công nghệ, gọn gàng, và hiện đại (Academic, tech-focused, clean, modern).
- Bảng màu (Color Palette): Nền sáng (White background) kết hợp Minimalist Gray để dễ đọc. Các màu nhấn (Accent colors) là Deep Blue (xanh dương đậm) và Tech Teal (xanh lơ công nghệ).
- Layout: Bố cục tối giản, rõ ràng. Dành không gian (white-space) để tôi có thể chèn các sơ đồ kiến trúc (block diagrams) và công thức toán học. Sử dụng font chữ hiện đại (như Inter hoặc Roboto). Không dùng quá nhiều chữ.

CẤU TRÚC 15 SLIDE BẮT BUỘC (Slide Titles):
Vui lòng sử dụng chính xác các tiêu đề tiếng Anh dưới đây và tự động sinh layout phù hợp cho 3 người báo cáo:
1. Title Slide: NeuroVault — AI-Driven Learning Platform
2. Motivation & Problem Statement
3. System Architecture (3-Tier Design)
4. Data Ingestion Pipeline
5. Vietnamese NLP Engine
6. Local LLM Infrastructure
7. RAG Pipeline Architecture
8. Hybrid Retrieval & Cross-Encoder Reranking
9. Knowledge Graph Construction
10. Automated Quiz Generator
11. Adaptive Learning with IRT (Item Response Theory)
12. Spaced Repetition (FSRS v6 Algorithm)
13. Deep Knowledge Tracer (DKT)
14. Multi-Agent System Orchestration
15. Demo, Limitations & Future Work

Vui lòng sinh nội dung giả định (placeholder) phù hợp với lĩnh vực AI/Machine Learning cho từng slide để tôi dễ dàng điền nội dung chi tiết sau.
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
