"""
Shelf Life Estimator — Expiry Math Service
==========================================
Single source of truth for computing *truthful* expiry state.

estimated_days_remaining in the DB is a snapshot taken at scan/patch time.
It is never recalculated on its own, so anything that displays it must
derive days_left from estimated_expiry (the moving deadline) instead.

This service is the only place that logic lives.
"""

from datetime import datetime, timezone

# Thresholds (in days) used for both color coding and reminders.
FRESH_THRESHOLD = 4.0    # > 4 days  → calm
EAT_SOON_THRESHOLD = 2.0  # 2–4 days → attention
EAT_TODAY_THRESHOLD = 0.0  # 0–2 days → urgent


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def compute_days_left(estimated_expiry: datetime, now: datetime | None = None) -> float:
    """
    Truthful days remaining from the stored expiry deadline.
    Negative values mean the deadline has passed.
    """
    now = now or utc_now()
    return (estimated_expiry - now).total_seconds() / 86_400


def compute_status(days_left: float) -> str:
    """
    Map days-left to the same status vocabulary the decision engine uses
    (FRESH / EAT_SOON / EAT_TODAY / SPOILED) so scan results and
    inventory listings speak one language.
    """
    if days_left <= 0:
        return "SPOILED"
    if days_left < EAT_SOON_THRESHOLD:
        return "EAT_TODAY"
    if days_left <= FRESH_THRESHOLD:
        return "EAT_SOON"
    return "FRESH"


def remaining_fraction_of_life(
    estimated_expiry: datetime, scanned_at: datetime, now: datetime | None = None
) -> float:
    """
    Fraction of the item's allotted life that is left *right now*.
    Used when switching storage methods, so elapsed time is preserved and
    users cannot 'reset the clock' by toggling storage back and forth.

    Returns a value in [0, 1].
    """
    now = now or utc_now()
    total = max((estimated_expiry - scanned_at).total_seconds(), 60.0)  # avoid /0 on same-moment updates
    remaining = max((estimated_expiry - now).total_seconds(), 0.0)
    return min(remaining / total, 1.0)
