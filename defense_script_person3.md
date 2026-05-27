# 🎤 LỜI THOẠI THUYẾT TRÌNH — NGƯỜI 3
## Học Thích Ứng & Hệ Thống Agent (Slide 11–15)
### Thời lượng mục tiêu: ~5 phút

---

## 📌 SLIDE 11 — ADAPTIVE QUIZ (IRT) (1 phút 15 giây)

> Cảm ơn bạn [Tên Người 2]. Phần cuối cùng của buổi bảo vệ, em xin trình bày về **Hệ thống Học Thích ứng (Adaptive Learning)** — tức là làm thế nào để hệ thống dạy theo đúng năng lực của từng sinh viên.
>
> Cách làm quiz truyền thống là mọi người đều nhận cùng một bộ câu hỏi cố định, với độ khó như nhau. Điều này gây nhàm chán cho người giỏi và làm nản chí người yếu. Nhóm giải quyết bằng mô hình **Lý thuyết Khảo thí Hiện đại - Item Response Theory (IRT)**.
>
> Cụ thể, hệ thống implement **Rasch Model (1PL)**. Trong mô hình này, xác suất trả lời đúng một câu hỏi phụ thuộc vào 2 biến: năng lực của người học (ký hiệu là $\theta$) và độ khó của câu hỏi (ký hiệu là $b$). Công thức là một hàm sigmoid: $P = \frac{1}{1 + e^{-(\theta - b)}}$.
>
> Quá trình thi thích ứng diễn ra liên tục:
> - Sau mỗi câu trả lời, hệ thống cập nhật lại năng lực $\theta$ của sinh viên bằng thuật toán **Maximum Likelihood Estimation (MLE)** thông qua phương pháp Newton-Raphson. Thuật toán sẽ lặp cho đến khi đạo hàm hội tụ $\delta < 0.001$.
> - Sau khi có $\theta$ mới, hệ thống phải chọn câu hỏi tiếp theo. Tiêu chí chọn là **Tối đa hóa Thông tin Fisher (Fisher Information)**: $I(\theta) = P \times (1-P)$. Thông tin này đạt giá trị lớn nhất khi $P = 0.5$, tức là độ khó câu hỏi $b$ xấp xỉ bằng năng lực $\theta$. Như vậy, hệ thống luôn chọn câu hỏi **vừa sức nhất** ở mọi thời điểm.
> - Bài kiểm tra dừng lại khi **Sai số chuẩn (Standard Error - SE)** giảm xuống dưới $0.4$, hoặc đạt tối đa 15 câu, đảm bảo đánh giá chính xác mà không quá dài.
>
> Đặc biệt, hệ thống dùng **Deep Knowledge Tracer** để cung cấp giá trị $\theta$ ban đầu (prior), giúp tránh hiện tượng "cold-start" khi bắt đầu quiz.

---

## 📌 SLIDE 12 — SPACED REPETITION (FSRS v6) (1 phút)

> Học xong thì phải ôn tập. Đa số các ứng dụng hiện nay dùng thuật toán SuperMemo-2 (SM-2) ra đời từ những năm 90. NeuroVault sử dụng thuật toán mới nhất hiện nay là **FSRS phiên bản 6 (Free Spaced Repetition Scheduler)**. Nhóm tự implement toàn bộ 100% bằng Python dựa trên bài báo gốc.
>
> FSRS v6 vượt trội nhờ 2 điểm:
> - **Mô hình 17 tham số (trainable parameters):** cho phép dự đoán chính xác đường cong quên lãng (forgetting curve) dựa trên độ khó của thẻ, độ ổn định (stability) và khả năng nhớ lại (retrievability).
> - **Đường cong forgetting power-law:** $R(t,S) = (1 + 19/81 \times t/S)^{-0.5}$, mô phỏng thực tế não người tốt hơn hàm mũ truyền thống.
>
> Khi sinh viên ôn thẻ, nếu trả lời đúng, độ ổn định $S$ tăng lên theo một công thức tính toán phức tạp kết hợp 17 tham số. Nếu sai, $S$ sẽ giảm mạnh.
>
> Dựa trên retrievability $R$, hệ thống xếp hạng các thẻ cần ôn tập vào một **Priority Queue** với điểm số khẩn cấp (urgency score) để ưu tiên các thẻ sắp bị quên nhất.

---

## 📌 SLIDE 13 — DEEP KNOWLEDGE TRACER (45 giây)

> Làm sao hệ thống biết sinh viên đang hiểu concept nào, hổng concept nào? Đó là nhiệm vụ của **Deep Knowledge Tracer (DKT)**.
>
> Hệ thống dùng mô hình **Bayesian Knowledge Tracing (BKT)** kết hợp **Exponential Moving Average (EMA)**. Sau mỗi câu hỏi đúng/sai, hệ thống update xác suất nắm vững (mastery) của concept đó.
>
> Tuy nhiên, điểm cải tiến của NeuroVault là:
> 1. **Temporal Decay:** Kiến thức sẽ phai nhạt theo thời gian nếu không ôn tập, sử dụng decay factor liên kết với độ ổn định từ FSRS.
> 2. **Cross-concept Transfer:** Nếu sinh viên trả lời đúng câu hỏi về concept A, và A có quan hệ "prerequisite" với concept B trong Knowledge Graph, thì điểm mastery của B cũng được tăng nhẹ theo một transfer rate.
> 3. **Learning Velocity:** Hệ thống theo dõi tốc độ học để xác định Vùng Phát triển Gần nhất (Zone of Proximal Development - ZPD), nhắm tới mục tiêu tỷ lệ thành công duy trì ở mức ~70%, không quá dễ cũng không quá khó.

---

## 📌 SLIDE 14 — MULTI-AGENT SYSTEM (45 giây)

> Để kết nối tất cả các thành phần AI lại với nhau, hệ thống sử dụng một **Multi-Agent Orchestrator** tự viết 100%, áp dụng mô hình **Supervisor-Worker**, không dùng LangGraph hay CrewAI.
>
> Khi người dùng chat, request đi qua **Supervisor Agent** để phân loại ý định (Intent Classification). Supervisor dùng rule-based keyword matching để phân loại nhanh, nếu fail thì dùng LLM để quyết định.
> Sau đó, Supervisor điều phối công việc cho các **Worker Agents** chuyên biệt: Tutor Agent (dạy học), Assessment Agent (tạo quiz), Content Generation, Analytics, Path Planning, v.v.
>
> Điểm nhấn là kiến trúc **Bộ nhớ 4 lớp (4-layer Memory)**:
> 1. **Working Memory:** lưu context lượt hội thoại hiện tại.
> 2. **Short-term Memory:** lưu nội dung session học.
> 3. **Episodic Memory:** lưu lịch sử các session trước.
> 4. **Long-term Memory:** lưu trữ các fact về người học, điểm yếu, điểm mạnh từ DKT.
>
> Ngoài ra, hệ thống có **Safety Agent** chạy song song để kiểm duyệt nội dung, với cơ chế fail-open đảm bảo không gián đoạn việc học nếu agent này quá tải.

---

## 📌 SLIDE 15 — DEMO & CONCLUSION (1 phút 15 giây)

> (Mở video demo hoặc demo live)
>
> Như Hội đồng thấy, từ một file PDF tĩnh, hệ thống đã trích xuất chunks, tìm ra các concepts, vẽ Knowledge Graph, sinh ra Quiz, tự động điều chỉnh độ khó, và lên lịch ôn tập.
> **Và quan trọng nhất: toàn bộ quá trình phức tạp này diễn ra khép kín, tối ưu tài nguyên và hoàn toàn độc lập với các dịch vụ đám mây bên ngoài.**
>
> Dĩ nhiên, hệ thống còn một số **hạn chế**:
> 1. SVD embedding cực kỳ nhẹ và nhanh nhưng chưa bắt được độ sâu ngữ nghĩa như các mô hình BERT lớn.
> 2. LLM 1.7B có giới hạn về khả năng suy luận logic phức tạp.
> 3. Các trọng số FSRS đang dùng mặc định, chưa được cá nhân hóa cho từng user do thiếu dữ liệu lịch sử.
>
> Về **hướng phát triển tương lai**, nhóm dự định:
> - Tích hợp một embedding model nhỏ đã được fine-tune riêng cho tiếng Việt.
> - Bổ sung tính năng Collaborative Learning - cho phép sinh viên chia sẻ Knowledge Graph.
> - Cá nhân hóa trọng số FSRS dựa trên lịch sử tương tác của từng user.
>
> Đồ án **NeuroVault** chứng minh rằng: chúng ta hoàn toàn có thể xây dựng một hệ thống học tập AI tiên tiến, bảo mật, cá nhân hóa mà **không cần phụ thuộc vào Big Tech hay Cloud API**, tuân thủ nghiêm ngặt triết lý White-Box AI.
>
> Em xin kết thúc phần trình bày của nhóm tại đây. Cảm ơn Thầy/Cô và Hội đồng đã lắng nghe. Chúng em rất mong nhận được những góp ý và câu hỏi phản biện từ Hội đồng ạ.
