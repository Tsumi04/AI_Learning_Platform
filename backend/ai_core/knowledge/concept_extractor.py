"""
NEUROVAULT — Concept Extractor (White-Box)
Trích xuất key concepts từ text sử dụng TextRank + TF-IDF.
100% tự viết.
"""

import re
import math
from collections import Counter
from typing import List, Dict, Tuple


class ConceptExtractor:
    """
    Keyphrase extraction bằng TF-IDF scoring + co-occurrence graph.
    """

    def __init__(self, max_concepts: int = 20, min_word_freq: int = 2):
        self.max_concepts = max_concepts
        self.min_word_freq = min_word_freq
        self._stopwords = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by',
            'and', 'or', 'but', 'not', 'it', 'this', 'that', 'as', 'so',
            'là', 'và', 'của', 'có', 'trong', 'được', 'cho', 'này',
            'với', 'các', 'không', 'một', 'những', 'đã', 'để', 'từ',
            'theo', 'về', 'như', 'khi', 'cũng', 'tại', 'thì', 'hay',
        }

    def extract(self, text: str, chunks: List[str] = None) -> List[Dict]:
        """
        Extract key concepts from text.
        Returns: [{"concept": str, "score": float, "frequency": int}, ...]
        """
        tokens = self._tokenize(text)
        if not tokens:
            return []

        # Single word TF-IDF scores
        word_scores = self._compute_tfidf(tokens, chunks or [text])

        # Extract bigrams and trigrams
        ngram_scores = self._extract_ngrams(tokens, word_scores)

        # Merge and rank
        all_concepts = {}
        for word, score in word_scores.items():
            all_concepts[word] = {"concept": word, "score": score, "frequency": tokens.count(word)}

        for ngram, score in ngram_scores.items():
            all_concepts[ngram] = {"concept": ngram, "score": score, "frequency": 1}

        # Sort by score, return top N
        sorted_concepts = sorted(all_concepts.values(), key=lambda x: x["score"], reverse=True)
        return sorted_concepts[:self.max_concepts]

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        text = re.sub(r'[^\w\s\u00C0-\u024F\u1E00-\u1EFF]', ' ', text)
        return [w for w in text.split() if w not in self._stopwords and len(w) > 2]

    def _compute_tfidf(self, tokens: List[str], documents: List[str]) -> Dict[str, float]:
        tf = Counter(tokens)
        total = len(tokens)
        n_docs = max(len(documents), 1)

        # Document frequency
        df = Counter()
        for doc in documents:
            doc_tokens = set(self._tokenize(doc))
            df.update(doc_tokens)

        scores = {}
        for word, count in tf.items():
            if count >= self.min_word_freq:
                tf_score = count / total
                idf_score = math.log((n_docs + 1) / (df.get(word, 0) + 1)) + 1
                scores[word] = tf_score * idf_score

        return scores

    def _extract_ngrams(self, tokens: List[str], word_scores: Dict[str, float]) -> Dict[str, float]:
        ngrams = {}
        # Bigrams
        for i in range(len(tokens) - 1):
            bigram = f"{tokens[i]} {tokens[i+1]}"
            s1 = word_scores.get(tokens[i], 0)
            s2 = word_scores.get(tokens[i+1], 0)
            if s1 > 0 and s2 > 0:
                ngrams[bigram] = ngrams.get(bigram, 0) + (s1 + s2) * 1.5

        # Trigrams
        for i in range(len(tokens) - 2):
            trigram = f"{tokens[i]} {tokens[i+1]} {tokens[i+2]}"
            s1 = word_scores.get(tokens[i], 0)
            s2 = word_scores.get(tokens[i+1], 0)
            s3 = word_scores.get(tokens[i+2], 0)
            if s1 > 0 and s2 > 0 and s3 > 0:
                ngrams[trigram] = ngrams.get(trigram, 0) + (s1 + s2 + s3) * 2.0

        # Filter low-frequency ngrams
        return {k: v for k, v in ngrams.items() if v > 0.01}

    def extract_definitions(self, text: str) -> List[Dict]:
        """Extract concept-definition pairs using pattern matching."""
        patterns = [
            r'(?:^|\. )([A-Z][^.]+?) (?:is|are|refers to|means|defined as) ([^.]+\.)',
            r'(?:^|\. )([A-Z][^.]+?) — ([^.]+\.)',
            r'(?:^|\. )([A-Z][^.]+?): ([^.]+\.)',
        ]
        definitions = []
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                definitions.append({
                    "concept": match.group(1).strip(),
                    "definition": match.group(2).strip(),
                })
        return definitions
