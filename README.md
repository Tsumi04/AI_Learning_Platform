# 🧠 NEUROVAULT — AI Learning Platform

> **Neuromorphic Adaptive Vault of Understanding**
> *Nền tảng học tập AI thế hệ mới — 100% White-Box, không API bên thứ 3*

[![Status](https://img.shields.io/badge/Status-Phase%201%20In%20Progress-yellow)]()
[![AI](https://img.shields.io/badge/AI-100%25%20White--Box-brightgreen)]()
[![Languages](https://img.shields.io/badge/Languages-Vietnamese%20%2B%20English-blue)]()
[![Standard](https://img.shields.io/badge/Standard-International-purple)]()

---

## 📋 MỤC LỤC

- [Tổng Quan Dự Án](#-tổng-quan-dự-án)
- [Triết Lý Thiết Kế](#-triết-lý-thiết-kế)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Thông Số Phần Cứng](#-thông-số-phần-cứng)
- [Tech Stack](#-tech-stack)
- [Lộ Trình 6 Pha](#-lộ-trình-6-pha)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Tài Liệu Chi Tiết](#-tài-liệu-chi-tiết)
- [Tiến Độ Dự Án](#-tiến-độ-dự-án)
- [Quy Tắc Phát Triển](#-quy-tắc-phát-triển)

---

## 🎯 TỔNG QUAN DỰ ÁN

**NEUROVAULT** là một AI Learning Platform hoàn toàn **tự xây dựng từ đầu (from-scratch)**, không sử dụng bất kỳ API bên thứ 3 nào. Mọi thuật toán AI — từ NLP pipeline, embedding engine, knowledge graph cho tới language model — đều được thiết kế, huấn luyện và triển khai **100% white-box**.

### Điểm khác biệt cốt lõi so với Coursera, Duolingo, Notion AI, Quizlet:

| Nền tảng khác | NEUROVAULT |
|---|---|
| Content push (đẩy nội dung tĩnh) | **Brain-first** (xây Neural Profile cho từng user) |
| Black-box AI (gọi API GPT/Claude) | **White-box** (tự viết mọi thuật toán) |
| Syllabus cứng nhắc | **Fluid Learning Path** (biến đổi real-time) |
| Quiz ngẫu nhiên | **Adaptive Quiz** (sinh từ Knowledge Graph) |
| Flashcard thủ công | **Auto-generated + SM-2+ thông minh** |

### Ngôn ngữ hỗ trợ
- 🇻🇳 Tiếng Việt  
- 🇺🇸 Tiếng Anh

### Tiêu chuẩn: **Quốc tế** — Scalable cho hàng triệu users & documents

---

## 💡 TRIẾT LÝ THIẾT KẾ

### 5 Trụ Cột:
1. **🧬 Neural Profile Engine** — Mỗi user = 1 Knowledge Graph riêng + Forgetting Curve cá nhân hóa
2. **🔬 White-Box AI Pipeline** — 100% thuật toán tự viết, transparent reasoning
3. **📊 Cognitive Analytics** — Biểu đồ sức mạnh tri thức, dự đoán điểm yếu
4. **🎯 Generative Assessment** — Quiz + Flashcard sinh từ AI, distractor thông minh
5. **🌊 Fluid Learning Path** — Lộ trình biến đổi theo real-time, không syllabus cứng nhắc

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 7: FRONTEND — React 18 + Vite 5 + TailwindCSS       │
│  Dashboard / Chat / Quiz / Graph Viz / Analytics            │
├─────────────────────────────────────────────────────────────┤
│  LAYER 6: API GATEWAY — Node.js + Express                   │
│  REST + WebSocket / Auth (JWT) / Document CRUD              │
├─────────────────────────────────────────────────────────────┤
│  LAYER 5: AI ORCHESTRATOR — Python FastAPI                   │
│  Intent Router / Context Builder / Response Synthesizer     │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: CORE AI ENGINES — Python (From Scratch)            │
│  NLP Pipeline / Embedding Engine / GPT-nano / Knowledge Graph│
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: LEARNING INTELLIGENCE — Python                     │
│  Spaced Repetition / Quiz Generator / Learning Path          │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: DATA LAYER                                         │
│  MongoDB / Local FAISS Vector Store / File Storage           │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: DATA FOUNDATION — Python                           │
│  PDF Parser / OCR / Text Cleaner / Semantic Chunker          │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 THÔNG SỐ PHẦN CỨNG PHÁT TRIỂN

| Thành phần | Thông số |
|---|---|
| **Máy** | Lenovo IdeaPad Gaming 3 15IHU6 |
| **CPU** | 11th Gen Intel Core i5-11320H @ 3.20GHz |
| **RAM** | 16GB (15.8GB usable) |
| **GPU** | ✅ NVIDIA GeForce GTX 1650 4GB VRAM, CUDA 12.0 |
| **OS** | Windows 11 Home 25H2 |
| **System** | 64-bit, x64 processor |

### ⚠️ Ảnh hưởng tới chiến lược AI:
- GPT-nano sẽ được **tối ưu cho 4GB VRAM** (giảm batch size, dùng gradient accumulation)
- Nếu không có GPU rời → fallback sang **CPU training** với model nhỏ hơn (6M params)
- FAISS sử dụng **faiss-cpu**, tối ưu indexing cho 16GB RAM
- Training lâu hơn nhưng **hoàn toàn khả thi** trên cấu hình này

---

## 🛠️ TECH STACK

### Frontend
| Công nghệ | Version | Vai trò |
|---|---|---|
| React | 18.x | UI Framework |
| Vite | 5.x | Build tool |
| TailwindCSS | 3.x | Styling |
| Zustand | 4.x | State management |
| D3.js | 7.x | Knowledge Graph visualization |
| Chart.js | 4.x | Learning analytics charts |

### Backend — API Gateway
| Công nghệ | Version | Vai trò |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | HTTP framework |
| MongoDB | 7.x | Database |
| Mongoose | 8.x | ODM |
| JSON Web Token | - | Authentication |
| Socket.IO | 4.x | Real-time chat |

### Backend — AI Core (Python)
| Công nghệ | Version | Vai trò |
|---|---|---|
| Python | 3.10+ | AI runtime |
| PyTorch | 2.x | Model training |
| ONNX Runtime | 1.16+ | Inference |
| FAISS (CPU) | 1.7+ | Vector search |
| FastAPI | 0.100+ | AI API server |
| NumPy | 1.24+ | Numerical computing |
| PyMuPDF (fitz) | 1.23+ | PDF parsing |
| NetworkX | 3.x | Knowledge Graph |

---

## 🗺️ LỘ TRÌNH 6 PHA

| Pha | Tên | Thời gian | Trạng thái | Tài liệu |
|---|---|---|---|---|
| **1** | Data Foundation | Tuần 1-3 | 🟡 Chưa bắt đầu | [PHASE_1](docs/PHASE_1_DATA_FOUNDATION.md) |
| **2** | Embedding & Retrieval | Tuần 4-6 | ⚪ Chờ | [PHASE_2](docs/PHASE_2_EMBEDDING_RETRIEVAL.md) |
| **3** | NLP & Knowledge Graph | Tuần 7-10 | ⚪ Chờ | [PHASE_3](docs/PHASE_3_NLP_KNOWLEDGE_GRAPH.md) |
| **4** | GPT-nano & Generation | Tuần 11-15 | ⚪ Chờ | [PHASE_4](docs/PHASE_4_GPT_NANO_GENERATION.md) |
| **5** | Learning Intelligence | Tuần 16-19 | ⚪ Chờ | [PHASE_5](docs/PHASE_5_LEARNING_INTELLIGENCE.md) |
| **6** | Polish & Production | Tuần 20-24 | ⚪ Chờ | [PHASE_6](docs/PHASE_6_POLISH_PRODUCTION.md) |

**Tiến độ tổng thể:** `░░░░░░░░░░░░░░░░░░░░` 0% (Frontend Shell hoàn thành)

---

## 📁 CẤU TRÚC THƯ MỤC

```
AI_Learning_Platform/
├── .agents/                           # Luật lệ cho AI Agent
│   └── strict_context_rules.md
├── docs/                              # Tài liệu kỹ thuật chi tiết
│   ├── PHASE_1_DATA_FOUNDATION.md
│   ├── PHASE_2_EMBEDDING_RETRIEVAL.md
│   ├── PHASE_3_NLP_KNOWLEDGE_GRAPH.md
│   ├── PHASE_4_GPT_NANO_GENERATION.md
│   ├── PHASE_5_LEARNING_INTELLIGENCE.md
│   └── PHASE_6_POLISH_PRODUCTION.md
├── frontend/                          # React + Vite (đã có shell)
│   └── src/
│       ├── components/
│       ├── pages/
│       └── store/
├── backend/                           # (Sẽ tạo ở Phase 1)
│   ├── server/                        # Node.js API Gateway
│   └── ai_core/                       # Python AI Engine
├── PROGRESS.md                        # Tiến độ chi tiết từng task
└── README.md                          # File này
```

---

## 📚 TÀI LIỆU CHI TIẾT

| File | Nội dung |
|---|---|
| [PROGRESS.md](PROGRESS.md) | **Tiến độ chi tiết** — checklist từng task, cập nhật liên tục |
| [MASTER_BLUEPRINT.md](docs/MASTER_BLUEPRINT.md) | **Master Blueprint** — kiến trúc tổng thể, thuật toán chi tiết |
| [docs/PHASE_1](docs/PHASE_1_DATA_FOUNDATION.md) | PDF Parser, Text Cleaner, Chunker, MongoDB, Express API |
| [docs/PHASE_2](docs/PHASE_2_EMBEDDING_RETRIEVAL.md) | Word2Vec, MiniLM ONNX, BM25, FAISS, Hybrid Search |
| [docs/PHASE_3](docs/PHASE_3_NLP_KNOWLEDGE_GRAPH.md) | Tokenizer, POS/NER, Concept Extraction, Knowledge Graph |
| [docs/PHASE_4](docs/PHASE_4_GPT_NANO_GENERATION.md) | Transformer Architecture, Training, RAG Pipeline |
| [docs/PHASE_5](docs/PHASE_5_LEARNING_INTELLIGENCE.md) | Spaced Repetition, Quiz Generator, Learning Path |
| [docs/PHASE_6](docs/PHASE_6_POLISH_PRODUCTION.md) | UI Polish, Performance, Security, Production Deploy |
| [.agents/strict_context_rules.md](.agents/strict_context_rules.md) | Luật lệ bắt buộc cho mọi AI Agent |

---

## 📊 TIẾN ĐỘ DỰ ÁN

Xem chi tiết tại **[PROGRESS.md](PROGRESS.md)**

### Tổng quan nhanh:
- ✅ Frontend Shell (Login, Register, Dashboard, Chat UI, Profile)
- ✅ Agent Rules (strict_context_rules.md)
- 🟡 Phase 1: Data Foundation — **ĐANG TIẾN HÀNH**
- ⚪ Phase 2-6: Chưa bắt đầu

---

## 📏 QUY TẮC PHÁT TRIỂN

### ❌ TUYỆT ĐỐI KHÔNG:
- Gọi API OpenAI, Anthropic, Google AI, hoặc bất kỳ AI API trả phí nào
- Sử dụng LangChain, Haystack, hoặc wrapper gọi API
- Dùng Pinecone, Weaviate Cloud, hoặc vector DB trả phí
- Bịa ra (hallucinate) thư viện không tồn tại

### ✅ BẮT BUỘC:
- Mọi thuật toán AI phải tự viết hoặc dùng library open-source chạy local
- Mọi model phải tự train hoặc load pre-trained local (ONNX/PyTorch)
- White-box: hiểu rõ từng công thức toán, từng gradient, từng loss function
- Unit test cho mọi module AI
- Cập nhật PROGRESS.md sau mỗi task hoàn thành

---

## 📝 GIẤY PHÉP

Dự án nội bộ. Mọi quyền được bảo lưu.

---

*Ký tên: Master NLP / AI Deep Learning*
*Ngày khởi tạo: 12/04/2026*