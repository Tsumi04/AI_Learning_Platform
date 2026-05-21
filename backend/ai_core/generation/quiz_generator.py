"""
NEUROVAULT — Quiz Generator v2 (White-Box)
Tạo câu hỏi từ knowledge graph + chunks + LLM.

v2 Improvements:
- Bloom's Taxonomy levels (Remember→Create)
- LLM-powered question generation (when available)
- True/False question type
- Explanation generation
- Difficulty calibration
- Better distractor generation
- Deduplication
"""

import re
import random
import hashlib
from typing import List, Dict, Optional

# Bloom's Taxonomy levels (educational framework)
BLOOM_LEVELS = {
    1: {"name": "Remember", "verbs": ["define", "list", "state", "identify", "recall", "name"]},
    2: {"name": "Understand", "verbs": ["explain", "describe", "summarize", "classify", "compare"]},
    3: {"name": "Apply", "verbs": ["apply", "use", "solve", "demonstrate", "calculate"]},
    4: {"name": "Analyze", "verbs": ["analyze", "examine", "differentiate", "compare", "contrast"]},
    5: {"name": "Evaluate", "verbs": ["evaluate", "judge", "justify", "critique", "assess"]},
    6: {"name": "Create", "verbs": ["create", "design", "propose", "develop", "formulate"]},
}


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
    """

    def __init__(self, llm_engine=None):
        self.llm = llm_engine

    def generate_from_concepts(
        self,
        concepts: List[Dict],
        chunks: List[Dict],
        num_questions: int = 10,
        difficulty: float = 0.5,
    ) -> List[Dict]:
        """
        Generate quiz questions from extracted concepts.

        Falls back to template-based if LLM unavailable.
        Bloom's level auto-selected based on difficulty.
        """
        bloom_level = self._difficulty_to_bloom(difficulty)
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
                q = self._generate_mcq(concept_name, context, concepts, bloom_level)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            # Fill-blank
            if len([q for q in questions if q["question_type"] == "fill_blank"]) < target_fill:
                q = self._generate_fill_blank(concept_name, context)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            # True/False
            if len([q for q in questions if q["question_type"] == "true_false"]) < target_tf:
                q = self._generate_true_false(concept_name, context, concepts)
                if q and self._dedup(q, seen_hashes):
                    questions.append(q)

            if len(questions) >= num_questions:
                break

        # If LLM available, enhance questions
        if self.llm and hasattr(self.llm, 'is_available') and self.llm.is_available():
            questions = self._enhance_with_llm(questions, chunks, bloom_level)

        # Set difficulty and bloom level
        for q in questions:
            q["difficulty"] = difficulty
            q["bloom_level"] = bloom_level["name"]

        random.shuffle(questions)
        return questions[:num_questions]

    def _difficulty_to_bloom(self, difficulty: float) -> Dict:
        """Map difficulty (0-1) to Bloom's Taxonomy level."""
        if difficulty < 0.2:
            return BLOOM_LEVELS[1]  # Remember
        elif difficulty < 0.35:
            return BLOOM_LEVELS[2]  # Understand
        elif difficulty < 0.5:
            return BLOOM_LEVELS[3]  # Apply
        elif difficulty < 0.7:
            return BLOOM_LEVELS[4]  # Analyze
        elif difficulty < 0.85:
            return BLOOM_LEVELS[5]  # Evaluate
        else:
            return BLOOM_LEVELS[6]  # Create

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
        self, concept: str, context: str, all_concepts: List[Dict], bloom: Dict
    ) -> Optional[Dict]:
        """Generate Multiple Choice Question with Bloom's level."""
        sentences = re.split(r'[.!?]+', context)
        target_sent = None
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
                target_sent = s.strip()
                break

        if not target_sent:
            return None

        # Create question based on Bloom's level
        verb = random.choice(bloom["verbs"])
        if bloom["name"] in ("Remember", "Understand"):
            question_text = f"According to the document, which statement about '{concept}' is correct?"
        elif bloom["name"] in ("Apply", "Analyze"):
            question_text = f"How would you {verb} the concept of '{concept}' based on the document?"
        else:
            question_text = f"{verb.capitalize()} the role of '{concept}' as described in the document."

        # Generate distractors
        other_concepts = [c["concept"] for c in all_concepts if c["concept"] != concept]
        random.shuffle(other_concepts)
        distractors = []

        for oc in other_concepts[:3]:
            distractors.append(
                target_sent.replace(concept, oc)
                if concept in target_sent
                else f"{concept} is equivalent to {oc}"
            )

        while len(distractors) < 3:
            distractors.append(f"{concept} is not discussed in this context")

        return {
            "question_text": question_text,
            "question_type": "mcq",
            "correct_answer": target_sent[:200],
            "distractors": distractors[:3],
            "source_concept": concept,
            "explanation": f"This answer is found in the passage discussing {concept}.",
        }

    def _generate_fill_blank(self, concept: str, context: str) -> Optional[Dict]:
        """Generate Fill-in-the-blank question."""
        sentences = re.split(r'[.!?]+', context)
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
                        "question_text": f"Fill in the blank: {blanked}",
                        "question_type": "fill_blank",
                        "correct_answer": concept,
                        "distractors": [],
                        "source_concept": concept,
                        "explanation": f"The missing term is '{concept}'.",
                    }
        return None

    def _generate_true_false(
        self, concept: str, context: str, all_concepts: List[Dict]
    ) -> Optional[Dict]:
        """Generate True/False question."""
        sentences = re.split(r'[.!?]+', context)
        target_sent = None
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
                target_sent = s.strip()
                break

        if not target_sent:
            return None

        # 50% chance of true vs false
        is_true = random.random() > 0.5

        if is_true:
            statement = target_sent[:200]
            correct_answer = "True"
            explanation = "This statement is directly supported by the document."
        else:
            # Create false statement by negation or substitution
            other = [c["concept"] for c in all_concepts if c["concept"] != concept]
            if other:
                replacement = random.choice(other)
                statement = target_sent.replace(concept, replacement)[:200]
            else:
                statement = f"{concept} is not related to the topics discussed in this document."
            correct_answer = "False"
            explanation = f"The correct term should be '{concept}', not as stated."

        return {
            "question_text": f"True or False: {statement}",
            "question_type": "true_false",
            "correct_answer": correct_answer,
            "distractors": [],
            "source_concept": concept,
            "explanation": explanation,
        }

    def _enhance_with_llm(
        self, questions: List[Dict], chunks: List[Dict], bloom: Dict
    ) -> List[Dict]:
        """Use LLM to improve question quality."""
        if not self.llm:
            return questions

        for q in questions[:5]:  # Enhance first 5 to save compute
            prompt = f"""Improve this quiz question for educational quality.
Bloom's Level: {bloom['name']}
Question: {q['question_text']}
Answer: {q['correct_answer']}

Return ONLY the improved question text, nothing else."""
            try:
                improved = self.llm.generate(prompt, temperature=0.3, max_tokens=200)
                if improved and not improved.startswith("[ERROR]") and len(improved) > 10:
                    q["question_text"] = improved.strip()
                    q["llm_enhanced"] = True
            except Exception:
                pass

        return questions
