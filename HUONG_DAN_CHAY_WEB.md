# Hướng Dẫn Chạy NeuroVault Bằng Terminal

Nếu bạn gặp khó khăn khi sử dụng các file script tự động (`dev.bat` hoặc `dev.ps1`), bạn có thể khởi động ứng dụng thủ công bằng cách mở **3 cửa sổ Terminal (Command Prompt hoặc PowerShell)** riêng biệt và chạy các lệnh dưới đây.

---

### Bước 1: Khởi động Ollama (Tùy chọn - Dành cho tính năng AI)
Nếu bạn có sử dụng các tính năng suy luận AI local, hãy đảm bảo Ollama đang chạy. 
Bạn có thể mở một terminal và chạy lệnh:
```bash
ollama serve
```
*(Nếu Ollama đã chạy ngầm trên khay hệ thống thì bạn có thể bỏ qua bước này).*

---

### Bước 2: Khởi động AI Core (Python FastAPI)
Mở một cửa sổ Terminal mới, điều hướng đến thư mục dự án và chạy các lệnh sau:

```bash
# 1. Di chuyển vào thư mục ai_core
cd backend/ai_core

# 2. Khởi động server AI (mặc định chạy ở port 8000)
python api/ai_server.py
```
> **Lưu ý:** Đảm bảo bạn đã cài đặt đủ các thư viện Python (nếu chưa cài, hãy chạy `pip install -r requirements.txt`).

---

### Bước 3: Khởi động Backend Gateway (Node.js)
Mở cửa sổ Terminal thứ 2, điều hướng đến thư mục dự án và chạy:

```bash
# 1. Di chuyển vào thư mục server
cd backend/server

# 2. Khởi động server Node.js (mặc định chạy ở port 5001)
node index.js
```
> **Lưu ý:** Nếu báo thiếu thư viện, hãy chạy `npm install` trước.

---

### Bước 4: Khởi động Frontend (React / Vite)
Mở cửa sổ Terminal thứ 3, điều hướng đến thư mục dự án và chạy:

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Khởi động giao diện web (mặc định chạy ở port 5173)
npm run dev
```
> **Lưu ý:** Nếu báo lỗi chưa có package, hãy chạy `npm install` trước.

---

### 🌐 Truy Cập Ứng Dụng
Sau khi cả 3 services đều đã báo chạy thành công, bạn mở trình duyệt và truy cập vào địa chỉ:
**[http://localhost:5173](http://localhost:5173)**

*Để tắt các service, bạn chỉ cần quay lại các cửa sổ terminal và nhấn `Ctrl + C`.*
