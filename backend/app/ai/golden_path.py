"""
Golden Path Demo Data
======================
Curated, perfect responses for pitch demonstrations.

When demo mode is enabled and the classifier returns a known demo fruit,
the Golden Path overrides the freshness score to keep the demo stable.

Usage: Import GOLDEN_PATH_DEMOS and check if a fruit name
matches before using the mock freshness score.
"""

GOLDEN_PATH_DEMOS: dict[str, dict] = {
    "banana": {
        "freshness_score": 0.82,
        "freshness_label": "Fresh",
    },
    "apple": {
        "freshness_score": 0.91,
        "freshness_label": "Fresh",
    },
    "mango": {
        "freshness_score": 0.65,
        "freshness_label": "Slightly Aged",
    },
    "strawberry": {
        "freshness_score": 0.73,
        "freshness_label": "Slightly Aged",
    },
    "orange": {
        "freshness_score": 0.88,
        "freshness_label": "Fresh",
    },
    "avocado": {
        "freshness_score": 0.58,
        "freshness_label": "Aging",
    },
}


def get_golden_path(fruit_name: str) -> dict | None:
    """
    Returns curated demo data if the fruit matches a golden path entry.
    Returns None otherwise (fall through to real AI).
    """
    return GOLDEN_PATH_DEMOS.get(fruit_name.lower())
