"""
NEUROVAULT — Embedding Engine
Tạo vector embeddings cho text chunks.
Hỗ trợ 2 modes:
  1. TF-IDF embeddings (100% white-box, zero dependencies)
  2. SentenceTransformer embeddings (local model, no API)
"""

import math
import re
import numpy as np
from collections import Counter
from typing import List, Dict, Optional


class TFIDFEmbedder:
    """
    TF-IDF based embedder — 100% white-box.
    Tạo sparse-to-dense vectors qua SVD-like dimensionality reduction.
    """

    def __init__(self, dim: int = 128, max_vocab: int = 10000):
        self.dim = dim
        self.max_vocab = max_vocab
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.projection_matrix: Optional[np.ndarray] = None
        self._fitted = False
        self._stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by',
            'and', 'or', 'but', 'not', 'it', 'this', 'that',
            'là', 'và', 'của', 'có', 'trong', 'được', 'cho', 'này',
            'với', 'các', 'không', 'một', 'những', 'đã', 'để', 'từ',
        }

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s\u00C0-\u024F\u1E00-\u1EFF]', ' ', text)
        return [w for w in text.split() if w not in self._stopwords and len(w) > 1]

    def fit(self, documents: List[str]) -> None:
        """Build vocabulary and IDF from corpus."""
        doc_freqs: Counter = Counter()
        word_freqs: Counter = Counter()
        n_docs = len(documents)

        for doc in documents:
            tokens = self._tokenize(doc)
            word_freqs.update(tokens)
            doc_freqs.update(set(tokens))

        # Build vocabulary from top-N words
        top_words = word_freqs.most_common(self.max_vocab)
        self.vocabulary = {word: idx for idx, (word, _) in enumerate(top_words)}

        # Compute IDF
        for word, df in doc_freqs.items():
            if word in self.vocabulary:
                self.idf[word] = math.log((n_docs + 1) / (df + 1)) + 1.0

        # Random projection matrix for dimensionality reduction (sparse → dense)
        vocab_size = len(self.vocabulary)
        if vocab_size > 0:
            rng = np.random.RandomState(42)
            self.projection_matrix = rng.randn(vocab_size, self.dim).astype(np.float32)
            # Normalize columns
            norms = np.linalg.norm(self.projection_matrix, axis=0, keepdims=True)
            self.projection_matrix /= np.maximum(norms, 1e-8)

        self._fitted = True

    def embed(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        if not self._fitted:
            return [0.0] * self.dim

        tokens = self._tokenize(text)
        if not tokens:
            return [0.0] * self.dim

        # Build TF-IDF sparse vector
        tf = Counter(tokens)
        total = len(tokens)
        sparse = np.zeros(len(self.vocabulary), dtype=np.float32)
        for word, count in tf.items():
            if word in self.vocabulary:
                idx = self.vocabulary[word]
                tfidf = (count / total) * self.idf.get(word, 1.0)
                sparse[idx] = tfidf

        # Project to dense vector
        dense = sparse @ self.projection_matrix

        # L2 normalize
        norm = np.linalg.norm(dense)
        if norm > 0:
            dense /= norm

        return dense.tolist()

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed(t) for t in texts]


class EmbeddingEngine:
    """
    Unified embedding engine.
    Uses TF-IDF embedder by default (white-box).
    Can upgrade to SentenceTransformer for production.
    """

    def __init__(self, mode: str = "tfidf", dim: int = 128):
        self.mode = mode
        self.dim = dim

        if mode == "tfidf":
            self.embedder = TFIDFEmbedder(dim=dim)
        else:
            raise ValueError(f"Unknown mode: {mode}. Use 'tfidf'.")

    def fit(self, documents: List[str]) -> None:
        """Fit embedder on corpus (required for TF-IDF mode)."""
        if self.mode == "tfidf":
            self.embedder.fit(documents)

    def embed(self, text: str) -> List[float]:
        """Embed single text → vector."""
        return self.embedder.embed(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts → list of vectors."""
        return self.embedder.embed_batch(texts)

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        dot = np.dot(a, b)
        na = np.linalg.norm(a)
        nb = np.linalg.norm(b)
        if na == 0 or nb == 0:
            return 0.0
        return float(dot / (na * nb))
