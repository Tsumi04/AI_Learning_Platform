"""
NEUROVAULT — AI Core API Server (FastAPI)
Nhận requests từ Node.js API Gateway → xử lý bằng AI pipeline → trả kết quả.
Chạy 100% local, KHÔNG gọi API bên ngoài nào.
"""

import os
import sys
import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.pdf_parser import PDFParser, parse_text_file
from preprocessing.text_cleaner import TextCleaner
from preprocessing.sentence_splitter import SentenceSplitter
from preprocessing.language_detector import LanguageDetector
from preprocessing.semantic_chunker import SemanticChunker

# ──── App Setup ────
app = FastAPI(
    title="NEUROVAULT AI Core",
    description="AI Processing Engine — 100% Local, White-Box",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──── Initialize Modules ────
pdf_parser = PDFParser()
text_cleaner = TextCleaner()
sentence_splitter = SentenceSplitter()
language_detector = LanguageDetector()
semantic_chunker = SemanticChunker(
    window_size=3,
    similarity_threshold=0.3,
    min_chunk_words=50,
    max_chunk_words=500,
)


# ──── Request/Response Models ────
class ProcessRequest(BaseModel):
    document_id: str
    file_path: str


class ChunkResponse(BaseModel):
    chunk_id: str
    text: str
    position: int
    char_start: int = 0
    char_end: int = 0
    sentence_count: int = 0
    word_count: int = 0


class ProcessResponse(BaseModel):
    document_id: str
    raw_text: str
    language: str
    chunks: List[Dict[str, Any]]
    word_count: int
    page_count: int
    char_count: int
    title: str


# ──── Endpoints ────

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "NEUROVAULT AI Core",
        "modules": {
            "pdf_parser": "ready",
            "text_cleaner": "ready",
            "sentence_splitter": "ready",
            "language_detector": "ready",
            "semantic_chunker": "ready",
        }
    }


@app.post("/api/process", response_model=ProcessResponse)
def process_document(request: ProcessRequest):
    """
    Main processing pipeline:
    File → Parse → Clean → Detect Language → Split Sentences → Semantic Chunk

    Nhận file_path từ Node.js gateway → xử lý hoàn toàn local → trả structured data.
    """
    try:
        file_path = request.file_path

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        # ── Step 1: Parse ──
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            parsed = pdf_parser.parse(file_path)
        elif ext in ('.txt', '.md'):
            parsed = parse_text_file(file_path)
        else:
            # Try as text file
            parsed = parse_text_file(file_path)

        raw_text = parsed.text

        if not raw_text or len(raw_text.strip()) < 10:
            raise HTTPException(
                status_code=422,
                detail="Could not extract meaningful text from the file."
            )

        # ── Step 2: Clean ──
        cleaned_text = text_cleaner.clean(raw_text)

        # ── Step 3: Detect Language ──
        language = language_detector.detect(cleaned_text)

        # ── Step 4: Split Sentences ──
        sentences = sentence_splitter.split(cleaned_text)

        # ── Step 5: Semantic Chunking ──
        if len(sentences) >= 5:
            chunks = semantic_chunker.chunk(sentences, cleaned_text)
        else:
            # Too few sentences → fallback to simple chunking
            chunks = semantic_chunker.chunk_by_size(sentences, cleaned_text, target_size=200)

        # ── Step 6: Build Response ──
        chunk_dicts = []
        for chunk in chunks:
            chunk_dicts.append({
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "position": chunk.position,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "sentence_count": chunk.sentence_count,
                "word_count": chunk.word_count,
                "embedding_vector": [],  # Sẽ được fill ở Phase 2
                "sparse_vector": {},     # Sẽ được fill ở Phase 2
                "concepts": [],          # Sẽ được fill ở Phase 3
            })

        word_count = text_cleaner.count_words(cleaned_text)
        char_count = len(cleaned_text)

        print(f"[AI Core] Processed doc {request.document_id}: "
              f"{word_count} words, {len(chunks)} chunks, lang={language}")

        return ProcessResponse(
            document_id=request.document_id,
            raw_text=cleaned_text,
            language=language,
            chunks=chunk_dicts,
            word_count=word_count,
            page_count=parsed.page_count,
            char_count=char_count,
            title=parsed.title,
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


# ──── Run ────
if __name__ == "__main__":
    import uvicorn
    print("""
╔══════════════════════════════════════════════╗
║         NEUROVAULT AI Core                   ║
║         Running on port 8000                 ║
║         100%% Local — White-Box AI            ║
╚══════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
