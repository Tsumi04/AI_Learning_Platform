"""
NEUROVAULT — Flashcard Generator v2 (White-Box, Multilingual)
Tự tạo flashcards từ concepts + definitions + chunks + LLM.

v2 Improvements:
- LLM-powered definitions (when available)
- Multiple card types: Concept, Cloze, Key-Value, Reverse
- FSRS metadata integration
- Difficulty estimation per card
- Tags from knowledge graph
- Deduplication
- Multilingual support (Vietnamese + English)
"""

import re
import hashlib
from typing import List, Dict, Optional

# Language-aware templates
CARD_TEMPLATES = {
    "en": {
        "concept_front": "What is {name}?",
        "reverse_front": "What concept does this describe?\n\n{masked}",
        "key_value_front": "Define: {key}",
    },
    "vi": {
        "concept_front": "{name} là gì?",
        "reverse_front": "Khái niệm nào được mô tả dưới đây?\n\n{masked}",
        "key_value_front": "Định nghĩa: {key}",
    },
}

LLM_PROMPTS = {
    "en": """Give a clear, concise definition for educational flashcard.
Concept: {concept}
Current definition: {definition}

Return ONLY the improved definition (1-3 sentences).""",
    "vi": """Hãy đưa ra định nghĩa rõ ràng, ngắn gọn cho flashcard học tập.
Khái niệm: {concept}
Định nghĩa hiện tại: {definition}

Trả về CHỈ định nghĩa đã cải thiện bằng TIẾNG VIỆT (1-3 câu).""",
}


def _get_lang_key(language: str) -> str:
    """Normalize language to template key ('vi' or 'en')."""
    return "vi" if language == "vi" else "en"


class FlashcardGenerator:
    """
    Generate flashcards v2 from document content.

    Card types:
    - concept: "What is X?" / "X là gì?" → definition
    - cloze: "X is [...] for Y" → missing concept
    - reverse: definition → "What concept?"
    - key_value: key fact → explanation

    Multilingual: Vietnamese (vi) + English (en, default)
    """

    def __init__(self, llm_engine=None):
        self.llm = llm_engine

    def generate(
        self,
        concepts: List[Dict],
        chunks: List[Dict],
        max_cards: int = 20,
        include_reverse: bool = True,
        language: str = "en",
    ) -> List[Dict]:
        """
        Generate flashcards from concepts and chunks.

        Returns list of flashcard dicts with FSRS-ready metadata.
        """
        lang = _get_lang_key(language)
        cards = []
        seen_hashes = set()

        # 1. Concept-definition cards
        for concept in concepts:
            card = self._concept_card(concept, chunks, lang)
            if card and self._dedup(card, seen_hashes):
                cards.append(card)

                # 1b. Reverse cards (definition → concept)
                if include_reverse:
                    reverse = self._reverse_card(card, lang)
                    if reverse and self._dedup(reverse, seen_hashes):
                        cards.append(reverse)

        # 2. Cloze deletion cards
        for chunk in chunks[:15]:
            cloze_cards = self._cloze_cards(chunk["text"], concepts)
            for card in cloze_cards:
                if self._dedup(card, seen_hashes):
                    cards.append(card)

        # 3. Key-value cards from patterns
        for chunk in chunks[:10]:
            kv_cards = self._key_value_cards(chunk["text"], lang)
            for card in kv_cards:
                if self._dedup(card, seen_hashes):
                    cards.append(card)

        # 4. LLM-enhanced definitions (if available)
        if self.llm and hasattr(self.llm, 'is_available') and self.llm.is_available():
            cards = self._enhance_with_llm(cards, lang)

        # Add FSRS initial metadata + difficulty estimate
        for i, card in enumerate(cards):
            card["card_id"] = hashlib.md5(
                f"{card['front']}{card['back']}".encode()
            ).hexdigest()[:12]
            card["difficulty_estimate"] = self._estimate_difficulty(card)
            card["fsrs"] = {
                "stability": 0,
                "difficulty": 5.0,
                "review_count": 0,
                "state": 0,  # NEW
            }

        return cards[:max_cards]

    def _dedup(self, card: Dict, seen: set) -> bool:
        """Deduplication by front text hash."""
        h = hashlib.md5(card["front"][:60].encode()).hexdigest()[:10]
        if h in seen:
            return False
        seen.add(h)
        return True

    def _concept_card(self, concept: Dict, chunks: List[Dict], lang: str = "en") -> Optional[Dict]:
        """Create concept-definition flashcard."""
        name = concept.get("concept", "")
        if not name or len(name) < 3:
            return None

        # Find definition from chunk context
        definition = self._extract_definition(name, chunks)
        if not definition:
            return None

        templates = CARD_TEMPLATES.get(lang, CARD_TEMPLATES["en"])

        return {
            "front": templates["concept_front"].format(name=name),
            "back": definition[:400],
            "card_type": "concept",
            "concept": name,
            "tags": [],
        }

    def _reverse_card(self, concept_card: Dict, lang: str = "en") -> Optional[Dict]:
        """Create reverse card: definition → concept name."""
        back = concept_card.get("back", "")
        concept = concept_card.get("concept", "")
        if not back or not concept or len(back) < 20:
            return None

        # Mask concept name in definition
        masked = re.sub(
            re.escape(concept), "___", back,
            flags=re.IGNORECASE, count=1
        )
        if "___" not in masked:
            masked = back  # If concept not in definition, use as-is

        templates = CARD_TEMPLATES.get(lang, CARD_TEMPLATES["en"])

        return {
            "front": templates["reverse_front"].format(masked=masked[:300]),
            "back": concept,
            "card_type": "reverse",
            "concept": concept,
            "tags": [],
        }

    def _cloze_cards(self, text: str, concepts: List[Dict]) -> List[Dict]:
        """Create cloze deletion cards (language-independent — uses document text)."""
        cards = []
        sentences = re.split(r'[.!?]+', text)
        concept_names = [c["concept"] for c in concepts if len(c.get("concept", "")) > 3]

        for sent in sentences:
            sent = sent.strip()
            if len(sent) < 30:
                continue

            for concept in concept_names:
                if concept.lower() in sent.lower() and len(concept) > 3:
                    cloze = re.sub(
                        re.escape(concept), "[...]",
                        sent, flags=re.IGNORECASE, count=1,
                    )
                    if "[...]" in cloze:
                        cards.append({
                            "front": cloze[:300],
                            "back": concept,
                            "card_type": "cloze",
                            "concept": concept,
                            "tags": [],
                        })
                        break  # One card per sentence

        return cards[:8]

    def _key_value_cards(self, text: str, lang: str = "en") -> List[Dict]:
        """
        Extract key-value style facts from text.
        Patterns: "X is Y", "X: Y", "X — Y", "X là Y"
        """
        cards = []
        templates = CARD_TEMPLATES.get(lang, CARD_TEMPLATES["en"])

        patterns = [
            # "Term is/are definition."
            r'(?:^|(?<=\. ))([A-Z][^.]{3,40}?)\s+(?:is|are|refers to|means)\s+([^.]{15,200})\.',
            # "Term: definition"
            r'(?:^|(?<=\n))([A-Z][^:\n]{3,40}):\s+([^\n]{15,200})',
            # Vietnamese: "Thuật ngữ là ..."
            r'(?:^|(?<=\. ))([A-ZÀ-Ỹ][^.]{3,40}?)\s+(?:là|được định nghĩa|được hiểu là|có nghĩa là)\s+([^.]{15,200})\.',
        ]

        for pattern in patterns:
            for match in re.finditer(pattern, text):
                key = match.group(1).strip()
                value = match.group(2).strip()
                if len(key) > 3 and len(value) > 15:
                    cards.append({
                        "front": templates["key_value_front"].format(key=key),
                        "back": value[:300],
                        "card_type": "key_value",
                        "concept": key,
                        "tags": [],
                    })

        return cards[:5]

    def _extract_definition(self, concept: str, chunks: List[Dict]) -> Optional[str]:
        """Find best definition from chunks."""
        best = None
        best_score = 0

        for chunk in chunks:
            text = chunk.get("text", "")
            if concept.lower() not in text.lower():
                continue

            sentences = re.split(r'[.!?]+', text)
            for sent in sentences:
                if concept.lower() in sent.lower() and len(sent.strip()) > 20:
                    # Prefer definition-like sentences (both EN and VI patterns)
                    score = len(sent.strip())
                    if any(kw in sent.lower() for kw in ['is', 'are', 'refers', 'defined', 'means', 'là', 'được định nghĩa', 'có nghĩa']):
                        score *= 2
                    if score > best_score:
                        best_score = score
                        best = sent.strip()

        return best

    def _estimate_difficulty(self, card: Dict) -> float:
        """Estimate card difficulty based on content complexity."""
        text = card.get("back", "") + card.get("front", "")
        words = text.split()
        word_count = len(words)

        # Longer answers = harder
        length_factor = min(1.0, word_count / 50)

        # Technical terms = harder (words with capitals, numbers, symbols)
        technical_count = sum(1 for w in words if any(c.isupper() for c in w[1:]) or any(c.isdigit() for c in w))
        tech_factor = min(1.0, technical_count / max(word_count, 1) * 5)

        # Card type factor
        type_difficulty = {
            "concept": 0.4,
            "cloze": 0.3,
            "reverse": 0.6,
            "key_value": 0.5,
        }
        type_factor = type_difficulty.get(card.get("card_type", "concept"), 0.5)

        difficulty = 0.3 * length_factor + 0.3 * tech_factor + 0.4 * type_factor
        return round(min(1.0, max(0.1, difficulty)), 2)

    def _enhance_with_llm(self, cards: List[Dict], lang: str = "en") -> List[Dict]:
        """Use LLM to generate better definitions, respecting language."""
        if not self.llm:
            return cards

        prompt_template = LLM_PROMPTS.get(lang, LLM_PROMPTS["en"])

        for card in cards[:5]:
            if card["card_type"] == "concept" and len(card["back"]) < 100:
                prompt = prompt_template.format(
                    concept=card['concept'],
                    definition=card['back'],
                )
                try:
                    improved = self.llm.generate(prompt, temperature=0.3, max_tokens=150)
                    if improved and not improved.startswith("[ERROR]") and len(improved) > 15:
                        card["back"] = improved.strip()
                        card["llm_enhanced"] = True
                except Exception:
                    pass

        return cards
