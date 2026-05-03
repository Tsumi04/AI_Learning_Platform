"""
NEUROVAULT — FSRS Spaced Repetition (White-Box)
Free Spaced Repetition Scheduler — thuật toán hiện đại nhất 2025.
Tự implement 100%, không dùng library nào.
"""

import math
from datetime import datetime, timedelta
from typing import Dict, Tuple


# Rating scale
AGAIN = 1  # Forgot completely
HARD = 2   # Recalled with difficulty
GOOD = 3   # Recalled correctly
EASY = 4   # Recalled effortlessly


class FSRS:
    """
    Free Spaced Repetition Scheduler.
    
    Core parameters:
    - Stability (S): Expected days until retention drops to 90%
    - Difficulty (D): Intrinsic difficulty of item (1-10)
    - Retrievability (R): Current probability of recall
    
    Formulas based on FSRS-4.5 algorithm.
    """

    # Default weights (w0-w12) from FSRS research
    W = [
        0.4,    # w0: initial stability for AGAIN
        0.6,    # w1: initial stability for HARD
        2.4,    # w2: initial stability for GOOD
        5.8,    # w3: initial stability for EASY
        4.93,   # w4: difficulty mean reversion
        0.94,   # w5: difficulty change
        0.86,   # w6: stability growth (base)
        0.01,   # w7: stability decay factor
        1.49,   # w8: stability growth rate (good)
        0.14,   # w9: stability growth (hard penalty)
        0.94,   # w10: stability growth (easy bonus)
        2.18,   # w11: stability after forgetting
        0.05,   # w12: difficulty change on failure
    ]

    DESIRED_RETENTION = 0.9  # Target 90% recall probability

    def __init__(self, weights: list = None):
        if weights:
            self.W = weights

    def initial_review(self, rating: int) -> Dict:
        """First review of a new card."""
        d = self._initial_difficulty(rating)
        s = self._initial_stability(rating)
        
        interval = self._next_interval(s)
        
        return {
            "stability": round(s, 4),
            "difficulty": round(d, 4),
            "interval_days": interval,
            "next_review": (datetime.utcnow() + timedelta(days=interval)).isoformat(),
            "review_count": 1,
            "ease_factor": round(2.5 + (rating - 3) * 0.15, 2),
        }

    def review(
        self,
        rating: int,
        stability: float,
        difficulty: float,
        elapsed_days: float,
        review_count: int,
    ) -> Dict:
        """Process a review and update scheduling parameters."""
        
        # Current retrievability
        r = self._retrievability(elapsed_days, stability)
        
        # Update difficulty
        new_d = self._next_difficulty(difficulty, rating)
        
        # Update stability
        if rating == AGAIN:
            new_s = self._stability_after_failure(stability, difficulty, r)
        else:
            new_s = self._stability_after_success(stability, difficulty, r, rating)
        
        # Calculate next interval
        interval = self._next_interval(new_s)
        
        return {
            "stability": round(new_s, 4),
            "difficulty": round(new_d, 4),
            "retrievability": round(r, 4),
            "interval_days": interval,
            "next_review": (datetime.utcnow() + timedelta(days=interval)).isoformat(),
            "review_count": review_count + 1,
            "ease_factor": round(2.5 + (rating - 3) * 0.15, 2),
        }

    def _initial_stability(self, rating: int) -> float:
        """S0 based on first rating."""
        idx = max(0, min(rating - 1, 3))
        return max(self.W[idx], 0.1)

    def _initial_difficulty(self, rating: int) -> float:
        """D0 based on first rating."""
        d = self.W[4] - (rating - 3) * self.W[5]
        return max(1.0, min(10.0, d))

    def _retrievability(self, elapsed_days: float, stability: float) -> float:
        """R(t) = (1 + t / (9 * S))^(-1)"""
        if stability <= 0:
            return 0.0
        return (1 + elapsed_days / (9 * stability)) ** (-1)

    def _next_difficulty(self, d: float, rating: int) -> float:
        """Update difficulty based on rating."""
        delta = -(rating - 3) * self.W[12]
        # Mean reversion
        new_d = d + delta
        new_d = self.W[4] * (1 - 1/max(new_d, 0.1)) + new_d / max(new_d, 0.1)
        return max(1.0, min(10.0, new_d))

    def _stability_after_success(self, s: float, d: float, r: float, rating: int) -> float:
        """Stability increase after successful recall."""
        hard_penalty = self.W[9] if rating == HARD else 1.0
        easy_bonus = self.W[10] if rating == EASY else 1.0
        
        new_s = s * (
            1 + math.exp(self.W[6]) *
            (11 - d) *
            (s ** (-self.W[7])) *
            (math.exp((1 - r) * self.W[8]) - 1) *
            hard_penalty *
            easy_bonus
        )
        return max(new_s, 0.1)

    def _stability_after_failure(self, s: float, d: float, r: float) -> float:
        """Stability after forgetting (rating=AGAIN)."""
        new_s = self.W[11] * (d ** (-0.5)) * ((s + 1) ** 0.2 - 1) * math.exp((1 - r) * 0.5)
        return max(min(new_s, s), 0.1)

    def _next_interval(self, stability: float) -> int:
        """Calculate next interval in days from stability."""
        interval = (stability / 0.9) * (self.DESIRED_RETENTION ** (1 / -0.5) - 1)
        interval = max(1, round(interval))
        return min(interval, 365)  # Cap at 1 year
