"""
NEUROVAULT — Unit Tests cho Preprocessing Pipeline
Chạy: pytest tests/ -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from preprocessing.text_cleaner import TextCleaner
from preprocessing.sentence_splitter import SentenceSplitter
from preprocessing.language_detector import LanguageDetector
from preprocessing.semantic_chunker import SemanticChunker


# ═══════════════════════════════════════════
# TEXT CLEANER TESTS
# ═══════════════════════════════════════════

class TestTextCleaner:
    def setup_method(self):
        self.cleaner = TextCleaner()

    def test_unicode_normalization(self):
        """NFC normalization: combining marks → precomposed."""
        # u + combining ̉ = ủ
        text = "thu\u0309"
        result = self.cleaner.clean(text)
        assert "ủ" in result or result == "thủ"

    def test_html_entity_decode(self):
        text = "5 &gt; 3 &amp; 2 &lt; 4"
        result = self.cleaner.clean(text)
        assert "5 > 3 & 2 < 4" == result

    def test_smart_quotes(self):
        text = "\u201CHello\u201D \u2018world\u2019"
        result = self.cleaner.clean(text)
        assert '"Hello" \'world\'' == result

    def test_hyphenation_fix(self):
        text = "This is a knowl-\nedge base."
        result = self.cleaner.clean(text)
        assert "knowledge" in result

    def test_whitespace_collapse(self):
        text = "Hello    world  \t  test"
        result = self.cleaner.clean(text)
        assert "Hello world test" == result

    def test_multiple_newlines(self):
        text = "Para 1\n\n\n\n\nPara 2"
        result = self.cleaner.clean(text)
        assert "Para 1\n\nPara 2" == result

    def test_control_chars(self):
        text = "Hello\x00World\x07Test"
        result = self.cleaner.clean(text)
        assert "\x00" not in result
        assert "\x07" not in result

    def test_empty_input(self):
        assert self.cleaner.clean("") == ""
        assert self.cleaner.clean(None) == ""

    def test_word_count(self):
        assert TextCleaner.count_words("Hello world test") == 3
        assert TextCleaner.count_words("Xin chào thế giới") == 4
        assert TextCleaner.count_words("") == 0

    def test_vietnamese_text(self):
        text = "Đây là một ví dụ về tiếng Việt. Có dấu và đủ các ký tự đặc biệt."
        result = self.cleaner.clean(text)
        assert "tiếng Việt" in result
        assert "dấu" in result


# ═══════════════════════════════════════════
# SENTENCE SPLITTER TESTS
# ═══════════════════════════════════════════

class TestSentenceSplitter:
    def setup_method(self):
        self.splitter = SentenceSplitter()

    def test_basic_split(self):
        text = "Hello world. This is a test. Final sentence."
        sentences = self.splitter.split(text)
        assert len(sentences) == 3

    def test_question_mark(self):
        text = "What is HTML? It is a markup language."
        sentences = self.splitter.split(text)
        assert len(sentences) == 2

    def test_exclamation(self):
        text = "This is great! I love it. Amazing work on this!"
        sentences = self.splitter.split(text)
        assert len(sentences) >= 2
        assert "great!" in sentences[0]

    def test_abbreviation_protection(self):
        text = "Dr. Smith went to the store. He bought milk."
        sentences = self.splitter.split(text)
        assert len(sentences) == 2
        assert "Dr." in sentences[0]

    def test_number_protection(self):
        text = "The value is 3.14. This is pi."
        sentences = self.splitter.split(text)
        assert len(sentences) == 2
        assert "3.14" in sentences[0]

    def test_empty_input(self):
        assert self.splitter.split("") == []
        assert self.splitter.split("   ") == []

    def test_single_sentence(self):
        text = "Just one sentence"
        sentences = self.splitter.split(text)
        assert len(sentences) == 1

    def test_vietnamese(self):
        text = "Đây là câu đầu tiên. Đây là câu thứ hai. Và đây là câu cuối."
        sentences = self.splitter.split(text)
        assert len(sentences) == 3


# ═══════════════════════════════════════════
# LANGUAGE DETECTOR TESTS
# ═══════════════════════════════════════════

class TestLanguageDetector:
    def setup_method(self):
        self.detector = LanguageDetector()

    def test_english(self):
        text = "This is a comprehensive guide to understanding the fundamentals of computer science and programming."
        lang = self.detector.detect(text)
        assert lang == 'en'

    def test_vietnamese(self):
        text = "Đây là một hướng dẫn toàn diện để hiểu các nguyên tắc cơ bản của khoa học máy tính và lập trình."
        lang = self.detector.detect(text)
        assert lang == 'vi'

    def test_short_text(self):
        text = "Hi"
        lang = self.detector.detect(text)
        assert lang == 'unknown'

    def test_empty(self):
        lang = self.detector.detect("")
        assert lang == 'unknown'

    def test_with_confidence(self):
        text = "The quick brown fox jumps over the lazy dog. This is a common pangram used in testing."
        lang, conf = self.detector.detect_with_confidence(text)
        assert lang == 'en'
        assert conf > 0.0


# ═══════════════════════════════════════════
# SEMANTIC CHUNKER TESTS
# ═══════════════════════════════════════════

class TestSemanticChunker:
    def setup_method(self):
        self.chunker = SemanticChunker(
            window_size=2,
            similarity_threshold=0.3,
            min_chunk_words=20,
            max_chunk_words=300,
        )

    def test_basic_chunking(self):
        sentences = [
            "HTML is a markup language for creating web pages.",
            "It defines the structure and content of a web page.",
            "CSS is used for styling and layout.",
            "CSS can change colors, fonts, and spacing.",
            "JavaScript adds interactivity to web pages.",
            "It can handle events and manipulate the DOM.",
            "Python is a programming language for data science.",
            "It has libraries like NumPy and Pandas.",
        ]
        chunks = self.chunker.chunk(sentences)
        assert len(chunks) >= 1
        assert all(chunk.text for chunk in chunks)
        assert all(chunk.chunk_id for chunk in chunks)
        assert all(chunk.word_count > 0 for chunk in chunks)

    def test_single_sentence(self):
        sentences = ["Just one sentence here."]
        chunks = self.chunker.chunk(sentences)
        assert len(chunks) == 1

    def test_empty_input(self):
        chunks = self.chunker.chunk([])
        assert len(chunks) == 0

    def test_short_text(self):
        sentences = ["First.", "Second.", "Third."]
        chunks = self.chunker.chunk(sentences)
        assert len(chunks) >= 1

    def test_chunk_has_valid_fields(self):
        sentences = [
            "Machine learning is a subset of artificial intelligence.",
            "It involves training algorithms on data.",
            "Deep learning uses neural networks with many layers.",
            "Neural networks are inspired by the human brain.",
        ]
        chunks = self.chunker.chunk(sentences)
        for chunk in chunks:
            assert isinstance(chunk.chunk_id, str) and len(chunk.chunk_id) > 0
            assert isinstance(chunk.text, str) and len(chunk.text) > 0
            assert isinstance(chunk.position, int) and chunk.position >= 0
            assert isinstance(chunk.word_count, int) and chunk.word_count > 0

    def test_size_based_fallback(self):
        sentences = ["Sentence " + str(i) + " with some extra words to fill." for i in range(20)]
        chunks = self.chunker.chunk_by_size(sentences, target_size=50)
        assert len(chunks) >= 1
        for chunk in chunks:
            assert chunk.word_count > 0
