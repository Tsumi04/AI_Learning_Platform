"""
NEUROVAULT — RAG Pipeline (White-Box)
Retrieval-Augmented Generation: Retrieve relevant chunks → Generate answer.
"""

from typing import List, Dict, Optional
from ..retrieval.bm25 import BM25
from ..retrieval.vector_store import VectorStore
from ..retrieval.hybrid_ranker import HybridRanker
from ..embedding.embedding_engine import EmbeddingEngine
from .llm_engine import LLMEngine


SYSTEM_PROMPT_EN = """You are NeuroVault AI — an intelligent learning assistant. 
You answer questions based ONLY on the provided document context.
Rules:
1. Always ground your answers in the provided context.
2. If the context doesn't contain enough information, say so honestly.
3. Cite specific passages when possible using [Source: chunk_id].
4. Keep answers clear, educational, and well-structured.
5. Support both English and Vietnamese."""

SYSTEM_PROMPT_VI = """Bạn là NeuroVault AI — trợ lý học tập thông minh.
Bạn trả lời câu hỏi DỰA TRÊN NỘI DUNG tài liệu được cung cấp.
Quy tắc:
1. Luôn dựa vào ngữ cảnh tài liệu để trả lời.
2. Nếu không đủ thông tin, hãy nói rõ.
3. Trích dẫn đoạn văn cụ thể khi có thể.
4. Trả lời rõ ràng, mang tính giáo dục, có cấu trúc.
5. Hỗ trợ cả tiếng Anh và tiếng Việt."""


class RAGPipeline:
    """
    Full RAG pipeline:
    1. Query → Embed
    2. Hybrid Retrieval (BM25 + Vector)
    3. Context Assembly
    4. LLM Generation
    """

    def __init__(
        self,
        embedding_engine: EmbeddingEngine,
        vector_store: VectorStore,
        bm25: BM25,
        llm_engine: LLMEngine,
        language: str = "en",
    ):
        self.embedding = embedding_engine
        self.vector_store = vector_store
        self.bm25 = bm25
        self.llm = llm_engine
        self.ranker = HybridRanker()
        self.language = language
        self.chunk_texts: Dict[str, str] = {}

    def index_chunks(self, chunks: List[Dict]) -> None:
        """Index document chunks for retrieval."""
        texts = [c["text"] for c in chunks]
        ids = [c["chunk_id"] for c in chunks]

        # Fit embedding engine
        self.embedding.fit(texts)

        # Build BM25 index
        self.bm25.index(texts)

        # Build vector store
        for chunk in chunks:
            vec = self.embedding.embed(chunk["text"])
            self.vector_store.add(
                id=chunk["chunk_id"],
                vector=vec,
                metadata={"position": chunk.get("position", 0)}
            )
            self.chunk_texts[chunk["chunk_id"]] = chunk["text"]

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict]:
        """Retrieve relevant chunks using hybrid search."""
        # Dense retrieval
        query_vec = self.embedding.embed(query)
        dense_results = self.vector_store.search(query_vec, top_k=top_k * 2)
        dense_formatted = [(id_, score) for id_, score, _ in dense_results]

        # Sparse retrieval (BM25)
        sparse_raw = self.bm25.search(query, top_k=top_k * 2)
        # Map BM25 indices back to chunk IDs
        chunk_ids_list = list(self.chunk_texts.keys())
        sparse_formatted = []
        for idx, score in sparse_raw:
            if idx < len(chunk_ids_list):
                sparse_formatted.append((chunk_ids_list[idx], score))

        # Hybrid fusion
        results = self.ranker.rerank_with_scores(
            dense_results=dense_formatted,
            sparse_results=sparse_formatted,
            chunk_texts=self.chunk_texts,
            query=query,
            top_k=top_k,
        )

        return results

    def generate_answer(
        self,
        query: str,
        top_k: int = 5,
        temperature: float = 0.7,
        chat_history: List[Dict] = None,
    ) -> Dict:
        """
        Full RAG: Retrieve → Augment → Generate.
        Returns: {"answer": str, "sources": List[Dict], "query": str}
        """
        # Step 1: Retrieve
        retrieved = self.retrieve(query, top_k=top_k)

        if not retrieved:
            return {
                "answer": "I couldn't find relevant information in the document for this question.",
                "sources": [],
                "query": query,
            }

        # Step 2: Build context
        context_parts = []
        for i, r in enumerate(retrieved):
            context_parts.append(f"[Passage {i+1} | {r['chunk_id']}]\n{r['text']}")
        context = "\n\n---\n\n".join(context_parts)

        # Step 3: Build prompt
        system = SYSTEM_PROMPT_VI if self.language == "vi" else SYSTEM_PROMPT_EN
        
        user_prompt = f"""Context from document:
{context}

---

Question: {query}

Please provide a comprehensive, educational answer based on the context above."""

        # Step 4: Generate with LLM
        messages = [{"role": "system", "content": system}]
        
        if chat_history:
            for msg in chat_history[-6:]:  # Last 3 turns
                messages.append(msg)
        
        messages.append({"role": "user", "content": user_prompt})

        answer = self.llm.chat(messages, temperature=temperature)

        return {
            "answer": answer,
            "sources": retrieved,
            "query": query,
        }
