# 🎯 PHA 5: LEARNING INTELLIGENCE (Tuần 16-19)

> **Mục tiêu:** Xây hệ thống học tập thông minh — Spaced Repetition, Quiz Generator, Learning Path
> **Trạng thái:** ⚪ Chờ (phụ thuộc Pha 4)
> **Prerequisite:** Pha 4 hoàn thành 100%

---

## 5.1 TỔNG QUAN

Pha 5 biến NEUROVAULT từ một "công cụ đọc tài liệu thông minh" thành một **hệ thống gia sư AI** thực sự. Đây là nơi "chất riêng" của NEUROVAULT được thể hiện rõ nhất.

```
┌────────────────────────────────────────────────────┐
│              LEARNING INTELLIGENCE                  │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Neural Profile  │  │  Cognitive Load           │ │
│  │  Engine          │  │  Estimator                │ │
│  │  (per-user KG    │  │  (response time →         │ │
│  │   + forgetting   │  │   mental fatigue)         │ │
│  │   curve)         │  │                           │ │
│  └────────┬────────┘  └────────────┬──────────────┘ │
│           │                        │                 │
│           ▼                        ▼                 │
│  ┌─────────────────┐  ┌──────────────────────────┐ │
│  │  Enhanced SM-2+  │  │  Quiz Generator           │ │
│  │  Spaced          │←─│  (MCQ, Fill-blank,        │ │
│  │  Repetition      │  │   True/False, Socratic)  │ │
│  └────────┬────────┘  └──────────────────────────┘ │
│           │                                         │
│           ▼                                         │
│  ┌──────────────────────────────────────────────┐  │
│  │  Learning Path Optimizer                      │  │
│  │  (Topological Sort + Interleaving +          │  │
│  │   Mastery-based Re-ordering)                 │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 5.2 NEURAL PROFILE ENGINE

### Mỗi user = một "bộ não ảo"

```python
class NeuralProfile:
    """
    Neural Profile theo dõi TOÀN BỘ quá trình học tập của một user.
    Được cập nhật sau mỗi interaction (quiz, review, chat).
    """

    def __init__(self, user_id: str):
        self.user_id = user_id

        # Knowledge Graph cá nhân (subgraph của document KG)
        self.personal_kg = nx.DiGraph()

        # Forgetting parameters (cá nhân hóa)
        self.decay_rate = 0.3        # Tốc độ quên (0=không quên, 1=quên nhanh)
        self.stability_factor = 1.0  # Hệ số ổn định bộ nhớ

        # Concept mastery tracking
        self.concept_mastery = {}  # {concept_id: MasteryState}

        # Learning velocity (tốc độ tiếp thu)
        self.learning_velocity = 1.0  # 1.0 = trung bình, >1 = nhanh, <1 = chậm

        # Session tracking
        self.current_cognitive_load = 0.0  # 0.0 - 1.0
        self.session_start_time = None
        self.total_study_minutes = 0

    def update_after_review(self, concept_id: str, response_quality: int, time_taken_ms: int):
        """Cập nhật profile sau mỗi lần ôn tập / trả lời câu hỏi."""
        mastery = self.concept_mastery.get(concept_id, MasteryState.new())

        # 1. Update mastery level
        if response_quality >= 4:
            mastery.level = min(1.0, mastery.level + 0.1 * (response_quality / 5))
        else:
            mastery.level = max(0.0, mastery.level - 0.15 * (5 - response_quality) / 5)

        # 2. Update ease factor (SM-2 style)
        mastery.ease_factor += 0.1 - (5 - response_quality) * (0.08 + (5 - response_quality) * 0.02)
        mastery.ease_factor = max(1.3, mastery.ease_factor)

        # 3. Update review count
        mastery.review_count += 1
        mastery.last_reviewed = datetime.utcnow()

        # 4. Update cognitive load estimate
        expected_time = self._expected_response_time(concept_id)
        if time_taken_ms > expected_time * 2:
            self.current_cognitive_load = min(1.0, self.current_cognitive_load + 0.1)
        elif time_taken_ms < expected_time * 0.5:
            self.current_cognitive_load = max(0.0, self.current_cognitive_load - 0.05)

        # 5. Update learning velocity
        self._update_learning_velocity(response_quality, time_taken_ms)

        # 6. Schedule next review
        mastery.next_review = self.sr_engine.calculate_next_review(
            mastery, self.decay_rate, self.stability_factor, self.current_cognitive_load
        )

        self.concept_mastery[concept_id] = mastery

    def get_strength_map(self) -> dict:
        """Trả về bản đồ sức mạnh tri thức cho visualization."""
        return {
            cid: {
                'level': m.level,
                'status': 'strong' if m.level > 0.7 else 'medium' if m.level > 0.4 else 'weak',
                'next_review': m.next_review.isoformat() if m.next_review else None,
                'review_count': m.review_count,
            }
            for cid, m in self.concept_mastery.items()
        }

    def get_due_reviews(self, limit=20) -> list:
        """Lấy danh sách concepts cần ôn tập HÔM NAY."""
        now = datetime.utcnow()
        due = []
        for cid, mastery in self.concept_mastery.items():
            if mastery.next_review and mastery.next_review <= now:
                due.append((cid, mastery))
        # Sort: overdue nhiều nhất → ưu tiên cao nhất
        due.sort(key=lambda x: x[1].next_review)
        return due[:limit]


class MasteryState:
    """Trạng thái mastery cho một concept."""

    def __init__(self):
        self.level = 0.0             # 0.0 - 1.0
        self.ease_factor = 2.5       # SM-2 ease factor
        self.review_count = 0
        self.last_reviewed = None
        self.next_review = None
        self.stability = 1.0         # Memory stability (half-life regression)
        self.consecutive_correct = 0

    @classmethod
    def new(cls):
        return cls()
```

---

## 5.3 ENHANCED SPACED REPETITION (SM-2+ CẢI TIẾN)

### So sánh SM-2 gốc vs NEUROVAULT SM-2+:

| Tính năng | SM-2 (SuperMemo) | NEUROVAULT SM-2+ |
|---|---|---|
| Ease factor | Toàn cục, tĩnh | **Cá nhân hóa, động** |
| Forgetting curve | Cố định | **Cá nhân hóa (half-life regression)** |
| Interference | Không xét | **Cross-concept interference modeling** |
| Cognitive load | Không xét | **Điều chỉnh interval theo cognitive load** |
| Interleaving | Không | **Xen kẽ chủ đề để tăng retention** |

```python
class SpacedRepetitionEngine:
    """
    Enhanced SM-2+ Algorithm — cải tiến trên SuperMemo SM-2.
    100% tự viết, white-box.
    """

    def calculate_next_review(self, mastery: MasteryState,
                               user_decay_rate: float,
                               user_stability: float,
                               cognitive_load: float) -> datetime:
        """
        Tính thời điểm ôn tập tiếp theo.

        Công thức core:
        half_life = stability * ease_factor^(review_count * 0.5)
        interval = -half_life * ln(target_retention) / ln(2)

        Với điều chỉnh:
        - interference_penalty: giảm half_life nếu concepts liên quan đang yếu
        - cognitive_load_factor: tăng interval khi user mệt
        """

        # 1. Base half-life (in days)
        base_half_life = mastery.stability * (mastery.ease_factor ** (mastery.review_count * 0.5))

        # 2. User-specific decay adjustment
        decay_multiplier = 1.0 / (1.0 + user_decay_rate)
        half_life = base_half_life * decay_multiplier * user_stability

        # 3. Interference penalty
        #    (computed externally from Knowledge Graph — concepts liên quan yếu kéo xuống)
        # interference = self._compute_interference(concept, user_kg)
        # half_life *= (1 - interference * 0.15)

        # 4. Cognitive load adjustment
        if cognitive_load > 0.7:
            half_life *= (1 + (cognitive_load - 0.7) * 0.5)  # Nới lỏng khi mệt

        # 5. Compute interval
        target_retention = 0.85  # Target 85% recall probability
        interval_days = -half_life * math.log(target_retention) / math.log(2)
        interval_days = max(0.5, min(365, interval_days))  # Clamp: 12 giờ → 1 năm

        # 6. Add jitter (±10%) để tránh review cùng lúc quá nhiều
        jitter = interval_days * random.uniform(-0.1, 0.1)
        interval_days += jitter

        return datetime.utcnow() + timedelta(days=interval_days)

    def estimate_retention(self, mastery: MasteryState, elapsed_days: float) -> float:
        """
        Ước tính xác suất nhớ tại thời điểm hiện tại.
        Forgetting curve: R(t) = 2^(-t / half_life)
        """
        if mastery.review_count == 0:
            return 0.0

        half_life = mastery.stability * (mastery.ease_factor ** (mastery.review_count * 0.5))
        retention = 2 ** (-elapsed_days / max(half_life, 0.01))
        return max(0.0, min(1.0, retention))
```

---

## 5.4 QUIZ GENERATOR (Tự viết 100%)

### A. Multiple Choice Question (MCQ)

```python
class MCQGenerator:
    """
    Sinh MCQ thông minh:
    - Stem: tạo câu hỏi từ concept definition
    - Correct answer: trích từ Knowledge Graph
    - Distractors: tìm concepts "gần nhưng khác" trong embedding space
    """

    def generate(self, concept: ConceptNode, kg: KnowledgeGraph,
                 embedder: SentenceEmbedder) -> MCQuestion:

        # 1. CREATE STEM (câu hỏi)
        stem_templates = [
            f"What is {concept.label}?",
            f"Which of the following best describes {concept.label}?",
            f"Which statement about {concept.label} is correct?",
            # Vietnamese
            f"{concept.label} là gì?",
            f"Phát biểu nào sau đây đúng về {concept.label}?",
        ]
        stem = random.choice(stem_templates)

        # 2. CORRECT ANSWER
        correct = concept.definition or concept.text_context

        # 3. SMART DISTRACTORS
        #    Tìm concepts có embedding tương tự (0.4 < sim < 0.8)
        #    → gần đủ để gây nhầm lẫn, nhưng đủ khác để sai
        concept_embedding = embedder.encode([concept.label])[0]

        all_concepts = kg.get_all_concepts()
        scored = []
        for other in all_concepts:
            if other.id == concept.id:
                continue
            other_emb = embedder.encode([other.label])[0]
            sim = np.dot(concept_embedding, other_emb)
            if 0.4 < sim < 0.8:  # Sweet spot cho distractors
                scored.append((other, sim))

        # Sort by similarity (gần nhất → gây nhầm lẫn nhất)
        scored.sort(key=lambda x: x[1], reverse=True)
        distractors = [s[0].definition or s[0].label for s in scored[:3]]

        # Nếu không đủ distractors → sinh từ related concepts
        while len(distractors) < 3:
            related = kg.get_related_concepts(concept.id)
            for r in related:
                if r.definition and r.definition not in distractors:
                    distractors.append(r.definition)
                    if len(distractors) >= 3:
                        break

        return MCQuestion(
            stem=stem,
            correct_answer=correct,
            distractors=distractors[:3],
            source_concept=concept.id,
            difficulty=self._estimate_difficulty(concept, kg),
        )

    def _estimate_difficulty(self, concept, kg):
        """Ước tính độ khó dựa trên vị trí trong KG."""
        # Concept có nhiều prerequisites → khó hơn
        prereqs = kg.get_prerequisites(concept.id)
        depth = kg.get_depth(concept.id)
        return min(1.0, 0.2 + len(prereqs) * 0.1 + depth * 0.05)
```

### B. Fill-in-the-Blank

```python
class FillBlankGenerator:
    """Sinh câu hỏi điền vào chỗ trống từ text context."""

    def generate(self, concept: ConceptNode, context_chunks: list[str]) -> FillBlankQuestion:
        # Tìm câu chứa concept trong context
        target_sentence = self._find_sentence_with_concept(concept.label, context_chunks)

        if not target_sentence:
            return None

        # Thay concept bằng blank
        blank_sentence = target_sentence.replace(
            concept.label,
            "________",
            1  # chỉ thay 1 lần
        )

        return FillBlankQuestion(
            text_with_blank=blank_sentence,
            correct_answer=concept.label,
            hint=concept.definition[:50] + "..." if concept.definition else None,
            source_concept=concept.id,
        )
```

### C. Socratic Questioning

```python
class SocraticGenerator:
    """
    Sinh câu hỏi Socratic — không hỏi "cái gì?" mà hỏi "tại sao?", "nếu...thì?"
    Dẫn dắt tư duy thay vì kiểm tra thuộc lòng.
    """

    TEMPLATES = {
        'why': [
            "Tại sao {concept_a} lại cần thiết cho {concept_b}?",
            "Why is {concept_a} considered essential for understanding {concept_b}?",
        ],
        'what_if': [
            "Nếu không có {concept_a}, điều gì sẽ thay đổi trong {concept_b}?",
            "What would happen to {concept_b} if {concept_a} didn't exist?",
        ],
        'compare': [
            "So sánh {concept_a} và {concept_b}. Điểm giống và khác nhau là gì?",
            "How does {concept_a} differ from {concept_b}?",
        ],
        'apply': [
            "Hãy đưa ra một ví dụ thực tế về cách {concept_a} được áp dụng.",
            "Give a real-world example of how {concept_a} is applied.",
        ],
    }

    def generate(self, concept: ConceptNode, kg: KnowledgeGraph,
                 user_mastery: dict) -> SocraticQuestion:
        # Tìm edge yếu nhất trong KG (user chưa hiểu rõ)
        edges = kg.get_edges(concept.id)
        weakest_edge = None
        weakest_mastery = float('inf')

        for edge in edges:
            target_id = edge['target']
            mastery_level = user_mastery.get(target_id, MasteryState.new()).level
            if mastery_level < weakest_mastery:
                weakest_mastery = mastery_level
                weakest_edge = edge

        if not weakest_edge:
            # Fallback: general application question
            template = random.choice(self.TEMPLATES['apply'])
            return SocraticQuestion(
                question=template.format(concept_a=concept.label),
                question_type='apply',
                target_concepts=[concept.id],
            )

        # Chọn template dựa trên relation type
        rel_type = weakest_edge['relation_type']
        if rel_type == 'prerequisite':
            template_type = 'why'
        elif rel_type == 'related':
            template_type = 'compare'
        else:
            template_type = 'what_if'

        target_concept = kg.get_concept(weakest_edge['target'])
        template = random.choice(self.TEMPLATES[template_type])

        return SocraticQuestion(
            question=template.format(
                concept_a=concept.label,
                concept_b=target_concept.label,
            ),
            question_type=template_type,
            target_concepts=[concept.id, target_concept.id],
            expected_depth=2,  # Cần suy nghĩ sâu
        )
```

---

## 5.5 LEARNING PATH OPTIMIZER

```python
class LearningPathOptimizer:
    """
    Tạo lộ trình học tối ưu cho user.

    3 chiến lược kết hợp:
    1. Topological Sort: Học prerequisite trước
    2. Interleaving: Xen kẽ chủ đề khác nhau
    3. Mastery-based: Skip concepts đã master, focus vào yếu
    """

    def optimize(self, user_profile: NeuralProfile,
                 document_kg: KnowledgeGraph,
                 target_concepts: list[str] = None) -> LearningPath:

        # 1. Lấy tất cả concepts cần học
        if target_concepts:
            concepts = target_concepts
        else:
            concepts = document_kg.get_all_concept_ids()

        # 2. Build prerequisite DAG
        dag = self._build_prerequisite_dag(concepts, document_kg)

        # 3. Topological Sort (Kahn's algorithm — tự implement)
        base_order = self._kahn_topological_sort(dag)

        # 4. Filter: bỏ concepts đã master (mastery > 0.9)
        filtered = [c for c in base_order
                    if user_profile.concept_mastery.get(c, MasteryState.new()).level < 0.9]

        # 5. Apply interleaving
        #    Cognitive science: xen kẽ topics khác nhau → retention tốt hơn
        topic_clusters = document_kg.get_topic_clusters()  # từ Louvain
        interleaved = self._apply_interleaving(filtered, topic_clusters)

        # 6. Prioritize: concepts gần due date → đẩy lên trước
        prioritized = self._prioritize_due_reviews(interleaved, user_profile)

        # 7. Ước tính thời gian
        time_estimates = self._estimate_study_time(prioritized, user_profile)

        return LearningPath(
            concepts=prioritized,
            estimated_time_minutes=sum(time_estimates.values()),
            topic_breakdown=self._group_by_topic(prioritized, topic_clusters),
        )

    def _kahn_topological_sort(self, dag: dict) -> list:
        """Kahn's Algorithm — tự implement 100%."""
        in_degree = defaultdict(int)
        for node in dag:
            for neighbor in dag[node]:
                in_degree[neighbor] += 1

        # Queue: nodes with in-degree 0
        queue = deque([n for n in dag if in_degree[n] == 0])
        result = []

        while queue:
            node = queue.popleft()
            result.append(node)
            for neighbor in dag.get(node, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(result) != len(dag):
            # Có cycle → break cycle bằng cách bỏ edge yếu nhất
            remaining = set(dag.keys()) - set(result)
            result.extend(remaining)

        return result

    def _apply_interleaving(self, concepts: list, topic_clusters: dict) -> list:
        """
        Interleaving: thay vì A A A B B B C C C
        → A B C A B C A B C (xen kẽ topics)

        Nghiên cứu: Rohrer & Taylor (2007) — interleaving tăng long-term retention 43%
        """
        # Group concepts by topic
        by_topic = defaultdict(list)
        for c in concepts:
            topic = topic_clusters.get(c, 'uncategorized')
            by_topic[topic].append(c)

        # Round-robin interleave
        result = []
        topic_queues = {t: deque(cs) for t, cs in by_topic.items()}

        while any(topic_queues.values()):
            for topic in list(topic_queues.keys()):
                if topic_queues[topic]:
                    result.append(topic_queues[topic].popleft())
                else:
                    del topic_queues[topic]

        return result
```

---

## 5.6 COGNITIVE LOAD ESTIMATOR

```python
class CognitiveLoadEstimator:
    """
    Ước tính mức độ mệt mỏi trí tuệ của user dựa trên:
    1. Thời gian phản hồi (response time)
    2. Tỷ lệ đúng sai gần đây
    3. Thời gian học liên tục
    """

    def estimate(self, user_profile: NeuralProfile,
                 recent_responses: list[dict]) -> float:
        """Trả về cognitive load từ 0.0 (tỉnh táo) → 1.0 (kiệt sức)."""

        factors = []

        # Factor 1: Response time trend
        #   Nếu response time tăng dần → user đang mệt
        if len(recent_responses) >= 5:
            times = [r['time_ms'] for r in recent_responses[-10:]]
            trend = self._compute_trend(times)  # slope of linear regression
            time_factor = min(1.0, max(0.0, trend / 1000))  # normalize
            factors.append(time_factor * 0.4)

        # Factor 2: Recent accuracy drop
        if len(recent_responses) >= 5:
            recent_acc = sum(r['correct'] for r in recent_responses[-5:]) / 5
            overall_acc = sum(r['correct'] for r in recent_responses) / len(recent_responses)
            if recent_acc < overall_acc:
                acc_factor = (overall_acc - recent_acc) / max(overall_acc, 0.01)
                factors.append(min(1.0, acc_factor) * 0.3)

        # Factor 3: Session duration
        if user_profile.session_start_time:
            session_minutes = (datetime.utcnow() - user_profile.session_start_time).total_seconds() / 60
            # Pomodoro research: 25-50 min focus → fatigue starts
            duration_factor = min(1.0, max(0.0, (session_minutes - 25) / 75))
            factors.append(duration_factor * 0.3)

        return min(1.0, sum(factors)) if factors else 0.0
```

---

## 5.7 FRONTEND COMPONENTS

### A. Quiz Arena (`QuizArena.jsx`)
```
Features:
- Hiển thị câu hỏi + 4 lựa chọn
- Timer (countdown hoặc elapsed)
- Difficulty indicator (Easy / Medium / Hard)
- Sau khi trả lời: hiển thị đáp án đúng + explanation
- Progress bar (question 3/10)
- Score summary sau khi hoàn thành
- Concept mastery update real-time
```

### B. Flashcard Deck (`FlashcardDeck.jsx`)
```
Features:
- CSS 3D flip animation (front: question, back: answer)
- Swipe gestures (left: again, right: easy)
- SM-2+ quality buttons (Again / Hard / Good / Easy)
- Next review date hiển thị sau mỗi lần đánh giá
- Due count badge trên sidebar
- Streak counter (bao nhiêu ngày liên tiếp)
```

### C. Learning Analytics (`Analytics.jsx`)
```
Features:
- Retention Curve chart (Recall probability theo thời gian)
- Strength Map heatmap (concepts grid, color = mastery)
- Learning Velocity trend line
- Daily study time bar chart
- Topics mastery radar chart
- Review forecast calendar (ngày nào cần review bao nhiêu)
```

---

## 5.8 API ENDPOINTS (Pha 5)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/profile/:userId/neural` | Lấy Neural Profile |
| GET | `/api/profile/:userId/strength-map` | Bản đồ sức mạnh |
| GET | `/api/review/due` | Lấy concepts cần ôn tập hôm nay |
| POST | `/api/review/submit` | Submit kết quả ôn tập (cập nhật SM-2+) |
| POST | `/api/quiz/generate` | Sinh quiz cho document/topic |
| POST | `/api/quiz/submit` | Submit quiz answers → score + update mastery |
| GET | `/api/quiz/history` | Lịch sử quiz sessions |
| GET | `/api/learning-path/:docId` | Lấy learning path tối ưu |
| GET | `/api/analytics/retention` | Dữ liệu retention curve |
| GET | `/api/analytics/velocity` | Learning velocity data |
| GET | `/api/analytics/forecast` | Review forecast 30 ngày |

---

## 5.9 ACCEPTANCE CRITERIA

- [ ] SM-2+ scheduling hoạt động: concept review đúng hạn, interval tăng khi trả lời đúng
- [ ] MCQ generator sinh câu hỏi có ý nghĩa + distractors gây nhầm lẫn hợp lý
- [ ] Fill-blank generator tạo câu hỏi phù hợp context
- [ ] Socratic questions dẫn dắt suy nghĩ sâu (human eval trên 20 questions)
- [ ] Learning Path: prerequisite ordering đúng logic
- [ ] Interleaving: topics được xen kẽ hợp lý
- [ ] Cognitive load detection: phát hiện khi user mệt + giảm tải phù hợp
- [ ] Quiz Arena UI hoạt động mượt, timer chính xác
- [ ] Flashcard flip animation smooth (60fps)
- [ ] Analytics charts render đúng data
- [ ] Tất cả API endpoints trả về kết quả < 200ms
