"""
NEUROVAULT — Deep Knowledge Tracing (White-Box)
LSTM-inspired sequential model for tracking learner mastery over time.
Implemented with pure NumPy — no PyTorch/TensorFlow.

Architecture:
- Input: sequence of (concept_id, is_correct) interactions
- Hidden state: tracks mastery per concept + temporal decay
- Output: predicted mastery probability per concept

This is a simplified DKT that uses:
1. Exponential Moving Average for concept mastery tracking
2. Temporal decay (forgetting curve)
3. Cross-concept knowledge transfer
"""

import math
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ConceptState:
    """State of a single concept for a learner."""
    concept: str
    p_mastery: float = 0.3        # Current mastery probability
    attempts: int = 0
    correct: int = 0
    ema_score: float = 0.5        # Exponential moving average of correct responses
    last_interaction: Optional[datetime] = None
    difficulty_estimate: float = 0.5  # Estimated concept difficulty (0=easy, 1=hard)
    stability: float = 1.0        # How stable is the knowledge (higher = more stable)


class DeepKnowledgeTracer:
    """
    Sequential knowledge tracing with temporal decay.
    Combines BKT principles with EMA smoothing and forgetting curves.
    """

    def __init__(
        self,
        p_init: float = 0.3,       # Initial mastery probability
        p_learn: float = 0.1,      # Learning rate per correct answer
        p_slip: float = 0.1,       # P(wrong | mastered)
        p_guess: float = 0.25,     # P(correct | not mastered)
        ema_alpha: float = 0.3,    # EMA smoothing factor
        decay_rate: float = 0.05,  # Forgetting curve decay per day
        transfer_rate: float = 0.02,  # Cross-concept transfer learning rate
    ):
        self.p_init = p_init
        self.p_learn = p_learn
        self.p_slip = p_slip
        self.p_guess = p_guess
        self.ema_alpha = ema_alpha
        self.decay_rate = decay_rate
        self.transfer_rate = transfer_rate
        
        # Per-learner concept states
        self.learner_states: Dict[str, Dict[str, ConceptState]] = {}

    def get_state(self, learner_id: str, concept: str) -> ConceptState:
        """Get or create concept state for a learner."""
        if learner_id not in self.learner_states:
            self.learner_states[learner_id] = {}
        
        states = self.learner_states[learner_id]
        if concept not in states:
            states[concept] = ConceptState(concept=concept, p_mastery=self.p_init)
        
        return states[concept]

    def _apply_temporal_decay(self, state: ConceptState, now: Optional[datetime] = None) -> float:
        """Apply forgetting curve: mastery decays towards p_init over time."""
        if state.last_interaction is None or now is None:
            return state.p_mastery
        
        days_elapsed = (now - state.last_interaction).total_seconds() / 86400.0
        if days_elapsed <= 0:
            return state.p_mastery
        
        # Exponential decay modulated by stability
        effective_decay = self.decay_rate / max(0.1, state.stability)
        decay_factor = math.exp(-effective_decay * days_elapsed)
        
        # Mastery decays towards p_init
        decayed = self.p_init + (state.p_mastery - self.p_init) * decay_factor
        return max(0.01, min(0.99, decayed))

    def _bayes_update(self, p_mastery: float, is_correct: bool) -> float:
        """Bayesian update of mastery probability given observation."""
        if is_correct:
            # P(mastered | correct) = P(correct | mastered) * P(mastered) / P(correct)
            p_correct = (1 - self.p_slip) * p_mastery + self.p_guess * (1 - p_mastery)
            if p_correct == 0:
                return p_mastery
            p_mastered_given_correct = ((1 - self.p_slip) * p_mastery) / p_correct
            # Learning: even if not mastered, there's a chance of learning
            p_new = p_mastered_given_correct + (1 - p_mastered_given_correct) * self.p_learn
        else:
            # P(mastered | wrong) = P(wrong | mastered) * P(mastered) / P(wrong)
            p_wrong = self.p_slip * p_mastery + (1 - self.p_guess) * (1 - p_mastery)
            if p_wrong == 0:
                return p_mastery
            p_mastered_given_wrong = (self.p_slip * p_mastery) / p_wrong
            p_new = p_mastered_given_wrong + (1 - p_mastered_given_wrong) * self.p_learn * 0.3
        
        return max(0.01, min(0.99, p_new))

    def update(
        self,
        learner_id: str,
        concept: str,
        is_correct: bool,
        timestamp: Optional[datetime] = None,
        related_concepts: List[str] = None,
    ) -> Dict:
        """
        Update mastery after a learning interaction.
        
        Returns:
            Dict with updated mastery info
        """
        now = timestamp or datetime.now()
        state = self.get_state(learner_id, concept)
        
        # Step 1: Apply temporal decay
        state.p_mastery = self._apply_temporal_decay(state, now)
        
        # Step 2: Bayesian update
        old_mastery = state.p_mastery
        state.p_mastery = self._bayes_update(state.p_mastery, is_correct)
        
        # Step 3: Update EMA
        score = 1.0 if is_correct else 0.0
        state.ema_score = self.ema_alpha * score + (1 - self.ema_alpha) * state.ema_score
        
        # Step 4: Update statistics
        state.attempts += 1
        if is_correct:
            state.correct += 1
        
        # Step 5: Update stability (correct answers increase stability)
        if is_correct:
            state.stability = min(10.0, state.stability * 1.1)
        else:
            state.stability = max(0.1, state.stability * 0.8)
        
        # Step 6: Update difficulty estimate
        if state.attempts >= 3:
            state.difficulty_estimate = 1.0 - (state.correct / state.attempts)
        
        state.last_interaction = now
        
        # Step 7: Cross-concept knowledge transfer
        if related_concepts:
            for related in related_concepts:
                r_state = self.get_state(learner_id, related)
                if is_correct:
                    boost = self.transfer_rate * (state.p_mastery - r_state.p_mastery)
                    r_state.p_mastery = min(0.99, r_state.p_mastery + max(0, boost))
        
        return {
            "concept": concept,
            "old_mastery": round(old_mastery, 4),
            "new_mastery": round(state.p_mastery, 4),
            "delta": round(state.p_mastery - old_mastery, 4),
            "ema_score": round(state.ema_score, 4),
            "attempts": state.attempts,
            "accuracy": round(state.correct / state.attempts, 4) if state.attempts > 0 else 0,
            "stability": round(state.stability, 4),
            "difficulty": round(state.difficulty_estimate, 4),
        }

    def predict_mastery(
        self,
        learner_id: str,
        concept: str,
        at_time: Optional[datetime] = None,
    ) -> float:
        """Predict current mastery probability with temporal decay."""
        state = self.get_state(learner_id, concept)
        now = at_time or datetime.now()
        return self._apply_temporal_decay(state, now)

    def get_weak_concepts(
        self,
        learner_id: str,
        threshold: float = 0.5,
        at_time: Optional[datetime] = None,
    ) -> List[Dict]:
        """Get concepts below mastery threshold — candidates for review."""
        if learner_id not in self.learner_states:
            return []
        
        now = at_time or datetime.now()
        weak = []
        for concept, state in self.learner_states[learner_id].items():
            mastery = self._apply_temporal_decay(state, now)
            if mastery < threshold:
                weak.append({
                    "concept": concept,
                    "mastery": round(mastery, 4),
                    "attempts": state.attempts,
                    "difficulty": round(state.difficulty_estimate, 4),
                    "priority": round((1 - mastery) * state.difficulty_estimate, 4),
                })
        
        # Sort by priority (highest priority = most needs review)
        weak.sort(key=lambda x: x["priority"], reverse=True)
        return weak

    def get_recommended_difficulty(
        self,
        learner_id: str,
        concepts: List[str],
        at_time: Optional[datetime] = None,
    ) -> float:
        """
        Calculate adaptive quiz difficulty based on learner's mastery.
        Returns value between 0 (easy) and 1 (hard).
        """
        if not concepts or learner_id not in self.learner_states:
            return 0.5  # Default medium difficulty
        
        now = at_time or datetime.now()
        masteries = []
        for concept in concepts:
            mastery = self.predict_mastery(learner_id, concept, now)
            masteries.append(mastery)
        
        avg_mastery = sum(masteries) / len(masteries) if masteries else 0.5
        
        # Higher mastery → harder questions (challenge zone)
        # Target ~70% success rate (optimal learning zone)
        recommended = min(1.0, avg_mastery * 1.2)
        return round(recommended, 4)

    def get_learner_summary(self, learner_id: str) -> Dict:
        """Get comprehensive learner statistics."""
        if learner_id not in self.learner_states:
            return {
                "total_concepts": 0,
                "mastered_concepts": 0,
                "average_mastery": 0,
                "total_interactions": 0,
                "overall_accuracy": 0,
            }
        
        states = self.learner_states[learner_id]
        now = datetime.now()
        
        total = len(states)
        masteries = [self._apply_temporal_decay(s, now) for s in states.values()]
        mastered = sum(1 for m in masteries if m >= 0.7)
        total_attempts = sum(s.attempts for s in states.values())
        total_correct = sum(s.correct for s in states.values())
        
        return {
            "total_concepts": total,
            "mastered_concepts": mastered,
            "average_mastery": round(sum(masteries) / total, 4) if total > 0 else 0,
            "total_interactions": total_attempts,
            "overall_accuracy": round(total_correct / total_attempts, 4) if total_attempts > 0 else 0,
            "mastery_distribution": {
                "low": sum(1 for m in masteries if m < 0.3),
                "medium": sum(1 for m in masteries if 0.3 <= m < 0.7),
                "high": sum(1 for m in masteries if m >= 0.7),
            },
        }
