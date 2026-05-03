"""
NEUROVAULT — Flashcard Generator (White-Box)
Tự tạo flashcards từ concepts + definitions + chunks.
"""

import re
from typing import List, Dict


class FlashcardGenerator:
    """
    Generate flashcards from document content.
    Types: Concept-Definition, Cloze Deletion, Key-Value.
    """

    def __init__(self, llm_engine=None):
        self.llm = llm_engine

    def generate(
        self,
        concepts: List[Dict],
        chunks: List[Dict],
        max_cards: int = 20,
    ) -> List[Dict]:
        """Generate flashcards from concepts and chunks."""
        cards = []

        # 1. Concept-definition cards
        for concept in concepts:
            card = self._concept_card(concept, chunks)
            if card:
                cards.append(card)

        # 2. Cloze deletion cards
        for chunk in chunks[:10]:
            cloze_cards = self._cloze_cards(chunk["text"], concepts)
            cards.extend(cloze_cards)

        # Deduplicate and limit
        seen = set()
        unique_cards = []
        for card in cards:
            key = card["front"][:50]
            if key not in seen:
                seen.add(key)
                unique_cards.append(card)

        return unique_cards[:max_cards]

    def _concept_card(self, concept: Dict, chunks: List[Dict]) -> Dict:
        """Create concept-definition flashcard."""
        name = concept.get("concept", "")
        if not name:
            return None

        # Find definition from chunk context
        definition = ""
        for chunk in chunks:
            text = chunk.get("text", "")
            if name.lower() in text.lower():
                # Extract sentence containing concept
                sentences = re.split(r'[.!?]+', text)
                for sent in sentences:
                    if name.lower() in sent.lower() and len(sent.strip()) > 20:
                        definition = sent.strip()
                        break
                if definition:
                    break

        if not definition:
            return None

        return {
            "front": f"What is {name}?",
            "back": definition[:300],
            "card_type": "concept",
            "concept": name,
            "tags": [],
        }

    def _cloze_cards(self, text: str, concepts: List[Dict]) -> List[Dict]:
        """Create cloze deletion cards."""
        cards = []
        sentences = re.split(r'[.!?]+', text)
        concept_names = [c["concept"] for c in concepts]

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
                            "front": cloze,
                            "back": concept,
                            "card_type": "cloze",
                            "concept": concept,
                            "tags": [],
                        })
                        break  # One card per sentence

        return cards[:5]
