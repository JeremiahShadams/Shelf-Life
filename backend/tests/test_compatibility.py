"""Unit tests for the ethylene compatibility engine.

The API surface is covered by the live suite; these lock the pure logic,
especially the recommendation text, which must never contain empty groups.
"""

from app.ai.compatibility import check_compatibility


def test_apple_and_banana_reports_the_pair():
    result = check_compatibility(["Apple", "Banana"])

    assert len(result["incompatible_pairs"]) == 1
    pair = result["incompatible_pairs"][0]
    assert {pair["producer"], pair["sensitive"]} == {"Apple", "Banana"}


def test_recommendation_never_has_empty_parentheses():
    # Regression: Apple and Banana are both producers *and* sensitive, so a
    # recommendation built from "fruits that aren't producers" was empty.
    result = check_compatibility(["Apple", "Banana"])

    recommendation = result["recommendation"]
    assert "()" not in recommendation
    assert "Apple" in recommendation
    assert "Banana" in recommendation


def test_compatible_group_has_no_pairs():
    result = check_compatibility(["Orange", "Watermelon"])

    assert result["incompatible_pairs"] == []
    assert "safely" in result["recommendation"].lower()


def test_single_fruit_is_trivially_compatible():
    result = check_compatibility(["Mango"])

    assert result["incompatible_pairs"] == []
    assert "only one fruit" in result["recommendation"].lower()
