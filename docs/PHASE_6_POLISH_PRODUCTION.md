# 🚀 PHA 6: POLISH & PRODUCTION (Tuần 20-24)

> **Mục tiêu:** Hoàn thiện UI/UX premium, tối ưu hiệu năng, bảo mật, production-ready
> **Trạng thái:** ⚪ Chờ (phụ thuộc Pha 5)
> **Prerequisite:** Pha 5 hoàn thành 100%

---

## 6.1 TỔNG QUAN

Pha 6 là pha biến sản phẩm từ "functional" thành "exceptional". Đây là pha quyết định ấn tượng đầu tiên của user.

```
┌────────────────────────────────────────────────────┐
│                   PHA 6                             │
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────────┐│
│  │  🎨 UI REDESIGN   │  │  ⚡ PERFORMANCE          ││
│  │  - Dark mode      │  │  - Model quantization   ││
│  │  - Micro-animations│  │  - Response caching     ││
│  │  - 3D Knowledge   │  │  - Lazy loading         ││
│  │    Graph         │  │  - Code splitting       ││
│  └──────────────────┘  └──────────────────────────┘│
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────────┐│
│  │  🔒 SECURITY      │  │  📱 RESPONSIVE           ││
│  │  - XSS prevention │  │  - Mobile layout        ││
│  │  - CSRF tokens    │  │  - Touch gestures       ││
│  │  - Rate limiting  │  │  - PWA support          ││
│  │  - Input sanitize │  │  - Offline mode         ││
│  └──────────────────┘  └──────────────────────────┘│
│                                                     │
│  ┌──────────────────┐  ┌──────────────────────────┐│
│  │  🧪 TESTING       │  │  📊 MONITORING           ││
│  │  - E2E tests      │  │  - Error tracking       ││
│  │  - Load tests     │  │  - Performance metrics  ││
│  │  - AI quality     │  │  - User analytics       ││
│  └──────────────────┘  └──────────────────────────┘│
└────────────────────────────────────────────────────┘
```

---

## 6.2 UI REDESIGN — PREMIUM DARK MODE

### Design System:

```css
/* Color Palette — Dark Mode */
:root {
  /* Background layers */
  --bg-primary: #0a0a0f;      /* Deepest background */
  --bg-secondary: #12121a;     /* Card backgrounds */
  --bg-tertiary: #1a1a2e;      /* Elevated surfaces */
  --bg-hover: #222238;          /* Hover states */

  /* Accent colors — Neural theme */
  --accent-primary: #7c3aed;   /* Purple — primary actions */
  --accent-secondary: #06b6d4; /* Cyan — secondary/info */
  --accent-success: #10b981;   /* Green — success/mastery */
  --accent-warning: #f59e0b;   /* Amber — warning/medium mastery */
  --accent-danger: #ef4444;    /* Red — danger/low mastery */

  /* Neural glow effects */
  --glow-purple: 0 0 20px rgba(124, 58, 237, 0.3);
  --glow-cyan: 0 0 20px rgba(6, 182, 212, 0.3);
  --glow-green: 0 0 15px rgba(16, 185, 129, 0.2);

  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #475569;

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-interactive: rgba(124, 58, 237, 0.3);

  /* Glass effect */
  --glass-bg: rgba(18, 18, 26, 0.8);
  --glass-blur: blur(16px);

  /* Typography */
  --font-sans: 'Inter', 'Noto Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: var(--glow-purple);
}
```

### Micro-Animations:

```css
/* Page transitions */
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Neural pulse (for KG nodes) */
@keyframes neuralPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(124, 58, 237, 0); }
}

/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}

/* Card hover lift */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

/* Smooth number counter */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 6.3 NEURAL DASHBOARD (3D Knowledge Graph)

### Công nghệ: D3.js Force-Directed + Canvas Performance

```javascript
// Neural Dashboard features:
const dashboardFeatures = {
  knowledgeGraph: {
    // 3D-like force-directed graph
    nodeSize: 'proportional to PageRank centrality',
    nodeColor: 'gradient based on mastery (red → yellow → green)',
    nodeGlow: 'pulsing animation for nodes due for review',
    edgeThickness: 'proportional to relation strength',
    edgeColor: 'matches source node color',
    labels: 'shown on hover, truncated to 20 chars',
    zoom: 'scroll to zoom, drag to pan',
    click: 'expand node → show definition + related chunks',
    search: 'type to highlight + zoom to node',
    clusters: 'visually grouped by topic (Louvain communities)',
    legend: 'color scale + mastery levels explained',
  },

  strengthHeatmap: {
    // Grid of concepts, color-coded by mastery
    layout: 'treemap or grid',
    color: 'hsl(mastery * 120, 70%, 50%)', // red=0 → green=120
    size: 'proportional to concept importance',
    tooltip: 'concept name + mastery % + next review date',
  },

  statsCards: {
    totalConcepts: 'animated counter',
    masteryAverage: 'circular progress + animated fill',
    studyStreak: 'flame icon + day count',
    dueReviews: 'badge with urgency coloring',
    learningVelocity: 'trend arrow + sparkline',
  },

  reviewForecast: {
    // Calendar heatmap (giống GitHub contribution graph)
    layout: '7×52 grid (1 year)',
    color: 'intensity = number of reviews due',
    tooltip: 'date + expected review count',
  },
};
```

---

## 6.4 DOCUMENT STUDIO

### PDF Viewer + AI Annotations

```javascript
// Document Studio features:
const studioFeatures = {
  pdfViewer: {
    renderer: 'PDF.js (Mozilla, open-source, local)',
    zoom: 'fit-width, fit-page, custom zoom',
    navigation: 'page thumbnails sidebar',
    textSelection: 'native text selection',
  },

  aiAnnotations: {
    conceptHighlight: 'auto-highlight concepts trong text (màu theo mastery)',
    definitionTooltip: 'hover concept → show definition from KG',
    relatedConcepts: 'click concept → sidebar hiện related concepts',
    summaryPanel: 'AI-generated summary cho mỗi section',
    keyPointsExtraction: 'bullet points key takeaways',
  },

  splitView: {
    layout: 'PDF bên trái + AI Chat bên phải (resizable)',
    sync: 'chat context tự động cập nhật theo page đang xem',
  },
};
```

---

## 6.5 PERFORMANCE OPTIMIZATION

### A. Model Quantization (INT8)

```python
class ModelQuantizer:
    """Quantize GPT-nano từ FP32 → INT8 cho inference nhanh hơn."""

    def quantize_onnx(self, model_path: str, output_path: str):
        from onnxruntime.quantization import quantize_dynamic, QuantType

        quantize_dynamic(
            model_input=model_path,
            model_output=output_path,
            weight_type=QuantType.QInt8,
            optimize_model=True,
        )
        # Kết quả:
        # - Model size giảm ~4x (50MB → ~13MB)
        # - Inference speed tăng ~2x trên CPU
        # - Quality drop < 2% perplexity
```

### B. Response Caching

```python
class ResponseCache:
    """In-memory LRU cache cho AI responses."""

    def __init__(self, max_size=1000, ttl_seconds=3600):
        self.cache = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl_seconds

    def get(self, query_hash: str) -> Optional[dict]:
        if query_hash in self.cache:
            entry = self.cache[query_hash]
            if time.time() - entry['timestamp'] < self.ttl:
                # Move to end (most recently used)
                self.cache.move_to_end(query_hash)
                return entry['response']
            else:
                del self.cache[query_hash]
        return None

    def set(self, query_hash: str, response: dict):
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)  # Remove oldest
        self.cache[query_hash] = {
            'response': response,
            'timestamp': time.time(),
        }
```

### C. Frontend Performance

```javascript
// Vite code splitting + lazy loading
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DocumentDetail = lazy(() => import('./pages/DocumentDetail'));
const QuizArena = lazy(() => import('./pages/QuizArena'));
const KnowledgeExplorer = lazy(() => import('./pages/KnowledgeExplorer'));
const Analytics = lazy(() => import('./pages/Analytics'));
const FlashcardDeck = lazy(() => import('./pages/FlashcardDeck'));

// Virtualized lists cho large datasets
// - react-window cho document list (1000+ documents)
// - Canvas rendering cho Knowledge Graph (1000+ nodes)

// Image optimization
// - WebP format cho all images
// - Lazy loading + Intersection Observer

// Bundle analysis target:
// - Initial JS bundle < 200KB gzipped
// - First Contentful Paint < 1.5s
// - Time to Interactive < 3s
```

---

## 6.6 SECURITY

### Checklist:

| Vấn đề | Giải pháp |
|---|---|
| XSS (Cross-Site Scripting) | DOMPurify cho user input, React auto-escaping, CSP headers |
| CSRF | SameSite cookies, CSRF token trên mutation requests |
| SQL/NoSQL Injection | Mongoose parameterized queries, input validation (Joi/Zod) |
| File Upload Security | Whitelist extensions (pdf, txt, docx), max file size (50MB), virus scan |
| JWT Security | HttpOnly cookies, short expiry (15min) + refresh token, rotate secrets |
| Rate Limiting | express-rate-limit: 100 req/15min per IP, 20 req/min cho AI endpoints |
| CORS | Whitelist specific origins, no wildcard in production |
| Sensitive Data | bcrypt (cost factor 12) cho passwords, env vars cho secrets |
| Dependencies | npm audit, triển khai Dependabot/Snyk |
| Headers | Helmet.js: X-Content-Type-Options, X-Frame-Options, HSTS |

---

## 6.7 RESPONSIVE DESIGN

### Breakpoints:

```css
/* Mobile first approach */
/* Default: Mobile (< 640px) */
/* sm: ≥ 640px — Tablet portrait */
/* md: ≥ 768px — Tablet landscape */
/* lg: ≥ 1024px — Desktop */
/* xl: ≥ 1280px — Large desktop */

/* Key layout changes: */
/* Mobile: sidebar → bottom navigation bar */
/* Tablet: sidebar collapsible */
/* Desktop: sidebar always visible */

/* Knowledge Graph: */
/* Mobile: simplified list view instead of force graph */
/* Tablet: 2D force graph */
/* Desktop: full interactive graph with sidepanel */

/* Document Studio: */
/* Mobile: single panel (PDF or Chat, toggle) */
/* Desktop: split view (PDF left + Chat right) */
```

---

## 6.8 PWA (Progressive Web App)

```javascript
// Service Worker cho offline support
// Có thể install trên home screen
// Offline: xem flashcards đã cache, review concepts đã tải

// manifest.json
{
  "name": "NEUROVAULT — AI Learning Platform",
  "short_name": "NEUROVAULT",
  "description": "Neuromorphic Adaptive Learning Platform",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 6.9 TESTING

### A. End-to-End Tests

```javascript
// Playwright E2E tests
const tests = {
  auth: [
    'Register → Login → Dashboard redirect',
    'Invalid credentials → error message',
    'Logout → redirect to login',
    'Token expired → auto refresh',
  ],
  documents: [
    'Upload PDF → processing → view document',
    'Delete document → confirm → removed from list',
    'Search within document → relevant results',
  ],
  chat: [
    'Send message → receive AI response',
    'Streaming tokens appear sequentially',
    'Source citations are clickable',
  ],
  quiz: [
    'Generate quiz → 10 questions displayed',
    'Answer question → immediate feedback',
    'Complete quiz → score summary + mastery update',
  ],
  flashcards: [
    'Due cards shown → flip → rate → next card',
    'No due cards → message shown',
    'After review → next review date updated in DB',
  ],
};
```

### B. AI Quality Tests

```python
# Automated quality checks cho AI outputs

class AIQualityTests:
    def test_retrieval_quality(self):
        """MRR > 0.5 trên test queries."""
        test_queries = load_test_queries()  # 100 curated queries
        mrr = evaluate_mrr(self.retriever, test_queries)
        assert mrr > 0.5, f"MRR too low: {mrr}"

    def test_generation_coherence(self):
        """Generated text phải coherent (perplexity < 50)."""
        test_prompts = load_test_prompts()
        for prompt in test_prompts:
            output = self.gpt_nano.generate(prompt)
            perplexity = compute_perplexity(output)
            assert perplexity < 50, f"Perplexity too high: {perplexity}"

    def test_quiz_quality(self):
        """MCQ distractors phải khác correct answer."""
        for _ in range(50):
            question = self.quiz_gen.generate_mcq(random_concept())
            assert question.correct_answer not in question.distractors
            assert len(set(question.distractors)) == len(question.distractors)

    def test_sr_scheduling(self):
        """SM-2+ intervals phải tăng dần khi trả lời đúng liên tục."""
        mastery = MasteryState.new()
        intervals = []
        for _ in range(10):
            next_review = self.sr.calculate_next_review(mastery, 0.3, 1.0, 0.0)
            interval = (next_review - datetime.utcnow()).days
            intervals.append(interval)
            mastery.review_count += 1
            mastery.level += 0.1
        # Intervals should be increasing
        assert all(intervals[i] <= intervals[i+1] for i in range(len(intervals)-1))
```

### C. Load Testing

```bash
# Artillery.io hoặc k6 cho load testing
# Target: 100 concurrent users, < 500ms response time

# Scenarios:
# 1. 100 users login simultaneously
# 2. 50 users upload documents simultaneously
# 3. 100 users send chat messages simultaneously
# 4. 50 users generate quizzes simultaneously
# 5. 100 users do flashcard reviews simultaneously
```

---

## 6.10 USER ONBOARDING

```
Step 1: Welcome screen — "Chào mừng đến với NEUROVAULT"
Step 2: Upload first document — "Tải lên tài liệu đầu tiên của bạn"
Step 3: AI processes document — "AI đang phân tích..." (animated progress)
Step 4: Knowledge Graph reveal — "Đây là bản đồ tri thức của bạn!" (animated graph appear)
Step 5: First quiz — "Hãy thử trả lời câu hỏi đầu tiên"
Step 6: Dashboard tour — highlight key features
Step 7: Setup study schedule — "Bạn muốn ôn tập bao nhiêu phút/ngày?"
```

---

## 6.11 MONITORING & LOGGING

```python
# Structured logging (Python)
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'module': record.module,
            'message': record.getMessage(),
            'user_id': getattr(record, 'user_id', None),
            'request_id': getattr(record, 'request_id', None),
            'duration_ms': getattr(record, 'duration_ms', None),
        }
        return json.dumps(log_data)

# Key metrics to track:
# - AI inference latency (p50, p95, p99)
# - Retrieval quality (MRR, Recall@5) per day
# - Quiz generation time
# - Model memory usage
# - Cache hit rate
# - Active users / day
# - Documents processed / day
# - Average study time / user / day
```

---

## 6.12 ACCEPTANCE CRITERIA (FINAL)

- [ ] Dark mode hoàn chỉnh, nhất quán trên TOÀN BỘ pages
- [ ] Micro-animations smooth (60fps), không janky
- [ ] Neural Dashboard render Knowledge Graph > 500 nodes smoothly
- [ ] Document Studio: PDF viewer + AI annotations hoạt động
- [ ] Mobile responsive: tất cả pages usable trên 375px width
- [ ] GPT-nano INT8 inference < 100ms cho 50 token generation
- [ ] All API endpoints < 500ms response time under 50 concurrent users
- [ ] Security: pass OWASP Top 10 checklist
- [ ] E2E tests: 95%+ pass rate
- [ ] AI quality tests: all assertions pass
- [ ] Lighthouse score: Performance > 80, Accessibility > 90
- [ ] User onboarding flow hoàn chỉnh, dẫn dắt tốt

---

## 6.13 DEFINITION OF DONE (Toàn dự án)

Khi tất cả criteria sau đều TRUE → dự án HOÀN THÀNH:

| # | Criteria | Status |
|---|---|---|
| 1 | User có thể register, login, upload document | ⬜ |
| 2 | AI parse PDF → clean text → semantic chunks tự động | ⬜ |
| 3 | Hybrid search (BM25 + Dense) trả kết quả chính xác | ⬜ |
| 4 | Knowledge Graph sinh tự động + hiển thị interactive | ⬜ |
| 5 | AI chat trả lời câu hỏi dựa trên document (RAG) | ⬜ |
| 6 | Streaming response hiển thị token-by-token | ⬜ |
| 7 | Quiz sinh tự động từ KG + smart distractors | ⬜ |
| 8 | Flashcard + SM-2+ scheduling hoạt động chính xác | ⬜ |
| 9 | Learning path: prerequisite ordering + interleaving | ⬜ |
| 10 | Analytics dashboard hiển thị đầy đủ metrics | ⬜ |
| 11 | Dark mode premium + micro-animations | ⬜ |
| 12 | Responsive trên mobile + tablet + desktop | ⬜ |
| 13 | Security: JWT, rate limiting, input sanitization | ⬜ |
| 14 | 0 API bên thứ 3 nào được sử dụng | ⬜ |
| 15 | Tất cả thuật toán AI là white-box, tự viết | ⬜ |

---

*Khi bảng trên ALL ✅ → NEUROVAULT v1.0 sẵn sàng ra mắt.*
