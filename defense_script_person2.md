# 🎤 LỜI THOẠI THUYẾT TRÌNH — NGƯỜI 2
## Trí Tuệ Hệ Thống: LLM + RAG + Knowledge Graph + Quiz (Slide 6–10)
### Thời lượng mục tiêu: ~5 phút

---

## 📌 SLIDE 6 — LLM INFRASTRUCTURE (1 phút)

> Cảm ơn bạn [Tên Người 1]. Phần tiếp theo em sẽ trình bày cách hệ thống **"hiểu" và "trả lời"** — bắt đầu từ hạ tầng LLM.
>
> NeuroVault sử dụng mô hình ngôn ngữ lớn chạy **100% local** thông qua **Ollama** — cụ thể là model **Qwen3 1.7B**. Việc tự host model mang lại hai ưu điểm tuyệt đối: **không tốn chi phí API**, và toàn bộ dữ liệu của sinh viên **được bảo mật hoàn toàn, không bao giờ rời khỏi hệ thống**.
>
> Tuy nhiên, chạy LLM local đặt ra thách thức về **độ ổn định của dịch vụ**. Model có thể bị quá tải khi xử lý nhiều request cùng lúc, hoặc service Ollama có thể gặp sự cố. Nếu không xử lý tốt, một lỗi đơn lẻ ở tầng inference này sẽ **kéo sập toàn bộ hệ thống**.
>
> Nhóm giải quyết bằng 3 cơ chế production-grade, tự viết hoàn toàn:
>
> **Thứ nhất — Circuit Breaker Pattern.** Giống như cầu dao điện trong nhà. Bình thường cầu dao ở trạng thái **CLOSED** — cho phép request đi qua. Khi phát hiện **5 lỗi liên tiếp**, cầu dao chuyển sang **OPEN** — chặn tất cả request trong 60 giây, tránh gửi thêm request vào service đã lỗi. Sau 60 giây, chuyển sang **HALF_OPEN** — cho phép 1 request thử. Nếu thành công thì đóng lại bình thường, nếu lỗi thì mở tiếp. Pattern này ngăn chặn **cascade failure** — một lỗi nhỏ không lan ra toàn hệ thống.
>
> **Thứ hai — Exponential Backoff với Jitter.** Khi một request lỗi, hệ thống không retry ngay lập tức — vì nếu Ollama đang quá tải, retry ngay sẽ càng tệ hơn. Thay vào đó, thời gian chờ tăng theo cấp số nhân: lần 1 chờ 2 giây, lần 2 chờ 4 giây, lần 3 chờ 8 giây. Cộng thêm **jitter** — một giá trị ngẫu nhiên — để tránh tình huống nhiều request đồng thời retry cùng lúc. Công thức: `delay = min(30, 2^attempt + random(0,1))`.
>
> **Thứ ba — Connection Pooling.** Sử dụng `httpx.Client` với keep-alive — duy trì 5 connection sẵn sàng, hạn chế overhead tạo connection mới cho mỗi request. Timeout được cấu hình chặt: 30 giây cho generate, 10 giây cho health check.
>
> Ngoài ra, LLM Engine hỗ trợ **streaming response** với **thinking mode** — tách riêng phần suy nghĩ trong tag `<think>...</think>` và phần trả lời chính thức, giúp người dùng thấy quá trình "suy luận" của AI.

---

## 📌 SLIDE 7 — RAG PIPELINE (1 phút 15 giây)

> Có LLM rồi, nhưng nếu chỉ hỏi LLM trực tiếp thì nó sẽ trả lời dựa trên kiến thức training — có thể **bịa đặt** hoặc trả lời không liên quan đến tài liệu. Đây gọi là **hallucination** — vấn đề lớn nhất của LLM hiện nay.
>
> Giải pháp là **RAG — Retrieval-Augmented Generation** — buộc LLM chỉ trả lời dựa trên nội dung tài liệu đã upload. Pipeline RAG của NeuroVault gồm **5 giai đoạn**:
>
> **Giai đoạn 1 — Query Reformulation.** Khi người dùng hỏi `"Nó hoạt động thế nào?"`, đại từ `"nó"` là mơ hồ. Hệ thống phát hiện **đại từ và tỉnh lược** (coreference và ellipsis), rồi viết lại câu hỏi thành `"Thuật toán PageRank hoạt động thế nào?"` — dựa trên context cuộc trò chuyện trước đó. Có 2 mode: LLM rewrite khi LLM khả dụng, hoặc rule-based fallback thay thế đại từ bằng topic cuối cùng.
>
> **Giai đoạn 2 — Hybrid Retrieval.** Tìm kiếm chunks liên quan bằng **2 kênh song song**: BM25 cho sparse matching (khớp từ khóa chính xác) và SVD embedding cho dense matching (khớp ngữ nghĩa). Hai kết quả được kết hợp bằng **Reciprocal Rank Fusion** — em sẽ giải thích chi tiết ở slide sau.
>
> **Giai đoạn 3 — Reranking.** Top kết quả từ RRF được xếp hạng lại bằng **Cross-Encoder Reranker** với 5 tín hiệu khác nhau — cũng sẽ trình bày chi tiết ở slide sau.
>
> **Giai đoạn 4 — Generation.** Ghép các chunks đã rerank thành **context block**, kết hợp với **system prompt song ngữ** (tự động chọn Việt hoặc Anh), cùng **lịch sử hội thoại 3 lượt gần nhất** — rồi gửi cho LLM generate câu trả lời.
>
> **Giai đoạn 5 — Grounding Verification.** Đây là tầng **chống hallucination**. Sau khi LLM trả lời, hệ thống tách response thành từng câu, rồi kiểm tra **keyword overlap** giữa mỗi câu và source chunks. Nếu overlap dưới 30% — nghĩa là câu đó có thể bịa — sẽ bị đánh dấu là **ungrounded**. Chỉ những câu có overlap trên 50% mới được coi là **đáng tin cậy**.
>
> Nói cách khác: LLM không thể "bịa" được, vì mọi phát ngôn đều bị cross-check với tài liệu gốc.

---

## 📌 SLIDE 8 — RETRIEVAL & RERANKING (1 phút)

> Bây giờ em đi sâu vào giai đoạn 2 và 3 của RAG — **Retrieval và Reranking** — vì đây là phần quyết định chất lượng câu trả lời.
>
> **BM25** là thuật toán sparse retrieval kinh điển, nhóm tự implement với công thức Okapi BM25. Ưu điểm của BM25 là khớp **từ khóa chính xác** rất tốt — nếu người dùng hỏi `"PageRank"`, BM25 sẽ tìm chính xác chunks chứa từ `"PageRank"`. Tham số `k1=1.5` kiểm soát term frequency saturation, `b=0.75` kiểm soát document length normalization.
>
> **SVD Embedding** là dense retrieval. Nhóm dùng **TF-IDF** để biểu diễn text thành vector thưa, rồi **Randomized Truncated SVD** — thuật toán Halko — giảm chiều xuống 128 chiều. Ưu điểm: bắt được **quan hệ ngữ nghĩa** mà BM25 bỏ lỡ. Ví dụ, câu hỏi `"machine learning"` có thể match chunk nói về `"deep neural network"` dù không trùng từ khóa.
>
> **Tại sao không dùng BERT?** Các mô hình như BERT thường đi kèm với dung lượng lớn và đòi hỏi tài nguyên tính toán cao. Thay vào đó, Truncated SVD cho tốc độ xử lý cực kỳ ấn tượng — hoàn thành trong dưới 1 giây cho 1000 tài liệu, đồng thời vẫn đảm bảo chất lượng trích xuất đặc trưng ngữ nghĩa cho hệ thống.
>
> Hai kênh retrieval cho ra 2 danh sách kết quả riêng biệt. Nhóm kết hợp chúng bằng **Reciprocal Rank Fusion**: `score(d) = 1/(60 + rank_sparse) + 1/(60 + rank_dense)`. Hằng số `k=60` cân bằng hai tín hiệu — document nào xếp hạng cao ở **cả 2 kênh** sẽ được ưu tiên nhất.
>
> Sau RRF, top kết quả đi qua **Cross-Encoder Reranker** — một bộ scoring đa tín hiệu gồm 5 thành phần:
> - **Semantic** chiếm 35% — cosine similarity giữa TF-IDF vector của query và chunk
> - **Lexical** chiếm 25% — tỷ lệ từ trong query xuất hiện trong chunk
> - **Position** chiếm 15% — chunk ở đầu tài liệu được ưu tiên hơn, vì thường chứa definition
> - **Concept** chiếm 15% — tỷ lệ concept chung giữa query và chunk
> - **Hybrid prior** chiếm 10% — score từ giai đoạn RRF trước đó
>
> Tổng hợp: `final_score = 0.35×semantic + 0.25×lexical + 0.15×position + 0.15×concept + 0.10×hybrid`. Thiết kế multi-signal này đảm bảo kết quả retrieval **chính xác và toàn diện** hơn so với chỉ dùng 1 metric.

---

## 📌 SLIDE 9 — KNOWLEDGE GRAPH (1 phút)

> Bên cạnh RAG, hệ thống còn xây dựng **Knowledge Graph** — đồ thị kiến thức trực quan hóa mối quan hệ giữa các khái niệm trong tài liệu.
>
> Quy trình gồm 4 bước:
>
> **Bước 1 — Concept Extraction.** Trích xuất khái niệm quan trọng từ text bằng tổ hợp: **TF-IDF scoring** để đánh giá mức độ quan trọng, **n-gram extraction** để bắt cụm từ 2-3 từ, cộng thêm **position bonus** — khái niệm xuất hiện ở đầu tài liệu có trọng số cao hơn — và **specificity bonus** — cụm từ chuyên ngành được ưu tiên. Khi LLM khả dụng, hệ thống còn dùng LLM để verify và bổ sung definition.
>
> **Bước 2 — Relation Detection.** Phát hiện quan hệ giữa các concept bằng **pattern matching** cho cả tiếng Anh và tiếng Việt. Ví dụ: `"A is a type of B"` → quan hệ **is-a**, `"A bao gồm B"` → quan hệ **part-of**, `"cần hiểu A trước khi học B"` → quan hệ **prerequisite**. Toàn bộ dùng regex pattern, không cần ML model.
>
> **Bước 3 — Graph Analysis.** Sau khi có graph, nhóm áp dụng 2 thuật toán tự viết:
> - **PageRank** với damping factor `d=0.85` — xác định concept nào là **trung tâm** nhất trong tài liệu. Concept có PageRank cao = concept cốt lõi mà sinh viên cần nắm vững trước.
> - **Louvain Community Detection** — phát hiện **cụm chủ đề**. Thuật toán tối ưu modularity `Q` bằng cách dời node giữa các community cho đến khi `ΔQ` không tăng nữa. Kết quả: mỗi community là một "chương" hoặc "mảng kiến thức" riêng biệt.
>
> **Bước 4 — NPMI Edge Pruning.** Đây là bước quan trọng nhất. Graph ban đầu thường có hàng trăm edges — rất rối. Nhóm dùng **Normalized Pointwise Mutual Information** để lọc: chỉ giữ lại edges có **statistical significance** thực sự. NPMI dao động từ -1 đến 1 — edges có NPMI thấp bị loại bỏ. Kết quả: từ 435 edges giảm xuống còn **60-90 edges** có ý nghĩa — graph trở nên **readable và actionable**.
>
> Tại sao chọn **Louvain** thay vì Label Propagation? Vì trên graph dày đặc co-occurrence, Label Propagation thường **collapse thành 1 cluster duy nhất** — mất hoàn toàn cấu trúc. Louvain tối ưu modularity `Q` một cách explicit, cho kết quả ổn định hơn.

---

## 📌 SLIDE 10 — QUIZ GENERATOR (45 giây)

> Module cuối cùng em trình bày là **Quiz Generator** — hệ thống tạo câu hỏi tự động từ tài liệu.
>
> Chiến lược tạo câu hỏi theo ưu tiên **LLM-first, template-fallback**:
>
> **Khi LLM khả dụng**, hệ thống gửi prompt có **few-shot examples** — 3 ví dụ mẫu cho 3 loại câu hỏi: trắc nghiệm MCQ, điền chỗ trống, và đúng/sai. LLM generate toàn bộ câu hỏi dựa trên concepts và chunks đã trích xuất. Prompt được thiết kế **song ngữ** — tự động chọn tiếng Việt hoặc tiếng Anh tùy tài liệu.
>
> **Khi LLM không khả dụng**, hệ thống fallback sang **template-based generation** — dùng các mẫu câu hỏi có sẵn kết hợp với concept name và context.
>
> Điểm quan trọng là **anti-hallucination cho quiz**. Mỗi câu hỏi sau khi LLM generate đều phải qua **Source Grounding Verification**:
> - Câu **fill-in-the-blank**: đáp án PHẢI xuất hiện trong source text — nếu không thì bị loại
> - Câu **MCQ**: ít nhất 50% từ trong đáp án phải có trong source
> - Đáp án fill_blank bị giới hạn tối đa **4 từ** — tránh tình trạng LLM copy nguyên cả câu dài
>
> Ngoài ra, câu hỏi được phân loại theo **Bloom's Taxonomy** — 6 cấp từ **Nhớ** đến **Sáng tạo**. Difficulty thấp sẽ ra câu hỏi cấp Nhớ/Hiểu, difficulty cao sẽ ra câu Phân tích/Đánh giá. Điều này kết nối trực tiếp với module IRT Adaptive Quiz mà bạn [Tên Người 3] sẽ trình bày tiếp theo.

---

### 🔗 CHUYỂN GIAO SANG NGƯỜI 3:

> Vậy là em đã trình bày xong phần **Trí tuệ Hệ thống** — từ hạ tầng LLM local với Circuit Breaker, đến RAG Pipeline 5 giai đoạn chống hallucination, hệ thống retrieval hybrid với reranking đa tín hiệu, Knowledge Graph với PageRank và Louvain, và Quiz Generator với source grounding.
>
> Tất cả đều nhắm đến một mục tiêu: **đảm bảo mọi output của AI đều bám sát tài liệu gốc, có thể kiểm chứng, và không bịa đặt**.
>
> Tiếp theo, bạn [Tên Người 3] sẽ trình bày phần **Học Thích ứng** — cách hệ thống cá nhân hóa trải nghiệm học và điều chỉnh theo năng lực từng người qua IRT, FSRS v6, và Multi-Agent System.
>
> Xin mời bạn [Tên Người 3].
