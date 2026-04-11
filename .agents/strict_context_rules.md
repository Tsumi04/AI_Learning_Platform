# LUẬT LỆ TỐI THƯỢNG CHO MỌI AI AGENT (STRICT SYSTEM RULES)

**CẢNH BÁO:** Đây là tập hợp những luật lệ bất di bất dịch (Immutable Rules) được thiết lập bởi Master NLP/DL. Mọi AI Agent (bao gồm cả Antigravity) khi truy cập, đọc, hoặc thao tác trên codebase này **BẮT BUỘC MỘT CÁCH TUYỆT ĐỐI** phải tuân thủ. Bất kỳ sự chệch hướng, đánh mất context ("hội chứng đần") hay ảo giác (hallucination) nào đều không thể chấp nhận được.

## 1. KHÔNG LỆ THUỘC API NGOẠI VI (ZERO EXTERNAL API ALLOWED)
- Mọi tính năng AI, sinh ngôn ngữ, phân tích ngữ nghĩa, embeddings, và truy xuất dữ liệu (Retrieval/Search) phải được tự xây dựng thuật toán cục bộ (Local Model/Custom Algorithms).
- **Tuyệt đối cấm** việc đề xuất hay tự động sử dụng: OpenAI (GPT-3/4), Anthropic (Claude), Google (PaLM/Gemini API), Haystack/Langchain wrappers gọi API trả phí, Pinecone (Cloud Vector DB), etc.

## 2. QUẢN LÝ NGỮ CẢNH VÀ TRÍ NHỚ ĐỊA PHƯƠNG (CONTEXT & MEMORY RETENTION)
- Agent phải luôn luôn quét và ghi nhớ lại lộ trình phát triển định sẵn trước khi đưa ra bất kỳ thay đổi nào. Không được quên logic của codebase hoặc đưa ra lời khuyên chung chung (bệnh "amnesia" của AI).
- Phải đọc toàn bộ các tệp kiến trúc trước khi suy luận. Không đưa ra assumption về sự tồn tại của các thư viện phần mềm chưa được cài đặt.

## 3. CHUẨN MỰC TỰ XÂY DỰNG TỪ ĐẦU (FROM-SCRATCH PARADIGM)
- Khi nhắc tới Embedding: Ưu tiên tự code feed-forward network, Word2Vec, hoặc tự load HuggingFace models dạng local (e.g., MiniLM, BERT) lên bộ nhớ bằng ONNX hoặc PyTorch local.
- Khi nhắc tới LLM Inference: Sử dụng C++ binding (llama.cpp) hoặc MLC LLM để tối ưu cho môi trường local.
- Khi nhắc tới Vector Search: Cấm gọi API trả phí. Xây dựng faiss local, hnswlib hoặc tự code thuật toán tính cosine similarity/L2 khoảng cách trên memory/disk.
- Khi làm RAG: Tự viết thuật toán chunking văn bản, tự viết thuật toán bm25/TF-IDF mix với Dense retrieval, KHÔNG DÙNG THƯ VIỆN ĐÓNG GÓI SẴN gây black-box.

## 4. TỪ CHỐI BULLSHIT CODE (NO HALLUCINATED LIBRARIES)
- Không bịa ra (hallucinate) các thư viện hay module không hề tồn tại trong `package.json` hoặc `requirements.txt`.
- Nếu cần một công cụ, Agent phải đề xuất cài đặt nó tường minh (Ví dụ: `pip install faiss-cpu transformers torch`) và phải chứng minh lý do, không lạm dụng bloatware.

## 5. BÁO CÁO NGAY LẬP TỨC NẾU CÓ XUNG ĐỘT (IMMEDIATE ESCALATION)
- Nếu context quá dài dẫn đến bị quên mất bất cứ luật nào ở trên, AI Agent buộc phải tự reset logic của bản thân, đọc lại file này từ đầu thay vì sinh ra mã không nhất quán.

*Ký Tên:* Master NLP / AI Deep Learning.
