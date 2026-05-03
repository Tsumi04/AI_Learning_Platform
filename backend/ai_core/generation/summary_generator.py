"""
NEUROVAULT — Extractive Summary Generator (White-Box)
TextRank-based extractive summarization.
Không dùng sumy, gensim, hay bất kỳ library tóm tắt nào.
"""

import re
import math
from collections import Counter
from typing import List, Dict


class SummaryGenerator:
    """
    Extractive summarization using TextRank algorithm.
    Tự implement graph-based sentence ranking.
    """

    def __init__(self, damping: float = 0.85, max_iter: int = 100, tol: float = 1e-5):
        self.damping = damping
        self.max_iter = max_iter
        self.tol = tol

    def summarize(self, text: str, num_sentences: int = 5) -> Dict:
        """
        Generate extractive summary.
        Returns: {"summary": str, "key_sentences": List[Dict], "compression_ratio": float}
        """
        sentences = self._split_sentences(text)
        if len(sentences) <= num_sentences:
            return {
                "summary": text,
                "key_sentences": [{"text": s, "score": 1.0, "position": i} for i, s in enumerate(sentences)],
                "compression_ratio": 1.0,
            }

        # Build similarity matrix
        sim_matrix = self._build_similarity_matrix(sentences)

        # TextRank scoring
        scores = self._textrank(sim_matrix)

        # Rank sentences
        scored = [(i, scores[i], s) for i, s in enumerate(sentences)]
        scored.sort(key=lambda x: x[1], reverse=True)

        # Select top sentences
        top = scored[:num_sentences]
        # Re-sort by original position for coherent reading
        top.sort(key=lambda x: x[0])

        key_sentences = [
            {"text": s.strip(), "score": round(sc, 4), "position": i}
            for i, sc, s in top
        ]

        summary = " ".join([ks["text"] for ks in key_sentences])
        compression = len(summary) / max(len(text), 1)

        return {
            "summary": summary,
            "key_sentences": key_sentences,
            "compression_ratio": round(compression, 3),
        }

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences."""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 15]

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s\u00C0-\u024F\u1E00-\u1EFF]', ' ', text)
        stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by',
            'and', 'or', 'but', 'not', 'it', 'this', 'that',
            'là', 'và', 'của', 'có', 'trong', 'được', 'cho', 'này',
            'với', 'các', 'không', 'một', 'những', 'đã', 'để', 'từ',
        }
        return [w for w in text.split() if w not in stopwords and len(w) > 1]

    def _cosine_sim(self, a: List[str], b: List[str]) -> float:
        """Cosine similarity between two token lists."""
        counter_a = Counter(a)
        counter_b = Counter(b)
        all_words = set(counter_a.keys()) | set(counter_b.keys())

        dot = sum(counter_a.get(w, 0) * counter_b.get(w, 0) for w in all_words)
        mag_a = math.sqrt(sum(v ** 2 for v in counter_a.values()))
        mag_b = math.sqrt(sum(v ** 2 for v in counter_b.values()))

        if mag_a == 0 or mag_b == 0:
            return 0.0
        return dot / (mag_a * mag_b)

    def _build_similarity_matrix(self, sentences: List[str]) -> List[List[float]]:
        """Build sentence similarity matrix."""
        n = len(sentences)
        tokenized = [self._tokenize(s) for s in sentences]
        matrix = [[0.0] * n for _ in range(n)]

        for i in range(n):
            for j in range(i + 1, n):
                sim = self._cosine_sim(tokenized[i], tokenized[j])
                matrix[i][j] = sim
                matrix[j][i] = sim

        return matrix

    def _textrank(self, sim_matrix: List[List[float]]) -> List[float]:
        """TextRank algorithm — iterative power method."""
        n = len(sim_matrix)
        scores = [1.0 / n] * n

        for _ in range(self.max_iter):
            new_scores = [0.0] * n
            for i in range(n):
                incoming = 0.0
                for j in range(n):
                    if i == j:
                        continue
                    # Normalize by sum of outgoing edges
                    out_sum = sum(sim_matrix[j])
                    if out_sum > 0:
                        incoming += sim_matrix[j][i] / out_sum * scores[j]

                new_scores[i] = (1 - self.damping) / n + self.damping * incoming

            # Check convergence
            diff = sum(abs(new_scores[i] - scores[i]) for i in range(n))
            scores = new_scores
            if diff < self.tol:
                break

        return scores
