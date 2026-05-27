# 🎤 LỜI THOẠI THUYẾT TRÌNH — NGƯỜI 3 (BẢN RÚT GỌN, DỄ NÓI)
## Chủ đề: Adaptive Learning + Multi-Agent (Slide 11–15)
### Thời lượng mục tiêu: 3.5–4.5 phút

---

## 📌 SLIDE 11 — ADAPTIVE QUIZ (IRT) (~50 giây)

> Cảm ơn bạn trước đó. Phần của em là cách hệ thống **cá nhân hóa mức độ câu hỏi** theo từng người học.
>
> Điểm chính nằm ở công thức Rasch 1PL:  
> \(P(correct)=\frac{1}{1+e^{-(\theta-b)}}\).  
> Hiểu đơn giản: nếu năng lực người học \(\theta\) cao hơn độ khó câu hỏi \(b\), xác suất đúng sẽ tăng.
>
> Sau mỗi câu trả lời, hệ thống cập nhật lại \(\theta\) bằng MLE (Newton-Raphson). Sau đó chọn câu hỏi tiếp theo có **độ thông tin cao nhất** theo Fisher \(I(\theta)=P(1-P)\), tức là câu hỏi vừa sức nhất tại thời điểm đó.
>
> Bài quiz dừng khi đủ chính xác (SE thấp hơn ngưỡng) hoặc đạt số câu tối đa.

### Code neo (để chỉ vào khi trình bày)
- `backend/ai_core/adaptive/adaptive_quiz.py`
- Hàm chính:
  - `irt_probability()` — tính xác suất đúng theo \(\theta, b\)
  - `mle_ability()` — cập nhật năng lực
  - `_select_next_question()` — chọn câu có information cao nhất
- Chi tiết dừng bài:
  - `submit_answer()` với điều kiện `session.ability_se < session.se_threshold`

### Đoạn code ngắn có thể chiếu
```python
# backend/ai_core/adaptive/adaptive_quiz.py
p = irt_probability(theta, difficulty)   # P(correct)
info = p * (1 - p)                       # Fisher information
session.ability_theta, session.ability_se = mle_ability(...)
```

---

## 📌 SLIDE 12 — SPACED REPETITION (FSRS) (~50 giây)

> Sau quiz, hệ thống không dừng ở chấm điểm, mà lên lịch ôn tập bằng FSRS.
>
> Em chỉ nhấn mạnh 2 ý dễ hiểu:
> 1. Hệ thống ước lượng **khả năng nhớ lại theo thời gian** bằng đường cong quên (power-law).  
> 2. Mỗi lần người học bấm Again/Hard/Good/Easy, hệ thống cập nhật stability, difficulty và lịch ôn tiếp theo.
>
> Nói ngắn gọn: nhớ kém thì nhắc sớm, nhớ tốt thì giãn lịch ra.

### Code neo
- Core công thức: `backend/ai_core/adaptive/spaced_repetition.py`
  - `_retrievability()` — tính xác suất còn nhớ
  - `_stability_after_success()` / `_stability_after_failure()`
- Scheduler thực tế: `backend/ai_core/adaptive/fsrs_scheduler.py`
  - `get_due_cards()` — lấy thẻ đến hạn
  - `_compute_urgency()` — ưu tiên thẻ sắp quên
  - `review_card()` — cập nhật lịch sau mỗi lần review

### Đoạn code ngắn có thể chiếu
```python
# backend/ai_core/adaptive/fsrs_scheduler.py
urgency = self._compute_urgency(
    retrievability=retrievability,
    overdue_days=overdue_days,
    difficulty=schedule.get("difficulty", 5.0),
    state=state,
)
```

---

## 📌 SLIDE 13 — DEEP KNOWLEDGE TRACER (DKT) (~45 giây)

> DKT giúp hệ thống theo dõi người học đang mạnh/yếu ở từng concept.
>
> Luồng cập nhật gồm 3 bước:
> - Bước 1: áp dụng **temporal decay** để phản ánh quên theo thời gian.
> - Bước 2: cập nhật xác suất mastery bằng Bayesian update theo đúng/sai.
> - Bước 3: làm mượt bằng EMA để tránh dao động quá mạnh chỉ vì 1 câu.
>
> Ngoài ra có transfer nhẹ sang concept liên quan và tính learning velocity để gợi ý độ khó đầu vào cho quiz sau.

### Code neo
- `backend/ai_core/adaptive/deep_knowledge_tracer.py`
  - `_apply_temporal_decay()`
  - `_bayes_update()`
  - `update()`
  - `get_recommended_difficulty()` (đưa prior cho Adaptive Quiz)

### Đoạn code ngắn có thể chiếu
```python
# backend/ai_core/adaptive/deep_knowledge_tracer.py
state.p_mastery = self._apply_temporal_decay(state, now)
state.p_mastery = self._bayes_update(state.p_mastery, is_correct)
state.ema_score = self.ema_alpha * score + (1 - self.ema_alpha) * state.ema_score
```

---

## 📌 SLIDE 14 — MULTI-AGENT SYSTEM (~50 giây)

> Phần cuối là kiến trúc agent. Hệ thống dùng Supervisor–Worker tự viết.
>
> `AgentOrchestrator` làm 4 việc: nhận request, phân loại intent, chọn agent phù hợp, và xử lý handoff khi cần chuyển tác vụ.
>
> Điểm dễ nhớ nhất là bộ nhớ 4 tầng:
> - Working: cho lượt xử lý hiện tại
> - Short-term: trong phiên chat hiện tại
> - Episodic: tóm tắt các phiên trước
> - Long-term: fact và sở thích học của người dùng
>
> Safety Agent chạy kiểm duyệt nội dung; nếu safety agent lỗi thì hệ thống fail-open để không làm gián đoạn buổi học.

### Code neo
- Điều phối: `backend/ai_core/agents/orchestrator.py`
  - `process_user_request()`
  - `_classify_intent()`
  - `_run_safety_check()`
  - `_handle_handoff()`
- Memory 4 tầng: `backend/ai_core/agents/agent_memory.py`
  - `WorkingMemory`, `ShortTermMemory`, `EpisodicMemory`, `LongTermMemory`, `MemoryManager`
- Đăng ký worker: `backend/ai_core/agents/__init__.py` + `backend/ai_core/agents/registry.py`

### Đoạn code ngắn có thể chiếu
```python
# backend/ai_core/agents/orchestrator.py
intent = self._classify_intent(query, context)
agent = self._select_agent(intent, context)
response_msg = agent.handle_message(message, context)
```

---

## 📌 SLIDE 15 — DEMO + KẾT LUẬN (~45 giây)

> Trong demo, em sẽ đi theo đúng chuỗi: Upload tài liệu → hỏi đáp RAG → quiz thích ứng → lịch ôn FSRS.
>
> Kết luận ngắn gọn: hệ thống không chỉ trả lời câu hỏi, mà còn theo dõi năng lực và tự điều chỉnh đường học theo từng người.
>
> Hạn chế hiện tại: embedding nhẹ nên ngữ nghĩa sâu chưa bằng mô hình lớn; FSRS hiện dùng trọng số mặc định; và cần thêm dữ liệu để cá nhân hóa mạnh hơn.
>
> Em xin hết phần trình bày của mình. Cảm ơn Thầy/Cô.

---

## ✅ 3 câu “an toàn” khi bị hỏi sâu
1. “Bên em chọn bản dễ giải thích và bám code thật: mỗi công thức đều có hàm triển khai trực tiếp trong file adaptive tương ứng.”
2. “Mục tiêu của phần em là cá nhân hóa học tập ổn định trên tài nguyên local, nên ưu tiên thuật toán rõ ràng, dễ kiểm chứng.”
3. “Nếu Hội đồng muốn, em có thể mở ngay các hàm `mle_ability`, `_compute_urgency`, và `update` để đối chiếu luồng thực thi.”
