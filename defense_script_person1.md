# 🎤 LỜI THOẠI THUYẾT TRÌNH — NGƯỜI 1
## Data Foundation & NLP Pipeline (Slide 1–5)
### Thời lượng mục tiêu: ~5 phút

---

## 📌 SLIDE 1 — TITLE (30 giây)

> Kính chào Thầy/Cô và Hội đồng.
>
> Hôm nay nhóm chúng em xin trình bày đồ án chuyên ngành với đề tài **NeuroVault — Nền tảng Học tập Thông minh dựa trên Trí tuệ Nhân tạo**.
>
> Đồ án được xây dựng theo triết lý **White-Box AI** — nghĩa là toàn bộ các thuật toán AI trong hệ thống đều được nhóm **tự viết từ đầu**, không sử dụng API trả phí, không phụ thuộc vào bất kỳ thư viện AI chuyên dụng nào như LangChain, LlamaIndex hay Sentence-Transformers. Mọi dòng code đều có thể **trace back** tới công thức toán học cụ thể.
>
> Phần trình bày sẽ được chia làm 3 phần: em sẽ trình bày phần **Nền tảng Dữ liệu và Xử lý Ngôn ngữ**, bạn [Tên Người 2] sẽ trình bày phần **Trí tuệ Hệ thống — RAG, LLM và Knowledge Graph**, và bạn [Tên Người 3] sẽ trình bày phần **Học Thích ứng và Hệ thống Agent**.

---

## 📌 SLIDE 2 — MOTIVATION & PROBLEM (1 phút)

> Trước khi đi vào chi tiết kỹ thuật, em xin trình bày **bài toán thực tế** mà nhóm muốn giải quyết.
>
> **Thứ nhất**, sinh viên hiện nay tiếp cận tài liệu một cách **thụ động** — đọc PDF, ghi chú, nhưng không có công cụ nào **kiểm tra mức độ hiểu biết thực sự**. Đọc xong một chương sách, sinh viên thường không biết mình đã hiểu được bao nhiêu phần trăm.
>
> **Thứ hai**, các nền tảng AI hiện tại như ChatGPT hay Quizlet đều **phụ thuộc vào API trả phí**. Dữ liệu tài liệu học tập phải gửi lên cloud — đặt ra vấn đề về **chi phí** và **quyền riêng tư dữ liệu**. Một sinh viên không thể chi hàng triệu đồng mỗi tháng chỉ để dùng AI hỗ trợ học.
>
> **Thứ ba**, không có hệ thống nào **cá nhân hóa lộ trình học** dựa trên năng lực thực sự của từng người. Mọi sinh viên đều học cùng một lộ trình, bất kể trình độ khác nhau.
>
> Từ ba vấn đề này, nhóm đặt ra mục tiêu xây dựng **NeuroVault** — một nền tảng học tập AI chạy **100% trên máy tính cá nhân**, với bốn tính năng cốt lõi:
> - **Một** là tự động phân tích tài liệu PDF, trích xuất kiến thức và xây dựng Knowledge Graph.
> - **Hai** là hỏi đáp thông minh dựa trên nội dung tài liệu — gọi là RAG — đảm bảo câu trả lời bám sát tài liệu, không bịa đặt.
> - **Ba** là tạo quiz thích ứng, tự động điều chỉnh độ khó theo năng lực người học bằng mô hình IRT.
> - **Bốn** là hệ thống ôn tập Flashcard với lịch nhắc tối ưu theo thuật toán FSRS v6.
>
> Tất cả kiến trúc này được tối ưu để có thể chạy độc lập, an toàn ngay trên máy tính cá nhân của người học — hoàn toàn không cần kết nối internet hay phụ thuộc vào cloud server.

---

## 📌 SLIDE 3 — SYSTEM ARCHITECTURE (1 phút)

> Về kiến trúc tổng thể, hệ thống được thiết kế theo mô hình **3 tầng**.
>
> **Tầng 1 — Frontend**, được xây dựng bằng **React 18 và Vite**. Đây là giao diện người dùng, bao gồm các module: DocumentReader để đọc tài liệu, Knowledge Graph để hiển thị đồ thị kiến thức, QuizEngine cho quiz thích ứng, ChatInterface cho hỏi đáp RAG, và FlashcardDeck cho ôn tập spaced repetition.
>
> **Tầng 2 — API Gateway**, sử dụng **Node.js và Express**. Tầng này đóng vai trò trung gian — xử lý xác thực người dùng bằng JWT, rate limiting, và route các request. Cụ thể, các request liên quan đến AI sẽ được forward xuống tầng 3, còn các thao tác CRUD thông thường thì xử lý trực tiếp ở đây.
>
> **Tầng 3 — AI Core**, đây là **trái tim của hệ thống**, được xây dựng bằng **FastAPI và Python**. Tầng này chứa toàn bộ thuật toán AI mà nhóm tự viết, được tổ chức thành 6 module chính:
> - Module **Preprocessing**: xử lý PDF, làm sạch text, chia chunk ngữ nghĩa
> - Module **NLP**: word segmentation tiếng Việt và BPE tokenizer
> - Module **Embedding và Retrieval**: TF-IDF, SVD, BM25, hybrid search
> - Module **Knowledge**: xây dựng Knowledge Graph
> - Module **Inference**: LLM engine và RAG pipeline
> - Module **Adaptive**: quiz thích ứng IRT, FSRS v6, Deep Knowledge Tracer
>
> **Tại sao tách Node.js và Python?** Vì Node.js xử lý I/O và concurrent requests rất nhanh — phù hợp cho API Gateway. Còn Python mạnh về tính toán khoa học — phù hợp cho AI engine. Đây là nguyên tắc **separation of concerns**.
>
> Cuối cùng, **tầng Data** sử dụng SQLite cho metadata, JSON cho cấu hình, và VectorStore in-memory cho vector search. Tất cả chạy local, không cần cài đặt database server riêng.

---

## 📌 SLIDE 4 — DATA INGESTION PIPELINE (1 phút 30 giây)

> Bây giờ em sẽ đi vào chi tiết phần **Data Ingestion Pipeline** — tức là quy trình dữ liệu đi từ file PDF thô cho đến khi trở thành các đoạn text có ngữ nghĩa mà AI có thể xử lý.
>
> Pipeline gồm 3 module tuần tự: **PDF Parser → Text Cleaner → Semantic Chunker**.

### PDF Parser:

> **Đầu tiên là PDF Parser.** Vấn đề ở đây là PDF không phải plain text. Khi extract text từ PDF, chúng ta nhận được các **text block**, mỗi block có tọa độ `(x0, y0, x1, y1)` trên trang. Nếu chỉ đọc từ trên xuống dưới, với tài liệu có **2 cột** — rất phổ biến trong paper học thuật — thì text sẽ bị **đọc sai thứ tự**, trộn lẫn nội dung cột trái và cột phải.
>
> Nhóm giải quyết bằng thuật toán **multi-column detection** tự viết, hoạt động theo heuristic. Cụ thể, hệ thống phân tích **phân bố tọa độ x0** của các block — nếu phát hiện các block tập trung thành **2 cluster riêng biệt** (một cluster ở nửa trái, một ở nửa phải trang), thì đánh dấu trang đó là multi-column. Khi đó, hệ thống sẽ đọc **hết cột trái từ trên xuống**, rồi mới sang **cột phải từ trên xuống** — đảm bảo đúng thứ tự logic.
>
> Ngoài ra, hệ thống còn nhận diện **tiêu đề và heading** bằng cách so sánh font-size. Block nào có font-size **lớn hơn 1.3 lần median** thì được đánh dấu là heading. Điều này giúp phân cấp nội dung cho các bước xử lý sau.

### Text Cleaner:

> **Module thứ hai là Text Cleaner.** Text extract từ PDF thường "bẩn" — chứa ký tự điều khiển, encoding lỗi, HTML entities. Nhóm xây dựng pipeline **6 bước tuần tự**:
> - Bước 1: Chuẩn hóa Unicode bằng **NFC normalization** — đảm bảo cùng một ký tự không bị encode khác nhau
> - Bước 2: Chuyển HTML entities về ký tự thường — ví dụ `&amp;` thành `&`
> - Bước 3: Chuẩn hóa smart quotes — thống nhất các loại dấu ngoặc kép
> - Bước 4 đến 6: Xóa control characters, gộp khoảng trắng thừa, và collapse dòng trống liên tiếp
>
> Pipeline này đảm bảo text đầu ra **sạch và nhất quán**, sẵn sàng cho tokenization và TF-IDF ở các bước sau.

### Semantic Chunker:

> **Module thứ ba và quan trọng nhất là Semantic Chunker.** Đây là điểm khác biệt lớn so với cách tiếp cận phổ biến.
>
> Cách phổ biến nhất hiện nay là **fixed-size chunking** — chia text thành các đoạn 512 token cố định. Nhưng cách này có vấn đề nghiêm trọng: nó có thể **cắt ngang một câu**, cắt ngang một ý, khiến chunk mất ngữ cảnh. Ví dụ, đoạn đang nói về "quang hợp" bị cắt giữa chừng — nửa ở chunk A, nửa ở chunk B.
>
> Nhóm sử dụng thuật toán **Semantic Boundary Detection** dựa trên cosine similarity. Cách hoạt động như sau:
> - Đầu tiên, chia text thành các câu, rồi tạo **sliding windows** — mỗi window gồm 3 câu liên tiếp
> - Với mỗi window, tính **TF-IDF vector**
> - Tính **cosine similarity** giữa 2 windows liên tiếp
> - Khi similarity **giảm đột ngột** xuống dưới ngưỡng `mean - std` → đó chính là **ranh giới ngữ nghĩa** — nơi nội dung chuyển sang chủ đề mới
>
> Ví dụ cụ thể: nếu similarities là `[0.82, 0.79, 0.81, 0.35, 0.78]`, ta thấy giá trị `0.35` giảm đột ngột so với xung quanh. Tại đó, hệ thống xác định đây là boundary và cắt thành 2 chunks riêng biệt.
>
> Ngưỡng `mean - std` là **adaptive** — tự điều chỉnh theo từng tài liệu, không phải giá trị cứng. Tài liệu có nội dung đồng nhất sẽ có ngưỡng cao hơn, tài liệu đa chủ đề sẽ có ngưỡng thấp hơn.

---

## 📌 SLIDE 5 — VIETNAMESE NLP ENGINE (1 phút)

> Slide cuối cùng của phần em là **Vietnamese NLP Engine** — bộ xử lý ngôn ngữ tự nhiên tiếng Việt.

### Word Segmenter:

> Tiếng Việt có đặc thù là **ranh giới từ không được đánh dấu bằng dấu cách**. Ví dụ cụm `"học sinh giỏi"` — nếu tách theo dấu cách, ta được 3 từ đơn `"học"`, `"sinh"`, `"giỏi"`. Nhưng thực tế, `"học sinh"` là **một từ ghép** mang nghĩa riêng. Nếu tách sai, TF-IDF sẽ tính tần suất sai, BM25 search sai, concept extraction cũng sai theo.
>
> Nhóm giải quyết bằng thuật toán **Longest Match First** — tức **tham lam khớp dài nhất**. Cách hoạt động: tại mỗi vị trí, hệ thống thử khớp **chuỗi dài nhất có thể** trong dictionary trước. Ví dụ với input `"trí tuệ nhân tạo đang phát triển"`:
> - Tại vị trí đầu, thử `"trí tuệ nhân tạo"` — 4 âm tiết — **có trong dictionary** → match!
> - Nhảy qua 4 vị trí, thử `"đang"` — 1 âm tiết — match
> - Tiếp tục, `"phát triển"` — 2 âm tiết — match
> - Kết quả: `"trí_tuệ_nhân_tạo | đang | phát_triển"` — chính xác về mặt ngữ nghĩa
>
> Dictionary được xây dựng từ nhiều nguồn, lưu dạng **Set** cho **O(1) lookup**. Hỗ trợ compound words từ 2 đến 4 âm tiết.

### BPE Tokenizer:

> Bên cạnh word segmenter, nhóm cũng tự implement **Byte Pair Encoding Tokenizer** — không dùng thư viện `tokenizers` hay `sentencepiece`.
>
> BPE giải quyết vấn đề **Out-of-Vocabulary**: từ phổ biến giữ nguyên, từ hiếm được chia thành các **subword units** nhỏ hơn. Thuật toán training lặp đi lặp lại: đếm tần suất các cặp ký tự liền kề, merge cặp có tần suất cao nhất, cho đến khi đạt vocab size mong muốn — mặc định 8192 tokens.
>
> BPE Tokenizer này được sử dụng trong LLM Engine để **estimate token count** cho mỗi request — giúp kiểm soát context window mà không cần dùng thư viện `tiktoken` bên ngoài.

### Tại sao tự viết?

> Câu hỏi nhiều người sẽ đặt ra là: **tại sao không dùng VnCoreNLP hay Underthesea?** Câu trả lời nằm ở bảng so sánh:
> - VnCoreNLP cần **Java runtime + 300MB model** — nặng và phức tạp
> - Underthesea cần **PyTorch** — dependency lớn
> - LMF Segmenter của nhóm chỉ cần **1 file dictionary dưới 1MB**, tốc độ xử lý khoảng **50,000 từ/giây**, và quan trọng nhất — **100% white-box**, mọi bước đều trace được.
>
> Đây cũng chính là tinh thần xuyên suốt đồ án: **hiểu rõ từng thuật toán mình dùng**, không phải gọi API rồi nhận kết quả mà không biết bên trong làm gì.

---

### 🔗 CHUYỂN GIAO SANG NGƯỜI 2:

> Như vậy em đã trình bày xong phần **Nền tảng Dữ liệu** — từ cách hệ thống đọc PDF, làm sạch text, chia chunk ngữ nghĩa, đến xử lý ngôn ngữ tiếng Việt. Tất cả đều tự viết, không phụ thuộc thư viện bên ngoài.
>
> Tiếp theo, bạn [Tên Người 2] sẽ trình bày phần **Trí tuệ Hệ thống** — cách hệ thống sử dụng dữ liệu này để hiểu câu hỏi và trả lời thông minh qua RAG Pipeline, LLM Engine, và Knowledge Graph.
>
> Xin mời bạn [Tên Người 2].
