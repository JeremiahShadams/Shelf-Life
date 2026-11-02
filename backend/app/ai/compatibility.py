"""
Shelf Life Estimator — Ethylene Compatibility Engine
======================================================
Determines which fruits can be safely stored together based on
ethylene gas production and sensitivity.

Science:
    Some fruits (like apples, bananas, avocados) emit ethylene gas
    as they ripen. This gas accelerates ripening in nearby fruits
    that are ethylene-sensitive, causing them to spoil faster.

DSA Concepts:
    - Graph (Adjacency List): Models fruit-to-fruit conflict relationships
    - Graph Coloring (simplified): Groups fruits into compatible storage groups
    - Set operations: Efficient membership testing for producers/sensitives
"""

from __future__ import annotations


# ============================================
# Ethylene Data — Which fruits produce/sense ethylene
# ============================================
# DSA: Using frozensets for O(1) membership testing
# frozenset = an immutable set (can't be accidentally modified)

ETHYLENE_PRODUCERS: frozenset[str] = frozenset({
    "Apple", "Apricot", "Avocado", "Banana", "Cantaloupe",
    "Fig", "Guava", "Kiwi", "Mango", "Nectarine",
    "Papaya", "Passion Fruit", "Peach", "Pear", "Persimmon",
    "Plantain", "Plum", "Soursop", "Jackfruit",
})

ETHYLENE_SENSITIVE: frozenset[str] = frozenset({
    "Apple", "Banana", "Blueberry", "Blackberry", "Cherry",
    "Cranberry", "Dragon Fruit", "Fig", "Grape", "Guava",
    "Kiwi", "Lychee", "Mango", "Orange", "Papaya",
    "Peach", "Pear", "Persimmon", "Pineapple", "Plum",
    "Raspberry", "Star Fruit", "Strawberry", "Watermelon",
})


# ============================================
# DSA: Adjacency List — Graph of Conflicts
# ============================================
# A graph where each node is a fruit and each edge means
# "these two fruits should NOT be stored together."
#
# We build this dynamically: a producer conflicts with
# every sensitive fruit (except itself — a fruit can
# be both producer AND sensitive, like Apple).
#
# Lookup time: O(1) to check if fruit A conflicts with fruit B
# Space: O(P × S) where P = producers, S = sensitives
#
# Real-world analogy: This is like a social network's
# "blocked users" list — instant lookup for "is this person blocked?"

def build_conflict_graph() -> dict[str, set[str]]:
    """
    Build an adjacency list representing ethylene conflicts.

    Each key is a fruit name, and the value is a set of fruits
    that it conflicts with (i.e., should NOT be stored together).

    Returns:
        dict[str, set[str]]: The conflict adjacency list.
    """
    conflicts: dict[str, set[str]] = {}

    for producer in ETHYLENE_PRODUCERS:
        for sensitive in ETHYLENE_SENSITIVE:
            if producer == sensitive:
                continue  # A fruit doesn't conflict with itself

            # Add bidirectional edge (A conflicts with B = B conflicts with A)
            conflicts.setdefault(producer, set()).add(sensitive)
            conflicts.setdefault(sensitive, set()).add(producer)

    return conflicts


# Build the graph once at module load time (O(P×S), runs once)
CONFLICT_GRAPH: dict[str, set[str]] = build_conflict_graph()


def are_compatible(fruit_a: str, fruit_b: str) -> bool:
    """
    Check if two fruits can be safely stored together.

    Args:
        fruit_a: Name of the first fruit.
        fruit_b: Name of the second fruit.

    Returns:
        True if they can be stored together safely, False otherwise.

    Time Complexity: O(1) — set membership test.
    """
    # If neither is in the conflict graph, they're compatible
    conflicts = CONFLICT_GRAPH.get(fruit_a, set())
    return fruit_b not in conflicts


def check_compatibility(fruit_names: list[str]) -> dict:
    """
    Check compatibility for a group of fruits the user wants to store together.

    This is the main function called by the API endpoint.

    Args:
        fruit_names: List of fruit names to check.

    Returns:
        dict with keys:
            - compatible_groups: List of fruit groups that can be stored together
            - incompatible_pairs: List of conflicting pairs with warnings
            - recommendation: Human-readable storage recommendation

    DSA: Uses a simplified graph coloring approach.
         Graph coloring assigns "colors" to nodes such that no two
         adjacent (conflicting) nodes share a color. Each color
         becomes a storage group.

         Our simplified version:
         1. Find all incompatible pairs
         2. Separate ethylene producers into their own group
         3. Group remaining fruits together

    Time Complexity: O(n²) where n = number of fruits provided.
    Since n is typically small (< 20 fruits), this is fine.
    """
    # Normalize fruit names to title case for matching
    fruits = [name.strip().title() for name in fruit_names]

    # Remove duplicates while preserving order
    seen = set()
    unique_fruits = []
    for f in fruits:
        if f not in seen:
            seen.add(f)
            unique_fruits.append(f)
    fruits = unique_fruits

    if len(fruits) < 2:
        return {
            "compatible_groups": [fruits],
            "incompatible_pairs": [],
            "recommendation": "Only one fruit — no compatibility issues!",
        }

    # Step 1: Find all incompatible pairs — O(n²)
    incompatible_pairs = []
    for i, fruit_a in enumerate(fruits):
        for fruit_b in fruits[i + 1:]:
            if not are_compatible(fruit_a, fruit_b):
                # Determine which is the producer
                if fruit_a in ETHYLENE_PRODUCERS and fruit_b in ETHYLENE_SENSITIVE:
                    producer, sensitive = fruit_a, fruit_b
                elif fruit_b in ETHYLENE_PRODUCERS and fruit_a in ETHYLENE_SENSITIVE:
                    producer, sensitive = fruit_b, fruit_a
                else:
                    producer, sensitive = fruit_a, fruit_b

                incompatible_pairs.append({
                    "producer": producer,
                    "sensitive": sensitive,
                    "warning": (
                        f"{producer} produces ethylene gas that will ripen "
                        f"your {sensitive} faster. Store them separately."
                    ),
                })

    # Step 2: Group fruits — simplified graph coloring
    # Producers go in their own group, everything else groups together
    producer_group = [f for f in fruits if f in ETHYLENE_PRODUCERS]
    safe_group = [f for f in fruits if f not in ETHYLENE_PRODUCERS]

    compatible_groups = []
    if safe_group:
        compatible_groups.append(safe_group)
    if producer_group:
        # Each strong producer ideally gets its own space,
        # but for simplicity we group all producers together
        compatible_groups.append(producer_group)

    # Step 3: Generate recommendation
    if not incompatible_pairs:
        recommendation = "All these fruits can be stored together safely! ✅"
    elif len(producer_group) == 1:
        recommendation = (
            f"Store {producer_group[0]} separately from the others. "
            f"{', '.join(safe_group)} can be stored together."
        )
    elif producer_group:
        recommendation = (
            f"Ethylene producers ({', '.join(producer_group)}) should be stored "
            f"away from sensitive fruits ({', '.join(safe_group)})."
        )
    else:
        recommendation = "These fruits have some interactions — check the warnings above."

    return {
        "compatible_groups": compatible_groups,
        "incompatible_pairs": incompatible_pairs,
        "recommendation": recommendation,
    }
