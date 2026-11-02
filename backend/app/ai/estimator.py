"""
Shelf Life Estimator — Estimation Engine (Phase C Upgrade)
============================================================
Calculates estimated shelf life using a weighted multi-factor formula
instead of simple multiplication.

Factors:
    1. Freshness factor — non-linear decay (polynomial)
    2. Temperature factor — penalty if stored outside optimal range
    3. Ripeness factor — overripe fruit decays exponentially faster

Formula:
    estimated_days = base_shelf_life × freshness_factor × temp_factor × ripeness_factor

DSA Concepts Used:
    - Non-linear mapping (polynomial function for decay curves)
    - Hash map (O(1) storage method lookup)
    - Clamping (constrain values to valid ranges)
"""

from __future__ import annotations


# ============================================
# Constants
# ============================================

# Default temperature assumptions per storage method (°C)
STORAGE_TEMPS: dict[str, float] = {
    "room_temp": 22.0,
    "fridge": 4.0,
    "freezer": -18.0,
}

# Ripeness stage multipliers — how much shelf life a fruit has left
# at each ripeness stage. Overripe fruit decays much faster (non-linear).
RIPENESS_MULTIPLIERS: dict[str, float] = {
    "unripe": 1.0,       # Full shelf life remaining
    "nearly_ripe": 0.85,  # Slight reduction
    "ripe": 0.65,         # Moderate reduction
    "overripe": 0.30,     # Severe reduction — eat soon!
}


def _clamp(value: float, min_val: float, max_val: float) -> float:
    """
    Constrain a value to a range [min_val, max_val].

    DSA: This is a simple but critical utility. It prevents impossible
    values (like negative days or scores above 1.0) from breaking
    downstream calculations. Used extensively in game engines and
    physics simulations.

    Example:
        _clamp(-0.5, 0.0, 1.0) → 0.0
        _clamp(1.5, 0.0, 1.0) → 1.0
        _clamp(0.7, 0.0, 1.0) → 0.7
    """
    return max(min_val, min(value, max_val))


def calculate_freshness_factor(freshness_score: float) -> float:
    """
    Convert a raw freshness score (0-1) to a weighted freshness factor.

    Uses polynomial mapping: factor = score ^ 1.5

    Why polynomial (not linear)?
    - Linear: 50% fresh = 50% shelf life left. (Unrealistic)
    - Polynomial: 50% fresh = ~35% shelf life left. (Realistic)
    - This models real-world exponential decay — fruit that's visibly
      aging has MUCH less time than the score suggests.

    DSA Concept: Non-linear mapping function (polynomial curve).
    Same principle used in audio processing (loudness curves),
    game lighting (gamma correction), and ML activation functions.
    """
    score = _clamp(freshness_score, 0.0, 1.0)
    return round(score ** 1.5, 4)


def calculate_temperature_factor(
    storage_method: str,
    optimal_temp_min: float | None = None,
    optimal_temp_max: float | None = None,
) -> float:
    """
    Calculate a temperature penalty factor based on how far the
    storage temperature is from the fruit's optimal range.

    If the storage temp is within the optimal range → factor = 1.0 (no penalty).
    The further away, the harsher the penalty (down to 0.5).

    Args:
        storage_method: One of "room_temp", "fridge", "freezer".
        optimal_temp_min: Fruit's ideal minimum storage temp (°C).
        optimal_temp_max: Fruit's ideal maximum storage temp (°C).

    Returns:
        Factor between 0.5 and 1.0.
    """
    # If we don't know the fruit's optimal temp, assume no penalty
    if optimal_temp_min is None or optimal_temp_max is None:
        return 1.0

    # Get assumed storage temperature
    storage_temp = STORAGE_TEMPS.get(storage_method, 22.0)

    # Freezer is a special case — always preserves well regardless of optimal temp
    if storage_method == "freezer":
        return 0.95  # Slight penalty for texture degradation

    # Calculate how far off we are from optimal
    if optimal_temp_min <= storage_temp <= optimal_temp_max:
        return 1.0  # Perfect — within optimal range

    # Distance from optimal range (in °C)
    if storage_temp < optimal_temp_min:
        deviation = optimal_temp_min - storage_temp
    else:
        deviation = storage_temp - optimal_temp_max

    # Penalty: 2% per degree off (max penalty caps at 0.5)
    penalty = deviation * 0.02
    return _clamp(1.0 - penalty, 0.5, 1.0)


def calculate_ripeness_factor(freshness_score: float) -> float:
    """
    Infer a ripeness stage from the freshness score, then return
    the corresponding decay multiplier.

    This is a simplified model — in Phase 2, the AI freshness model
    could output a ripeness stage directly.

    Mapping:
        0.85 - 1.00 → "unripe" / just bought → full shelf life
        0.70 - 0.84 → "nearly_ripe" → slight reduction
        0.50 - 0.69 → "ripe" → moderate reduction
        0.00 - 0.49 → "overripe" → severe reduction

    DSA Concept: Range-based classification using sorted boundaries.
    """
    score = _clamp(freshness_score, 0.0, 1.0)

    if score >= 0.85:
        return RIPENESS_MULTIPLIERS["unripe"]
    elif score >= 0.70:
        return RIPENESS_MULTIPLIERS["nearly_ripe"]
    elif score >= 0.50:
        return RIPENESS_MULTIPLIERS["ripe"]
    else:
        return RIPENESS_MULTIPLIERS["overripe"]


def estimate_shelf_life(
    shelf_life_room_temp: float,
    shelf_life_fridge: float,
    shelf_life_freezer: float,
    freshness_score: float,
    optimal_temp_min: float | None = None,
    optimal_temp_max: float | None = None,
) -> dict[str, float]:
    """
    Calculate estimated remaining shelf life for all storage methods
    using the weighted multi-factor formula.

    Formula per storage method:
        estimated_days = base_days × freshness_factor × temp_factor × ripeness_factor

    Args:
        shelf_life_room_temp: Base shelf life at room temperature (days).
        shelf_life_fridge: Base shelf life refrigerated (days).
        shelf_life_freezer: Base shelf life frozen (days).
        freshness_score: Visual freshness score from AI (0.0 - 1.0).
        optimal_temp_min: Fruit's ideal minimum storage temp (°C).
        optimal_temp_max: Fruit's ideal maximum storage temp (°C).

    Returns:
        dict mapping storage method to estimated days remaining.
        Example: {"room_temp": 3.5, "fridge": 10.0, "freezer": 120.0}
    """
    freshness_factor = calculate_freshness_factor(freshness_score)
    ripeness_factor = calculate_ripeness_factor(freshness_score)

    base_shelf_lives: dict[str, float] = {
        "room_temp": shelf_life_room_temp,
        "fridge": shelf_life_fridge,
        "freezer": shelf_life_freezer,
    }

    result: dict[str, float] = {}
    for method, base_days in base_shelf_lives.items():
        temp_factor = calculate_temperature_factor(
            method, optimal_temp_min, optimal_temp_max
        )
        estimated = base_days * freshness_factor * temp_factor * ripeness_factor
        result[method] = round(max(estimated, 0.0), 1)

    return result


def get_days_for_method(
    shelf_life_estimates: dict[str, float],
    storage_method: str,
) -> float:
    """
    Get the estimated days remaining for a specific storage method.

    Args:
        shelf_life_estimates: Output from estimate_shelf_life().
        storage_method: One of "room_temp", "fridge", "freezer".

    Returns:
        Estimated days remaining as a float.

    Raises:
        ValueError: If storage_method is not recognized.
    """
    if storage_method not in shelf_life_estimates:
        raise ValueError(
            f"Invalid storage method: '{storage_method}'. "
            f"Must be one of: {list(shelf_life_estimates.keys())}"
        )
    return shelf_life_estimates[storage_method]


def recommend_best_storage(
    shelf_life_estimates: dict[str, float],
    current_method: str = "room_temp",
) -> str:
    """
    Recommend the best storage method based on estimated shelf life.

    Compares all storage methods and suggests switching if another
    method gives significantly more days.

    Args:
        shelf_life_estimates: Output from estimate_shelf_life().
        current_method: The storage method the user is currently using.

    Returns:
        Human-readable recommendation string.

    DSA Concept: Simple max-finding over a small fixed-size collection.
    O(1) since we always have exactly 3 storage methods.
    """
    current_days = shelf_life_estimates.get(current_method, 0)
    best_method = max(shelf_life_estimates, key=shelf_life_estimates.get)
    best_days = shelf_life_estimates[best_method]

    # Format method names for display
    display_names = {
        "room_temp": "room temperature",
        "fridge": "the fridge",
        "freezer": "the freezer",
    }

    if best_method == current_method:
        return (
            f"You're already using the best storage! "
            f"{display_names[current_method].title()} gives you ~{current_days:.0f} days."
        )

    days_gained = best_days - current_days
    return (
        f"Move to {display_names[best_method]} — "
        f"you'll gain ~{days_gained:.0f} extra days "
        f"({current_days:.0f} → {best_days:.0f} days)."
    )
