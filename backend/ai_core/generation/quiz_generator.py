"""
NEUROVAULT — Quiz Generator (White-Box)
Tự tạo câu hỏi từ knowledge graph + chunks.
Không dùng OpenAI hay bất kỳ API nào.
"""

import re
import random
import hashlib
from typing import List, Dict, Optional


class QuizGenerator:
    """
    Generate quiz questions from concepts and chunks.
    Types: MCQ, Fill-blank, True/False.
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
        """
        questions = []

        # Template-based generation (works without LLM)
        for concept in concepts[:num_questions * 2]:
            concept_name = concept.get("concept", "")
            if not concept_name:
                continue

            # Find chunk containing this concept
            context = ""
            for chunk in chunks:
                if concept_name.lower() in chunk.get("text", "").lower():
                    context = chunk["text"][:300]
                    break

            if context:
                # MCQ
                q = self._generate_mcq(concept_name, context, concepts)
                if q:
                    questions.append(q)

                # Fill-blank
                q = self._generate_fill_blank(concept_name, context)
                if q:
                    questions.append(q)

            if len(questions) >= num_questions:
                break

        # If LLM available, enhance questions
        if self.llm and self.llm.is_available():
            questions = self._enhance_with_llm(questions, chunks)

        # Set difficulty
        for q in questions:
            q["difficulty"] = difficulty

        return questions[:num_questions]

    def _generate_mcq(self, concept: str, context: str, all_concepts: List[Dict]) -> Optional[Dict]:
        """Generate Multiple Choice Question."""
        # Extract a sentence containing the concept
        sentences = re.split(r'[.!?]+', context)
        target_sent = None
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
                target_sent = s.strip()
                break

        if not target_sent:
            return None

        # Create question from sentence
        question_text = f"According to the document, which statement about '{concept}' is correct?"

        # Generate distractors from other concepts
        other_concepts = [c["concept"] for c in all_concepts if c["concept"] != concept]
        random.shuffle(other_concepts)
        distractors = []
        for oc in other_concepts[:3]:
            distractors.append(f"{concept} is the same as {oc}")

        if len(distractors) < 3:
            distractors.extend([
                f"{concept} is not mentioned in the document",
                f"{concept} is unrelated to the topic",
                f"{concept} has no practical applications",
            ])

        return {
            "question_text": question_text,
            "question_type": "mcq",
            "correct_answer": target_sent[:150],
            "distractors": distractors[:3],
            "source_concept": concept,
        }

    def _generate_fill_blank(self, concept: str, context: str) -> Optional[Dict]:
        """Generate Fill-in-the-blank question."""
        sentences = re.split(r'[.!?]+', context)
        for s in sentences:
            if concept.lower() in s.lower() and len(s.strip()) > 20:
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
                    }
        return None

    def _enhance_with_llm(self, questions: List[Dict], chunks: List[Dict]) -> List[Dict]:
        """Use LLM to improve question quality."""
        if not self.llm:
            return questions

        for q in questions[:5]:  # Enhance first 5 only to save compute
            prompt = f"""Improve this quiz question for educational quality.
Question: {q['question_text']}
Answer: {q['correct_answer']}
Return only the improved question text."""
            try:
                improved = self.llm.generate(prompt, temperature=0.3, max_tokens=200)
                if improved and not improved.startswith("[ERROR]") and len(improved) > 10:
                    q["question_text"] = improved.strip()
            except Exception:
                pass

        return questions
