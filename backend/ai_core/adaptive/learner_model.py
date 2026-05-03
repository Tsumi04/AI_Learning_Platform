"""
NEUROVAULT — Learner Model (White-Box)
Bayesian Knowledge Tracing + Learning Velocity Tracking.
Mô hình hóa kiến thức của người học theo thời gian.
"""

import math
from typing import Dict, List, Optional


class BayesianKnowledgeTracer:
    """
    Bayesian Knowledge Tracing (BKT).
    Ước tính P(Learned) — xác suất người học đã nắm vững concept.

    Parameters:
        p_init: Initial probability of knowing (P(L0))
        p_transit: Probability of learning from one trial (P(T))
        p_slip: Probability of incorrect despite knowing (P(S))
        p_guess: Probability of correct despite not knowing (P(G))
    """

    def __init__(
        self,
        p_init: float = 0.2,
        p_transit: float = 0.1,
        p_slip: float = 0.1,
        p_guess: float = 0.25,
    ):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_slip = p_slip
        self.p_guess = p_guess

    def update(self, p_known: float, is_correct: bool) -> float:
        """
        Update P(Known) based on observation.
        Returns new P(Known) after observing correct/incorrect.
        """
        if is_correct:
            # P(L | correct) = P(correct | L) * P(L) / P(correct)
            p_correct_given_known = 1 - self.p_slip
            p_correct_given_unknown = self.p_guess
            p_correct = p_correct_given_known * p_known + p_correct_given_unknown * (1 - p_known)

            if p_correct > 0:
                p_known_posterior = (p_correct_given_known * p_known) / p_correct
            else:
                p_known_posterior = p_known
        else:
            # P(L | incorrect) = P(incorrect | L) * P(L) / P(incorrect)
            p_incorrect_given_known = self.p_slip
            p_incorrect_given_unknown = 1 - self.p_guess
            p_incorrect = p_incorrect_given_known * p_known + p_incorrect_given_unknown * (1 - p_known)

            if p_incorrect > 0:
                p_known_posterior = (p_incorrect_given_known * p_known) / p_incorrect
            else:
                p_known_posterior = p_known

        # Apply learning transition
        p_known_new = p_known_posterior + (1 - p_known_posterior) * self.p_transit

        return max(0.0, min(1.0, p_known_new))

    def predict_correct(self, p_known: float) -> float:
        """Predict probability of correct answer."""
        return p_known * (1 - self.p_slip) + (1 - p_known) * self.p_guess

    def is_mastered(self, p_known: float, threshold: float = 0.95) -> bool:
        """Check if concept is mastered."""
        return p_known >= threshold


class LearnerModel:
    """
    Comprehensive learner model combining BKT + velocity tracking.
    """

    def __init__(self):
        self.bkt = BayesianKnowledgeTracer()
        self.concept_states: Dict[str, Dict] = {}

    def update_concept(self, concept_id: str, is_correct: bool, response_time_ms: int = 0) -> Dict:
        """Update learner's knowledge state for a concept."""
        if concept_id not in self.concept_states:
            self.concept_states[concept_id] = {
                "p_known": self.bkt.p_init,
                "attempts": 0,
                "correct": 0,
                "streak": 0,
                "avg_response_time": 0,
                "mastered": False,
            }

        state = self.concept_states[concept_id]
        state["attempts"] += 1

        if is_correct:
            state["correct"] += 1
            state["streak"] += 1
        else:
            state["streak"] = 0

        # Update BKT
        state["p_known"] = self.bkt.update(state["p_known"], is_correct)
        state["mastered"] = self.bkt.is_mastered(state["p_known"])

        # Update response time average
        if response_time_ms > 0:
            prev_avg = state["avg_response_time"]
            n = state["attempts"]
            state["avg_response_time"] = prev_avg + (response_time_ms - prev_avg) / n

        return state

    def get_learning_velocity(self) -> float:
        """Calculate overall learning velocity (concepts mastered per attempt)."""
        total_attempts = sum(s["attempts"] for s in self.concept_states.values())
        total_mastered = sum(1 for s in self.concept_states.values() if s["mastered"])

        if total_attempts == 0:
            return 0.0
        return total_mastered / total_attempts

    def get_weak_concepts(self, threshold: float = 0.5) -> List[str]:
        """Get concepts that need more practice."""
        return [
            cid for cid, state in self.concept_states.items()
            if state["p_known"] < threshold
        ]

    def get_profile(self) -> Dict:
        """Get learner profile summary."""
        total = len(self.concept_states)
        mastered = sum(1 for s in self.concept_states.values() if s["mastered"])

        return {
            "total_concepts": total,
            "mastered_concepts": mastered,
            "mastery_rate": round(mastered / max(total, 1), 3),
            "learning_velocity": round(self.get_learning_velocity(), 4),
            "weak_concepts": self.get_weak_concepts(),
            "concepts": {
                cid: {
                    "p_known": round(s["p_known"], 4),
                    "mastered": s["mastered"],
                    "accuracy": round(s["correct"] / max(s["attempts"], 1), 3),
                    "attempts": s["attempts"],
                }
                for cid, s in self.concept_states.items()
            },
        }
