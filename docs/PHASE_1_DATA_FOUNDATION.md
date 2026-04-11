# 🔧 PHA 1: DATA FOUNDATION (Tuần 1-3)

> **Mục tiêu:** Xây nền móng dữ liệu — backend infrastructure, database, tiền xử lý tài liệu
> **Trạng thái:** 🟡 Chưa bắt đầu

---

## 1.1 TỔNG QUAN

Pha 1 là nền tảng cho mọi thứ phía sau. Không có data foundation vững chắc thì không có AI nào hoạt động được.

### Input → Output:
```
[PDF / TXT / DOCX / Image] → PDF Parser → Text Cleaner → Sentence Splitter 
    → Language Detector → Semantic Chunker → [Clean Chunks + Metadata] → MongoDB
```

---

## 1.2 BACKEND INFRASTRUCTURE

### Node.js Express Server

```
backend/server/
├── index.js                  # Entry point, CORS, middleware
├── config/
│   ├── db.js                 # MongoDB connection (mongoose.connect)
│   └── env.js                # dotenv config
├── middleware/
│   ├── auth.js               # JWT verification middleware
│   ├── rateLimiter.js        # express-rate-limit
│   ├── upload.js             # multer config cho file upload
│   └── errorHandler.js       # Global error handler
├── routes/
│   ├── auth.routes.js        # POST /register, POST /login, POST /refresh
│   └── document.routes.js    # CRUD + upload
├── controllers/
│   ├── auth.controller.js
│   └── document.controller.js
├── models/
│   ├── User.model.js
│   ├── Document.model.js
│   ├── KnowledgeNode.model.js
│   └── QuizSession.model.js
├── services/
│   └── aiProxy.js            # HTTP call tới Python AI server
├── package.json
└── .env
```

### Packages cần cài:
```bash
npm init -y
npm install express mongoose bcryptjs jsonwebtoken dotenv cors multer express-rate-limit helmet
npm install -D nodemon
```

### Python AI Core

```
backend/ai_core/
├── preprocessing/
│   ├── __init__.py
│   ├── pdf_parser.py
│   ├── text_cleaner.py
│   ├── sentence_splitter.py
│   ├── language_detector.py
│   └── semantic_chunker.py
├── api/
│   └── ai_server.py          # FastAPI entry point
├── requirements.txt
├── tests/
│   ├── test_pdf_parser.py
│   ├── test_text_cleaner.py
│   ├── test_sentence_splitter.py
│   └── test_semantic_chunker.py
└── README.md
```

### Python packages (requirements.txt):
```
fastapi==0.109.0
uvicorn==0.27.0
pymupdf==1.23.8
pytesseract==0.3.10
numpy==1.26.3
scipy==1.12.0
pytest==7.4.4
requests==2.31.0
pydantic==2.5.3
```

---

## 1.3 DATABASE SCHEMAS (MongoDB + Mongoose)

### User Schema
```javascript
const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  neural_profile: {
    knowledge_graph_id: { type: Schema.Types.ObjectId, ref: 'KnowledgeNode' },
    learning_velocity: { type: Number, default: 1.0 },
    forgetting_params: {
      decay_rate: { type: Number, default: 0.3 },
      stability_factor: { type: Number, default: 1.0 },
    },
    total_concepts_mastered: { type: Number, default: 0 },
    total_study_time_minutes: { type: Number, default: 0 },
  },
}, { timestamps: true });
```

### Document Schema
```javascript
const documentSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  original_filename: { type: String },
  file_path: { type: String },
  raw_text: { type: String },
  language: { type: String, enum: ['vi', 'en', 'mixed'], default: 'en' },
  chunks: [{
    chunk_id: String,
    text: String,
    embedding_vector: [Number],
    sparse_vector: Schema.Types.Mixed,  // {term: tfidf_score}
    concepts: [String],
    position: Number,
    char_start: Number,
    char_end: Number,
  }],
  metadata: {
    word_count: Number,
    page_count: Number,
    processing_status: { 
      type: String, 
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
  },
}, { timestamps: true });
```

---

## 1.4 PREPROCESSING PIPELINE — CHI TIẾT THUẬT TOÁN

### A. PDF Parser (`pdf_parser.py`)

**Thư viện**: PyMuPDF (fitz) — open-source, chạy local

**Thuật toán:**
1. Mở file PDF bằng `fitz.open()`
2. Iterate qua từng page → extract text blocks
3. **Layout Analysis heuristic:**
   - Detect multi-column: so sánh x-coordinate clusters của text blocks
   - Nếu có 2+ column → merge text theo reading order (top-to-bottom per column, left-to-right)
4. Extract metadata: title (font size lớn nhất ở page 1), page count, images
5. Fallback: nếu text empty → flag cho OCR

```python
class PDFParser:
    def parse(self, file_path: str) -> ParsedDocument:
        doc = fitz.open(file_path)
        full_text = []
        
        for page_num, page in enumerate(doc):
            blocks = page.get_text("dict")["blocks"]
            # Sort blocks by column detection + reading order
            sorted_blocks = self._sort_by_reading_order(blocks, page.rect.width)
            page_text = self._extract_text_from_blocks(sorted_blocks)
            full_text.append(page_text)
        
        return ParsedDocument(
            text="\n\n".join(full_text),
            page_count=len(doc),
            title=self._extract_title(doc[0]),
            has_images=self._check_images(doc),
            needs_ocr=len("".join(full_text).strip()) < 50,
        )
```

### B. Text Cleaner (`text_cleaner.py`)

**100% tự viết, không dùng thư viện NLP:**
1. **Unicode Normalization:** NFC form (đảm bảo "ủ" là 1 codepoint, không phải "u" + combining mark)
2. **HTML Entity Decode:** `&amp;` → `&`, `&#39;` → `'`
3. **Whitespace Collapse:** Multiple spaces/tabs → single space, multiple newlines → double newline
4. **Special Character Filtering:** Giữ lại chữ, số, dấu câu, dấu tiếng Việt. Loại control characters
5. **Hyphenation Fix:** "knowl-\nedge" → "knowledge"

```python
class TextCleaner:
    def clean(self, text: str) -> str:
        text = unicodedata.normalize('NFC', text)
        text = html.unescape(text)
        text = self._fix_hyphenation(text)
        text = self._collapse_whitespace(text)
        text = self._remove_control_chars(text)
        text = self._normalize_punctuation(text)
        return text.strip()
```

### C. Sentence Splitter (`sentence_splitter.py`)

**Hybrid approach:**
1. **Rule-based:** Split tại `.` `?` `!` nhưng KHÔNG split tại abbreviations (Dr., Mr., vs., etc.)
2. **Vietnamese-aware:** Nhận diện câu tiếng Việt (kết thúc bằng `.` sau từ tiếng Việt)
3. **List detection:** Nếu dòng bắt đầu bằng `1.`, `a)`, `-`, `•` → giữ nguyên, không merge

```python
class SentenceSplitter:
    ABBREVIATIONS = {'dr', 'mr', 'mrs', 'ms', 'prof', 'sr', 'jr', 'vs', 'etc', 'e.g', 'i.e'}
    
    def split(self, text: str) -> list[str]:
        # Phase 1: Protect abbreviations
        protected = self._protect_abbreviations(text)
        # Phase 2: Split at sentence boundaries
        raw_sentences = self._split_at_boundaries(protected)
        # Phase 3: Restore abbreviations
        sentences = [self._restore_abbreviations(s) for s in raw_sentences]
        # Phase 4: Filter empty
        return [s.strip() for s in sentences if s.strip()]
```

### D. Language Detector (`language_detector.py`)

**Thuật toán: Character Trigram Frequency Fingerprinting**
1. Tạo frequency profile của character trigrams trong input text
2. So sánh (cosine similarity) với pre-computed profiles của Vietnamese, English
3. Language = profile có similarity cao nhất
4. Nếu cả 2 > threshold → "mixed"

```python
class LanguageDetector:
    def __init__(self):
        # Pre-computed trigram profiles (từ Wikipedia corpus)
        self.profiles = {
            'vi': self._load_profile('vi_trigrams.json'),
            'en': self._load_profile('en_trigrams.json'),
        }
    
    def detect(self, text: str) -> str:
        text_profile = self._compute_trigram_profile(text)
        scores = {}
        for lang, ref_profile in self.profiles.items():
            scores[lang] = self._cosine_similarity(text_profile, ref_profile)
        
        if scores['vi'] > 0.3 and scores['en'] > 0.3:
            return 'mixed'
        return max(scores, key=scores.get)
```

### E. Semantic Chunker (`semantic_chunker.py`)

**Thuật toán: Sliding Window + Cosine Similarity Drop Detection**

> Thay vì chunk cứng nhắc (mỗi 500 từ), NEUROVAULT detect "semantic boundaries" — nơi topic thay đổi.

1. Tạo sliding windows (kích thước W sentences, step S sentences)
2. Với mỗi cặp window liên tiếp, tính cosine similarity (dùng TF-IDF vector đơn giản)
3. Nếu similarity giảm > threshold → đó là chunk boundary
4. Post-process: merge chunks quá ngắn (< 50 words), split chunks quá dài (> 500 words)

```python
class SemanticChunker:
    def __init__(self, window_size=5, similarity_threshold=0.3):
        self.window_size = window_size
        self.threshold = similarity_threshold
    
    def chunk(self, sentences: list[str]) -> list[Chunk]:
        # 1. Compute TF-IDF vectors cho mỗi window
        windows = self._create_windows(sentences)
        vectors = [self._tfidf_vector(w) for w in windows]
        
        # 2. Find similarity drops
        boundaries = []
        for i in range(1, len(vectors)):
            sim = self._cosine_similarity(vectors[i-1], vectors[i])
            if sim < self.threshold:
                boundaries.append(i * self.step_size)
        
        # 3. Create chunks from boundaries
        chunks = self._create_chunks_from_boundaries(sentences, boundaries)
        
        # 4. Post-process: merge short, split long
        return self._post_process(chunks)
```

---

## 1.5 API ENDPOINTS (Pha 1)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký user mới |
| POST | `/api/auth/login` | Đăng nhập → JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |
| POST | `/api/documents/upload` | Upload file → trigger processing |
| GET | `/api/documents` | List documents của user |
| GET | `/api/documents/:id` | Chi tiết 1 document |
| DELETE | `/api/documents/:id` | Xóa document |
| GET | `/api/documents/:id/status` | Trạng thái processing |

---

## 1.6 ACCEPTANCE CRITERIA

- [ ] Có thể upload 1 file PDF → hệ thống parse ra text sạch
- [ ] Text được chunk thành các semantic segments
- [ ] Chunks lưu vào MongoDB với metadata đầy đủ
- [ ] Frontend đăng ký → đăng nhập → thấy dashboard với documents thật
- [ ] Unit test pass 100% cho preprocessing pipeline
- [ ] Xử lý được cả PDF tiếng Việt và tiếng Anh

---

## 1.7 CHUẨN BỊ CHO PHA 2

Sau khi hoàn thành Pha 1, chuẩn bị:
- Corpus Wikipedia dumps (VI + EN) → cho training embedding + tokenizer ở Pha 2
- Đảm bảo chunking quality tốt → ảnh hưởng trực tiếp tới retrieval quality
