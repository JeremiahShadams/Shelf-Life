"""
Fresco — Decision Engine (THE CORE BRAIN)
============================================
Central authority that combines all signals from the AI pipeline
into a single, deterministic verdict.

This module receives outputs from:
    - Classifier (what fruit is it?)
    - Freshness assessor (how fresh is it?)
    - Estimator (how many days left?)
    - Compatibility engine (ethylene interactions)

And produces ONE unified decision with:
    - Status classification (FRESH / EAT_SOON / EAT_TODAY / SPOILED)
    - Confidence score (weighted fusion of all signals)
    - Human-readable recommendation
    - Storage guidance

Architecture principle:
    Every upstream module feeds data INTO the decision engine.
    Only the decision engine produces user-facing output.
    No other module should generate final recommendations.

DSA Concepts:
    - Weighted scoring (linear combination of normalised signals)
    - Normalisation (mapping different value ranges to 0–1)
    - Clamping (bounding outputs to valid ranges)
"""

from __future__ import annotations

from dataclasses import dataclass


FRESHNESS_WEIGHT: float = 0.6
SHELF_LIFE_WEIGHT: float = 0.4


STATUS_THRESHOLDS: list[tuple[float, str]] = [
    (0.70, "FRESH"),       # Score > 0.70 → plenty of life left
    (0.40, "EAT_SOON"),    # 0.40–0.70 → consume in next 1-2 days
    (0.20, "EAT_TODAY"),   # 0.20–0.40 → consume immediately
    (0.00, "SPOILED"),     # < 0.20 → not safe to eat
]


@dataclass
class Verdict:
    """
    The final, authoritative output of the decision engine.

    Every field here is user-facing — the frontend should be able
    to render this directly without any transformation.
    """
    fruit_name: str
    status: str                      # FRESH | EAT_SOON | EAT_TODAY | SPOILED
    days_left: float                 # Best estimate for current storage method
    confidence: float                # 0.0–1.0 composite score
    freshness_score: float           # Raw AI freshness score
    freshness_label: str             # Human label: "Fresh", "Aging", etc.
    recommendation: str              # One-liner telling user what to do
    storage_tip: str                 # Domain-specific storage advice
    best_storage: str                # Recommended storage method
    shelf_life_by_method: dict       # All 3 estimates: room/fridge/freezer
    compatibility_warnings: list     # Ethylene conflict warnings (if any)
    ethylene_note: str | None        # Quick note about ethylene behavior


def _clamp(value: float, low: float, high: float) -> float:
    """Constrain a value to a valid range."""
    return max(low, min(value, high))


def _normalise_days(days_left: float, base_days: float) -> float:
    """
    Normalise days remaining to a 0–1 scale relative to the fruit's
    maximum shelf life for the base storage method (room temp).

    Example:
        Banana has 5 day base. 3 days left → 3/5 = 0.6
        Apple has 7 day base. 7 days left → 7/7 = 1.0

    This normalisation is critical because raw days are not comparable
    across fruits. 3 days left for a strawberry (base: 2) is great.
    3 days left for an apple (base: 7) is concerning.
    """
    if base_days <= 0:
        return 0.0
    return _clamp(days_left / base_days, 0.0, 1.0)


def _classify_status(score: float) -> str:
    
    
    for threshold, status in STATUS_THRESHOLDS:
        if score >= threshold:
            return status
    return "SPOILED"


def _generate_recommendation(status: str, fruit_name: str, days_left: float, best_storage: str) -> str:
    """
    Generate a human-readable, actionable recommendation.

    NOT generic. Each status produces a distinct, useful sentence
    that tells the user exactly what to do.
    """
    display_storage = {
        "room_temp": "at room temperature",
        "fridge": "in the fridge",
        "freezer": "in the freezer",
    }
    storage_str = display_storage.get(best_storage, best_storage)

    if status == "FRESH":
        return (
            f"Your {fruit_name} is in great condition. "
            f"Store {storage_str} for up to {days_left:.0f} days."
        )
    elif status == "EAT_SOON":
        return (
            f"Your {fruit_name} is still good but showing signs of age. "
            f"Best consumed within {days_left:.0f} days."
        )
    elif status == "EAT_TODAY":
        return (
            f"Your {fruit_name} needs to be consumed today. "
            f"Consider using it in a smoothie or recipe."
        )
    else:  # SPOILED
        return (
            f"Your {fruit_name} appears to be past its prime. "
            f"Inspect carefully before consuming."
        )


def _generate_ethylene_note(is_producer: bool, is_sensitive: bool, fruit_name: str) -> str | None:
    """
    Generate a brief ethylene behavior note for this fruit.
    Returns None if the fruit has no notable ethylene behavior.
    """
    if is_producer and is_sensitive:
        return (
            f"{fruit_name} both produces and is sensitive to ethylene gas. "
            f"Store away from other ethylene-producing fruits."
        )
    elif is_producer:
        return (
            f"{fruit_name} produces ethylene gas that can ripen nearby fruits faster. "
            f"Consider storing it separately."
        )
    elif is_sensitive:
        return (
            f"{fruit_name} is sensitive to ethylene gas. "
            f"Keep away from apples, bananas, and avocados."
        )
    return None


def produce_verdict(
    fruit_name: str,
    freshness_score: float,
    freshness_label: str,
    shelf_life_estimates: dict[str, float],
    base_room_temp_days: float,
    storage_tips: str,
    is_ethylene_producer: bool = False,
    is_ethylene_sensitive: bool = False,
    compatibility_warnings: list | None = None,
) -> Verdict:
    """
    The single authoritative function that produces the final decision.

    This is the ONLY function the orchestration layer should call
    to generate user-facing output. All upstream modules (classifier,
    freshness, estimator, compatibility) feed their data here.

    Signal Fusion Algorithm:
        1. Normalise freshness score (already 0–1) — weight: 60%
        2. Normalise days remaining relative to base shelf life — weight: 40%
        3. Compute composite score = weighted sum
        4. Classify status from composite score
        5. Determine best storage method
        6. Generate human-readable recommendation

    Args:
        fruit_name: Identified fruit name.
        freshness_score: Raw AI freshness score (0.0–1.0).
        freshness_label: Human-readable freshness label.
        shelf_life_estimates: Dict of {method: days_remaining}.
        base_room_temp_days: Base shelf life at room temp (for normalisation).
        storage_tips: Domain-specific storage advice string.
        is_ethylene_producer: Whether this fruit emits ethylene.
        is_ethylene_sensitive: Whether this fruit reacts to ethylene.
        compatibility_warnings: List of ethylene conflict dicts (optional).

    Returns:
        Verdict dataclass — the complete, user-facing decision.
    """
    # --- Step 1: Determine best storage method ---
    # The method with the most estimated days remaining wins
    best_storage = max(shelf_life_estimates, key=shelf_life_estimates.get)
    days_left_best = shelf_life_estimates[best_storage]

    # For the composite score, use room temp days as the "current" baseline
    days_left_current = shelf_life_estimates.get("room_temp", days_left_best)

    # --- Step 2: Normalise the shelf life signal ---
    normalised_days = _normalise_days(days_left_current, base_room_temp_days)

    # --- Step 3: Compute composite confidence score ---
    # Weighted fusion: 60% visual freshness + 40% remaining life ratio
    composite_score = (
        freshness_score * FRESHNESS_WEIGHT +
        normalised_days * SHELF_LIFE_WEIGHT
    )
    composite_score = _clamp(composite_score, 0.0, 1.0)

    # --- Step 4: Classify status ---
    status = _classify_status(composite_score)

    # --- Step 5: Generate human outputs ---
    recommendation = _generate_recommendation(
        status, fruit_name, days_left_current, best_storage
    )
    ethylene_note = _generate_ethylene_note(
        is_ethylene_producer, is_ethylene_sensitive, fruit_name
    )

    # --- Step 6: Assemble verdict ---
    return Verdict(
        fruit_name=fruit_name,
        status=status,
        days_left=round(days_left_current, 1),
        confidence=round(composite_score, 2),
        freshness_score=freshness_score,
        freshness_label=freshness_label,
        recommendation=recommendation,
        storage_tip=storage_tips or "",
        best_storage=best_storage,
        shelf_life_by_method=shelf_life_estimates,
        compatibility_warnings=compatibility_warnings or [],
        ethylene_note=ethylene_note,
    )
