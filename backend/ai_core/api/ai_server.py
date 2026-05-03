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
from embedding.embedding_engine import EmbeddingEngine
from retrieval.bm25 import BM25
from retrieval.vector_store import VectorStore
from retrieval.hybrid_ranker import HybridRanker
from inference.llm_engine import LLMEngine
from inference.rag_pipeline import RAGPipeline
from knowledge.concept_extractor import ConceptExtractor
from knowledge.graph_builder import KnowledgeGraphBuilder
from generation.quiz_generator import QuizGenerator
from generation.flashcard_generator import FlashcardGenerator
from adaptive.spaced_repetition import FSRS

# ──── App Setup ────
app = FastAPI(
    title="NEUROVAULT AI Core",
    description="AI Processing Engine — 100% Local, White-Box",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──── Initialize Modules ────
pdf_parser = PDFParser()
text_cleaner = TextCleaner()
sentence_splitter = SentenceSplitter()
language_detector = LanguageDetector()
semantic_chunker = SemanticChunker(
    window_size=3, similarity_threshold=0.3,
    min_chunk_words=50, max_chunk_words=500,
)
embedding_engine = EmbeddingEngine(mode="tfidf", dim=128)
concept_extractor = ConceptExtractor()
graph_builder = KnowledgeGraphBuilder()
quiz_generator = QuizGenerator()
flashcard_generator = FlashcardGenerator()
fsrs = FSRS()

# LLM Engine (connects to local Ollama)
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "gemma3")
llm_engine = LLMEngine(base_url=OLLAMA_URL, model=LLM_MODEL)

# Per-document RAG storage (in-memory for now)
doc_stores: Dict[str, Dict] = {}

# ──── Request/Response Models ────
class ProcessRequest(BaseModel):
    document_id: str
    file_path: str

class ChatRequest(BaseModel):
    document_id: str
    query: str
    chat_history: List[Dict[str, str]] = []

class QuizRequest(BaseModel):
    document_id: str
    num_questions: int = 10
    difficulty: float = 0.5

class FlashcardRequest(BaseModel):
    document_id: str
    max_cards: int = 20

class ReviewRequest(BaseModel):
    rating: int  # 1-4
    stability: float
    difficulty: float
    elapsed_days: float
    review_count: int

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
    llm_ok = llm_engine.is_available()
    return {
        "status": "ok",
        "service": "NEUROVAULT AI Core v2.0",
        "modules": {
            "pdf_parser": "ready",
            "text_cleaner": "ready",
            "sentence_splitter": "ready",
            "language_detector": "ready",
            "semantic_chunker": "ready",
            "embedding_engine": "ready",
            "bm25": "ready",
            "vector_store": "ready",
            "concept_extractor": "ready",
            "knowledge_graph": "ready",
            "quiz_generator": "ready",
            "flashcard_generator": "ready",
            "fsrs_scheduler": "ready",
            "llm_engine": "connected" if llm_ok else "offline (install Ollama)",
        }
    }


@app.post("/api/process", response_model=ProcessResponse)
def process_document(request: ProcessRequest):
    """
    Full processing pipeline:
    File → Parse → Clean → Detect → Split → Chunk → Embed → Index
    """
    try:
        file_path = request.file_path

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

        # Step 1: Parse
        ext = os.path.splitext(file_path)[1].lower()
        if ext == '.pdf':
            parsed = pdf_parser.parse(file_path)
        else:
            parsed = parse_text_file(file_path)

        raw_text = parsed.text
        if not raw_text or len(raw_text.strip()) < 10:
            raise HTTPException(status_code=422, detail="Could not extract meaningful text.")

        # Step 2: Clean
        cleaned_text = text_cleaner.clean(raw_text)

        # Step 3: Detect Language
        language = language_detector.detect(cleaned_text)

        # Step 4: Split Sentences
        sentences = sentence_splitter.split(cleaned_text)

        # Step 5: Semantic Chunking
        if len(sentences) >= 5:
            chunks = semantic_chunker.chunk(sentences, cleaned_text)
        else:
            chunks = semantic_chunker.chunk_by_size(sentences, cleaned_text, target_size=200)

        # Step 6: Build embeddings + BM25 index
        chunk_dicts = []
        chunk_texts = [c.text for c in chunks]
        
        embedding_engine.fit(chunk_texts)
        bm25 = BM25()
        bm25.index(chunk_texts)
        vector_store = VectorStore(dim=128)

        for chunk in chunks:
            vec = embedding_engine.embed(chunk.text)
            vector_store.add(id=chunk.chunk_id, vector=vec, metadata={"position": chunk.position})

            # Extract concepts for this chunk
            local_concepts = concept_extractor.extract(chunk.text)
            concept_names = [c["concept"] for c in local_concepts[:5]]

            chunk_dicts.append({
                "chunk_id": chunk.chunk_id,
                "text": chunk.text,
                "position": chunk.position,
                "char_start": chunk.char_start,
                "char_end": chunk.char_end,
                "sentence_count": chunk.sentence_count,
                "word_count": chunk.word_count,
                "embedding_vector": vec,
                "sparse_vector": {},
                "concepts": concept_names,
            })

        # Store for RAG retrieval
        doc_stores[request.document_id] = {
            "chunks": chunk_dicts,
            "bm25": bm25,
            "vector_store": vector_store,
            "embedding_engine": embedding_engine,
            "language": language,
        }

        word_count = text_cleaner.count_words(cleaned_text)
        char_count = len(cleaned_text)

        print(f"[AI Core] Processed doc {request.document_id}: "
              f"{word_count} words, {len(chunks)} chunks, lang={language}, "
              f"vectors={vector_store.size()}")

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


@app.post("/api/chat")
def chat_with_document(request: ChatRequest):
    """RAG-powered chat: retrieve relevant chunks → generate answer."""
    doc_id = request.document_id
    
    if doc_id not in doc_stores:
        raise HTTPException(status_code=404, detail="Document not indexed. Process it first.")
    
    store = doc_stores[doc_id]
    
    # Build RAG pipeline
    rag = RAGPipeline(
        embedding_engine=store["embedding_engine"],
        vector_store=store["vector_store"],
        bm25=store["bm25"],
        llm_engine=llm_engine,
        language=store["language"],
    )
    rag.chunk_texts = {c["chunk_id"]: c["text"] for c in store["chunks"]}
    
    # Generate answer
    result = rag.generate_answer(
        query=request.query,
        top_k=5,
        chat_history=request.chat_history,
    )
    
    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "query": result["query"],
        "document_id": doc_id,
    }


@app.post("/api/knowledge-graph")
def build_knowledge_graph(request: ProcessRequest):
    """Build knowledge graph from document chunks."""
    doc_id = request.document_id
    
    if doc_id not in doc_stores:
        raise HTTPException(status_code=404, detail="Document not indexed.")
    
    chunks = doc_stores[doc_id]["chunks"]
    graph = graph_builder.build(chunks, doc_id, user_id="system")
    
    return {
        "document_id": doc_id,
        "graph": graph,
    }


@app.post("/api/quiz")
def generate_quiz(request: QuizRequest):
    """Generate quiz questions from document content."""
    doc_id = request.document_id
    
    if doc_id not in doc_stores:
        raise HTTPException(status_code=404, detail="Document not indexed.")
    
    chunks = doc_stores[doc_id]["chunks"]
    all_text = " ".join(c["text"] for c in chunks)
    concepts = concept_extractor.extract(all_text)
    
    qgen = QuizGenerator(llm_engine=llm_engine if llm_engine.is_available() else None)
    questions = qgen.generate_from_concepts(
        concepts=concepts,
        chunks=chunks,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
    )
    
    return {
        "document_id": doc_id,
        "questions": questions,
        "total": len(questions),
    }


@app.post("/api/flashcards")
def generate_flashcards(request: FlashcardRequest):
    """Generate flashcards from document content."""
    doc_id = request.document_id
    
    if doc_id not in doc_stores:
        raise HTTPException(status_code=404, detail="Document not indexed.")
    
    chunks = doc_stores[doc_id]["chunks"]
    all_text = " ".join(c["text"] for c in chunks)
    concepts = concept_extractor.extract(all_text)
    
    fgen = FlashcardGenerator(llm_engine=llm_engine if llm_engine.is_available() else None)
    cards = fgen.generate(
        concepts=concepts,
        chunks=chunks,
        max_cards=request.max_cards,
    )
    
    return {
        "document_id": doc_id,
        "flashcards": cards,
        "total": len(cards),
    }


@app.post("/api/spaced-repetition/review")
def schedule_review(request: ReviewRequest):
    """Calculate next review schedule using FSRS algorithm."""
    if request.review_count <= 1:
        result = fsrs.initial_review(request.rating)
    else:
        result = fsrs.review(
            rating=request.rating,
            stability=request.stability,
            difficulty=request.difficulty,
            elapsed_days=request.elapsed_days,
            review_count=request.review_count,
        )
    return result


@app.get("/api/concepts/{document_id}")
def get_concepts(document_id: str):
    """Extract key concepts from a document."""
    if document_id not in doc_stores:
        raise HTTPException(status_code=404, detail="Document not indexed.")
    
    chunks = doc_stores[document_id]["chunks"]
    all_text = " ".join(c["text"] for c in chunks)
    concepts = concept_extractor.extract(all_text)
    
    return {
        "document_id": document_id,
        "concepts": concepts,
        "total": len(concepts),
    }


# ──── Run ────
if __name__ == "__main__":
    import uvicorn
    print("""
╔══════════════════════════════════════════════╗
║         NEUROVAULT AI Core v2.0              ║
║         Running on port 8000                 ║
║         100%% Local — White-Box AI            ║
║                                              ║
║  Modules:                                    ║
║    - Document Processing Pipeline            ║
║    - TF-IDF Embedding Engine                 ║
║    - BM25 + Vector Hybrid Retrieval          ║
║    - RAG Pipeline (Ollama/Gemma)             ║
║    - Knowledge Graph Builder                 ║
║    - Quiz & Flashcard Generator              ║
║    - FSRS Spaced Repetition                  ║
╚══════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
