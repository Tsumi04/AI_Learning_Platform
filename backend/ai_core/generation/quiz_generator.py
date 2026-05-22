"""
NEUROVAULT — Quiz Generator v2 (White-Box, Multilingual)
Tạo câu hỏi từ knowledge graph + chunks + LLM.

v2 Improvements:
- Bloom's Taxonomy levels (Remember→Create)
- LLM-powered question generation (when available)
- True/False question type
- Explanation generation
- Difficulty calibration
- Better distractor generation
- Deduplication
- Multilingual support (Vietnamese + English)
"""

import re
import random
import hashlib
from typing import List, Dict, Optional

# Bloom's Taxonomy levels — English
BLOOM_LEVELS_EN = {
    1: {"name": "Remember", "verbs": ["define", "list", "state", "identify", "recall", "name"]},
    2: {"name": "Understand", "verbs": ["explain", "describe", "summarize", "classify", "compare"]},
    3: {"name": "Apply", "verbs": ["apply", "use", "solve", "demonstrate", "calculate"]},
    4: {"name": "Analyze", "verbs": ["analyze", "examine", "differentiate", "compare", "contrast"]},
    5: {"name": "Evaluate", "verbs": ["evaluate", "judge", "justify", "critique", "assess"]},
    6: {"name": "Create", "verbs": ["create", "design", "propose", "develop", "formulate"]},
}

# Bloom's Taxonomy levels — Vietnamese
BLOOM_LEVELS_VI = {
    1: {"name": "Nhớ", "verbs": ["định nghĩa", "liệt kê", "nêu", "nhận diện", "nhắc lại", "gọi tên"]},
    2: {"name": "Hiểu", "verbs": ["giải thích", "mô tả", "tóm tắt", "phân loại", "so sánh"]},
    3: {"name": "Áp dụng", "verbs": ["áp dụng", "sử dụng", "giải quyết", "minh họa", "tính toán"]},
    4: {"name": "Phân tích", "verbs": ["phân tích", "xem xét", "phân biệt", "so sánh", "đối chiếu"]},
    5: {"name": "Đánh giá", "verbs": ["đánh giá", "nhận xét", "lý giải", "phê bình", "thẩm định"]},
    6: {"name": "Sáng tạo", "verbs": ["sáng tạo", "thiết kế", "đề xuất", "phát triển", "xây dựng"]},
}

# Question templates per language
MCQ_TEMPLATES = {
    "en": {
        "remember": "According to the document, which statement about '{concept}' is correct?",
        "apply": "How would you {verb} the concept of '{concept}' based on the document?",
        "evaluate": "{verb} the role of '{concept}' as described in the document.",
    },
    "vi": {
        "remember": "Theo tài liệu, phát biểu nào sau đây về '{concept}' là đúng?",
        "apply": "Dựa trên tài liệu, hãy {verb} khái niệm '{concept}'?",
        "evaluate": "Hãy {verb} vai trò của '{concept}' như được mô tả trong tài liệu.",
    },
}

FILL_BLANK_TEMPLATES = {
    "en": "Fill in the blank: {blanked}",
    "vi": "Điền vào chỗ trống: {blanked}",
}

TF_TEMPLATES = {
    "en": "True or False: {statement}",
    "vi": "Đúng hay Sai: {statement}",
}

EXPLANATIONS = {
    "en": {
        "mcq": "This answer is found in the passage discussing {concept}.",
        "fill_blank": "The missing term is '{concept}'.",
        "tf_true": "This statement is directly supported by the document.",
        "tf_false": "The correct term should be '{concept}', not as stated.",
        "distractor_fallback": "{concept} is not discussed in this context",
        "tf_false_fallback": "{concept} is not related to the topics discussed in this document.",
    },
    "vi": {
        "mcq": "Câu trả lời này được tìm thấy trong đoạn văn thảo luận về {concept}.",
        "fill_blank": "Từ/cụm từ cần điền là '{concept}'.",
        "tf_true": "Phát biểu này được hỗ trợ trực tiếp bởi tài liệu.",
        "tf_false": "Từ đúng phải là '{concept}', không phải như đã nêu.",
        "distractor_fallback": "{concept} không được đề cập trong ngữ cảnh này",
        "tf_false_fallback": "{concept} không liên quan đến các chủ đề được thảo luận trong tài liệu này.",
    },
}

# Legacy alias for backward compatibility
BLOOM_LEVELS = BLOOM_LEVELS_EN


def _get_bloom_levels(language: str) -> Dict:
    """Get Bloom's Taxonomy levels for the given language."""
    if language == "vi":
        return BLOOM_LEVELS_VI
    return BLOOM_LEVELS_EN


def _get_lang_key(language: str) -> str:
    """Normalize language to template key ('vi' or 'en')."""
    return "vi" if language == "vi" else "en"


class QuizGenerator:
    """
    Generate quiz questions v2 from concepts and chunks.

    Question types:
    - MCQ (Multiple Choice)
    - Fill-blank
    - True/False
    - Short Answer (LLM-generated)

    Bloom's Taxonomy integration:
    - difficulty 0-0.3: Remember/Understand
    - difficulty 0.3-0.6: Apply/Analyze
    - difficulty 0.6-1.0: Evaluate/Create

    Multilingual: Vietnamese (vi) + English (en, default)
    """

    def __init__(self, llm_engine=None):
        self.llm = llm_engine

    def generate_from_concepts(
        self,
        concepts: List[Dict],
        chunks: List[Dict],
        num_questions: int = 10,
        difficulty: float = 0.5,
        language: str = "en",
    ) -> List[Dict]:
        """
        Generate quiz questions from extracted concepts.

        Falls back to template-based if LLM unavailable.
        Bloom's level auto-selected based on difficulty.
        Language determines question/explanation language.
        """
        lang = _get_lang_key(language)
        bloom_levels = _get_bloom_levels(language)
        bloom_level = self._difficulty_to_bloom(difficulty, bloom_levels)
        questions = []
        seen_hashes = set()

        # Strategy: mix question types
        target_mcq = max(1, int(num_questions * 0.4))
        target_fill = max(1, int(num_questions * 0.3))
        target_tf = max(1, int(num_questions * 0.3))

        for concept in concepts[:num_questions * 3]:
            concept_name = concept.get("concept", "")
            if not concept_name:
                continue

            # Find best chunk containing this concept
            context = self._find_best_context(concept_name, chunks)
            if not context:
                continue

            # MCQ
            if len([q for q in questions if q["question_type"] == "mcq"]) < target_mcq:
                q = self._generate_mcq(concept_name, context, concepts, bloom_level, lang)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            # Fill-blank
            if len([q for q in questions if q["question_type"] == "fill_blank"]) < target_fill:
                q = self._generate_fill_blank(concept_name, context, lang)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            # True/False
            if len([q for q in questions if q["question_type"] == "true_false"]) < target_tf:
                q = self._generate_true_false(concept_name, context, concepts, lang)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            if len(questions) >= num_questions:
                break

        # If LLM available, enhance questions
        if self.llm and hasattr(self.llm, 'is_available') and self.llm.is_available():
            questions = self._enhance_with_llm(questions, chunks, bloom_level, lang)

        # Set difficulty and bloom level
        for q in questions:
            q["difficulty"] = difficulty
            q["bloom_level"] = bloom_level["name"]

        random.shuffle(questions)
        return questions[:num_questions]

    def _difficulty_to_bloom(self, difficulty: float, bloom_levels: Dict = None) -> Dict:
        """Map difficulty (0-1) to Bloom's Taxonomy level."""
        levels = bloom_levels or BLOOM_LEVELS_EN
        if difficulty < 0.2:
            return levels[1]  # Remember / Nhớ
        elif difficulty < 0.35:
            return levels[2]  # Understand / Hiểu
        elif difficulty < 0.5:
            return levels[3]  # Apply / Áp dụng
        elif difficulty < 0.7:
            return levels[4]  # Analyze / Phân tích
        elif difficulty < 0.85:
            return levels[5]  # Evaluate / Đánh giá
        else:
            return levels[6]  # Create / Sáng tạo

    def _find_best_context(self, concept: str, chunks: List[Dict]) -> Optional[str]:
        """Find the best chunk context for a concept."""
        best = None
        best_score = 0

        for chunk in chunks:
            text = chunk.get("text", "")
            if concept.lower() in text.lower():
                # Score by: how central the concept is in this chunk
                count = text.lower().count(concept.lower())
                # Prefer chunks where concept appears more + chunk is longer
                score = count * min(len(text), 500)
                if score > best_score:
                    best_score = score
                    best = text[:500]

        return best

    def _dedup(self, question: Dict, seen: set) -> bool:
        """Check and add question hash for deduplication."""
        h = hashlib.md5(question["question_text"].encode()).hexdigest()[:12]
        if h in seen:
            return False
        seen.add(h)
        return True

    def _generate_mcq(
        self, concept: str, context: str, all_concepts: List[Dict], bloom: Dict, lang: str = "en"
    ) -> Optional[Dict]:
        """Generate Multiple Choice Question with Bloom's level, language-aware."""
        sentences = re.split(r'[.!?]+', context)
        target_sent = None
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
                target_sent = s.strip()
                break

        if not target_sent:
            return None

        templates = MCQ_TEMPLATES.get(lang, MCQ_TEMPLATES["en"])
        explanations = EXPLANATIONS.get(lang, EXPLANATIONS["en"])

        # Create question based on Bloom's level
        verb = random.choice(bloom["verbs"])
        bloom_name = bloom["name"]

        # Map bloom name to template category (works for both EN and VI)
        if bloom_name in ("Remember", "Understand", "Nhớ", "Hiểu"):
            question_text = templates["remember"].format(concept=concept)
        elif bloom_name in ("Apply", "Analyze", "Áp dụng", "Phân tích"):
            question_text = templates["apply"].format(verb=verb, concept=concept)
        else:
            question_text = templates["evaluate"].format(verb=verb.capitalize(), concept=concept)

        # Generate distractors
        other_concepts = [c["concept"] for c in all_concepts if c["concept"] != concept]
        random.shuffle(other_concepts)
        distractors = []

        for oc in other_concepts[:3]:
            distractors.append(
                target_sent.replace(concept, oc)
                if concept in target_sent
                else f"{concept} {'tương đương với' if lang == 'vi' else 'is equivalent to'} {oc}"
            )

        while len(distractors) < 3:
            distractors.append(explanations["distractor_fallback"].format(concept=concept))

        return {
            "question_text": question_text,
            "question_type": "mcq",
            "correct_answer": target_sent[:200],
            "distractors": distractors[:3],
            "source_concept": concept,
            "explanation": explanations["mcq"].format(concept=concept),
        }

    def _generate_fill_blank(self, concept: str, context: str, lang: str = "en") -> Optional[Dict]:
        """Generate Fill-in-the-blank question, language-aware."""
        sentences = re.split(r'[.!?]+', context)
        template = FILL_BLANK_TEMPLATES.get(lang, FILL_BLANK_TEMPLATES["en"])
        explanations = EXPLANATIONS.get(lang, EXPLANATIONS["en"])

        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 25:
                blanked = re.sub(
                    re.escape(concept),
                    "_______",
                    s.strip(),
                    flags=re.IGNORECASE,
                    count=1,
                )
                if "_______" in blanked:
                    return {
                        "question_text": template.format(blanked=blanked),
                        "question_type": "fill_blank",
                        "correct_answer": concept,
                        "distractors": [],
                        "source_concept": concept,
                        "explanation": explanations["fill_blank"].format(concept=concept),
                    }
        return None

    def _generate_true_false(
        self, concept: str, context: str, all_concepts: List[Dict], lang: str = "en"
    ) -> Optional[Dict]:
        """Generate True/False question, language-aware."""
        sentences = re.split(r'[.!?]+', context)
        target_sent = None
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
                target_sent = s.strip()
                break

        if not target_sent:
            return None

        template = TF_TEMPLATES.get(lang, TF_TEMPLATES["en"])
        explanations = EXPLANATIONS.get(lang, EXPLANATIONS["en"])

        # 50% chance of true vs false
        is_true = random.random() > 0.5

        if is_true:
            statement = target_sent[:200]
            correct_answer = "Đúng" if lang == "vi" else "True"
            explanation = explanations["tf_true"]
        else:
            # Create false statement by negation or substitution
            other = [c["concept"] for c in all_concepts if c["concept"] != concept]
            if other:
                replacement = random.choice(other)
                statement = target_sent.replace(concept, replacement)[:200]
            else:
                statement = explanations["tf_false_fallback"].format(concept=concept)
            correct_answer = "Sai" if lang == "vi" else "False"
            explanation = explanations["tf_false"].format(concept=concept)

        return {
            "question_text": template.format(statement=statement),
            "question_type": "true_false",
            "correct_answer": correct_answer,
            "distractors": [],
            "source_concept": concept,
            "explanation": explanation,
        }

    def _enhance_with_llm(
        self, questions: List[Dict], chunks: List[Dict], bloom: Dict, lang: str = "en"
    ) -> List[Dict]:
        """Use LLM to improve question quality, respecting language."""
        if not self.llm:
            return questions

        if lang == "vi":
            prompt_template = """Cải thiện câu hỏi quiz sau đây cho mục đích giáo dục.
Mức Bloom: {bloom_name}
Câu hỏi: {question}
Đáp án: {answer}

Trả về CHỈ câu hỏi đã cải thiện bằng TIẾNG VIỆT, không thêm gì khác."""
        else:
            prompt_template = """Improve this quiz question for educational quality.
Bloom's Level: {bloom_name}
Question: {question}
Answer: {answer}

Return ONLY the improved question text, nothing else."""

        for q in questions[:5]:  # Enhance first 5 to save compute
            prompt = prompt_template.format(
                bloom_name=bloom['name'],
                question=q['question_text'],
                answer=q['correct_answer'],
            )
            try:
                improved = self.llm.generate(prompt, temperature=0.3, max_tokens=200)
                if improved and not improved.startswith("[ERROR]") and len(improved) > 10:
                    q["question_text"] = improved.strip()
                    q["llm_enhanced"] = True
            except Exception:
                pass

        return questions
