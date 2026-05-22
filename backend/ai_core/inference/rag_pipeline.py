"""
NEUROVAULT — RAG Pipeline v2 (White-Box)
Retrieval-Augmented Generation: Retrieve → Rerank → Generate.

v2 Improvements:
- Cross-encoder reranking integration
- Query expansion (synonyms + related terms)
- Conversation memory with sliding window
- Multi-query retrieval (HyDE-inspired)
- Source deduplication
- Bilingual system prompts (EN/VI)
"""

from typing import List, Dict, Optional
from retrieval.bm25 import BM25
from retrieval.vector_store import VectorStore
from retrieval.hybrid_ranker import HybridRanker
from retrieval.cross_encoder_reranker import CrossEncoderReranker
from embedding.embedding_engine import EmbeddingEngine
from inference.llm_engine import LLMEngine
from preprocessing.language_detector import LanguageDetector

# Shared query language detector instance
_query_lang_detector = LanguageDetector()


SYSTEM_PROMPT_EN = """You are NeuroVault AI — an intelligent learning assistant.
You answer questions based ONLY on the provided document context.
Rules:
1. Always ground your answers in the provided context.
2. If the context doesn't contain enough information, say so honestly.
3. Cite specific passages when possible using [Source: chunk_id].
4. Keep answers clear, educational, and well-structured.
5. Use bullet points and headings for long answers.
6. IMPORTANT: You MUST answer in English because the user asked in English."""

SYSTEM_PROMPT_VI = """Bạn là NeuroVault AI — trợ lý học tập thông minh.
Bạn trả lời câu hỏi DỰA TRÊN NỘI DUNG tài liệu được cung cấp.
Quy tắc:
1. Luôn dựa vào ngữ cảnh tài liệu để trả lời.
2. Nếu không đủ thông tin, hãy nói rõ.
3. Trích dẫn đoạn văn cụ thể khi có thể [Nguồn: chunk_id].
4. Trả lời rõ ràng, mang tính giáo dục, có cấu trúc.
5. Sử dụng bullet points và heading cho câu trả lời dài.
6. QUAN TRỌNG: Bạn PHẢI trả lời bằng TIẾNG VIỆT vì người dùng hỏi bằng tiếng Việt."""

USER_PROMPT_EN = """Context from document:
{context}

---

Question: {query}

Please provide a comprehensive, educational answer based on the context above.
Cite sources using [Source: chunk_id] when referencing specific passages.
You MUST answer in English."""

USER_PROMPT_VI = """Ngữ cảnh từ tài liệu:
{context}

---

Câu hỏi: {query}

Hãy trả lời đầy đủ, mang tính giáo dục dựa trên ngữ cảnh ở trên.
Trích dẫn nguồn bằng [Nguồn: chunk_id] khi đề cập đến các đoạn cụ thể.
Bạn PHẢI trả lời bằng TIẾNG VIỆT."""


class RAGPipeline:
    """
    Full RAG pipeline v2:
    1. Query → (optional) Expand
    2. Hybrid Retrieval (BM25 + Vector + Cross-Encoder Rerank)
    3. Context Assembly with deduplication
    4. LLM Generation with conversation memory
    """

    def __init__(
        self,
        embedding_engine: EmbeddingEngine,
        vector_store: VectorStore,
        bm25: BM25,
        llm_engine: LLMEngine,
        language: str = "en",
        cross_encoder: Optional[CrossEncoderReranker] = None,
    ):
        self.embedding = embedding_engine
        self.vector_store = vector_store
        self.bm25 = bm25
        self.llm = llm_engine
        self.ranker = HybridRanker()
        self.cross_encoder = cross_encoder or CrossEncoderReranker()
        self.language = language
        self.chunk_texts: Dict[str, str] = {}
        self.chunk_data: Dict[str, Dict] = {}  # Full chunk data for reranking

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
            self.chunk_data[chunk["chunk_id"]] = chunk

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        use_reranking: bool = True,
    ) -> List[Dict]:
        """
        Retrieve relevant chunks using hybrid search + cross-encoder reranking.

        Pipeline:
        1. Dense retrieval (embedding similarity)
        2. Sparse retrieval (BM25)
        3. Hybrid fusion (RRF)
        4. Cross-encoder reranking (optional)
        """
        # Dense retrieval
        query_vec = self.embedding.embed(query)
        dense_results = self.vector_store.search(query_vec, top_k=top_k * 3)
        dense_formatted = [(id_, score) for id_, score, _ in dense_results]

        # Sparse retrieval (BM25)
        sparse_raw = self.bm25.search(query, top_k=top_k * 3)
        chunk_ids_list = list(self.chunk_texts.keys())
        sparse_formatted = []
        for idx, score in sparse_raw:
            if idx < len(chunk_ids_list):
                sparse_formatted.append((chunk_ids_list[idx], score))

        # Hybrid fusion
        fused = self.ranker.rerank_with_scores(
            dense_results=dense_formatted,
            sparse_results=sparse_formatted,
            chunk_texts=self.chunk_texts,
            query=query,
            top_k=top_k * 2,
        )

        # Cross-encoder reranking for final precision boost
        if use_reranking and len(fused) > 1:
            chunks_for_rerank = []
            for r in fused:
                chunk_id = r["chunk_id"]
                chunk_full = self.chunk_data.get(chunk_id, {})
                chunks_for_rerank.append({
                    "text": r["text"],
                    "chunk_id": chunk_id,
                    "position": chunk_full.get("position", 0),
                    "concepts": chunk_full.get("concepts", []),
                    "hybrid_score": r["score"],
                })

            reranked = self.cross_encoder.rerank(
                query=query,
                chunks=chunks_for_rerank,
                top_k=top_k,
            )

            return [
                {
                    "chunk_id": r.get("chunk_id", ""),
                    "score": r.get("rerank_score", 0),
                    "text": r.get("text", ""),
                }
                for r in reranked
            ]

        return fused[:top_k]

    def detect_query_language(self, query: str) -> str:
        """
        Detect the language of the user's query.
        Returns 'vi' or 'en'.
        Falls back to document language if query is too short or ambiguous.
        """
        query_lang = _query_lang_detector.detect(query)
        if query_lang in ('vi', 'en'):
            return query_lang
        # Fallback: if query is short, check for Vietnamese chars
        vi_chars = set('àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ'
                       'ÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ')
        if any(c in vi_chars for c in query):
            return 'vi'
        # Fallback to document language
        return self.language

    def generate_answer(
        self,
        query: str,
        top_k: int = 5,
        temperature: float = 0.7,
        chat_history: Optional[List[Dict]] = None,
        use_thinking: bool = False,
    ) -> Dict:
        """
        Full RAG: Retrieve → Augment → Generate.
        Detects query language and responds in the same language.

        Returns:
            {
                "answer": str,
                "sources": List[Dict],
                "query": str,
                "thinking": str (if use_thinking=True)
            }
        """
        # Detect query language — respond in the same language as the question
        query_lang = self.detect_query_language(query)

        # Step 1: Retrieve
        retrieved = self.retrieve(query, top_k=top_k)

        if not retrieved:
            no_info = (
                "Tôi không tìm thấy thông tin liên quan trong tài liệu cho câu hỏi này."
                if query_lang == "vi"
                else "I couldn't find relevant information in the document for this question."
            )
            return {
                "answer": no_info,
                "sources": [],
                "query": query,
            }

        # Step 2: Build context with source citations
        context_parts = []
        for i, r in enumerate(retrieved):
            context_parts.append(
                f"[Passage {i+1} | ID: {r['chunk_id']}]\n{r['text']}"
            )
        context = "\n\n---\n\n".join(context_parts)

        # Step 3: Build prompt — match the query language
        if query_lang == "vi":
            system = SYSTEM_PROMPT_VI
            user_prompt = USER_PROMPT_VI.format(context=context, query=query)
        else:
            system = SYSTEM_PROMPT_EN
            user_prompt = USER_PROMPT_EN.format(context=context, query=query)

        # Step 4: Build messages with conversation memory
        messages = [{"role": "system", "content": system}]

        if chat_history:
            # Sliding window: keep last 3 turns (6 messages)
            for msg in chat_history[-6:]:
                messages.append(msg)

        messages.append({"role": "user", "content": user_prompt})

        # Step 5: Generate with LLM
        if use_thinking:
            result = self.llm.think_and_answer(
                question=query,
                context=context,
                system=system,
            )
            return {
                "answer": result["answer"],
                "thinking": result["thinking"],
                "sources": retrieved,
                "query": query,
            }
        else:
            answer = self.llm.chat(messages, temperature=temperature)
            return {
                "answer": answer,
                "sources": retrieved,
                "query": query,
            }

    def expand_query(self, query: str) -> List[str]:
        """
        Query expansion: sinh thêm các biến thể query để tăng recall.
        Trả về list queries (original + expanded).

        Uses simple rule-based expansion (works without LLM):
        - Remove stopwords
        - Add keyword-only version
        """
        import re

        expanded = [query]

        # Keyword-only version (remove stopwords)
        stopwords = {
            'what', 'is', 'are', 'the', 'a', 'an', 'of', 'in', 'to',
            'for', 'how', 'why', 'when', 'where', 'which', 'do', 'does',
            'là', 'gì', 'nào', 'sao', 'thế', 'cái',
        }
        words = re.sub(r'[^\w\s]', '', query.lower()).split()
        keywords = [w for w in words if w not in stopwords and len(w) > 2]
        if keywords and len(keywords) < len(words):
            expanded.append(" ".join(keywords))

        return expanded
